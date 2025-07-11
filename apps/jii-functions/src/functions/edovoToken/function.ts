// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { setupExpressErrorHandler } from "@sentry/node";
import express, { NextFunction, Request, Response } from "express";
import { onRequest } from "firebase-functions/v2/https";

import { tokenAuthResponseSchema } from "~auth0-jii";

import {
  checkDemoResidentsRoster,
  getFirebaseToken,
} from "../../helpers/firebaseAdmin";
import {
  errorHandler,
  makeRateLimiter,
  makeValidateUserPayload,
} from "../../helpers/middleware";
import { segment } from "../../helpers/segment";
import {
  checkRecidivizEmployeeRoster,
  edovoIdTokenPayloadSchema,
  lookupResident,
} from "./helpers";
import { decryptToken, verifyToken } from "./middleware";

const app = express();

app.use(makeRateLimiter());
app.use(decryptToken);
app.use(verifyToken);
app.use(makeValidateUserPayload(edovoIdTokenPayloadSchema));

// there is only one route in this app, but Firebase rewrite rules may affect what it is.
// using a wildcard route means we don't have to keep it manually in sync with the config
app.get("/*", async (request, response, next): Promise<void> => {
  try {
    const { userData } = response.locals;
    // middleware should have populated this or thrown an error, but just to be safe
    if (!userData) throw new Error("Missing expected user data");

    let firebaseToken: string;
    let isRecidiviz = false;
    const { encryptedEdovoToken } = response.locals;

    // the order of these checks is important; earlier ones
    // are intentionally chosen to supersede later ones that address edge cases
    let userProfile = await lookupResident(userData);
    if (!userProfile) {
      userProfile = await checkRecidivizEmployeeRoster(userData);
      isRecidiviz = !!userProfile;
    }
    if (!userProfile) {
      const demoUserMatch = await checkDemoResidentsRoster(
        userData.facility_state,
        userData.inmate_id,
      );
      if (demoUserMatch) {
        userProfile = demoUserMatch;
      }
    }

    if (userProfile) {
      firebaseToken = await getFirebaseToken(
        `${userData.facility_state}_${userData.inmate_id}`,
        userProfile,
      );

      response.json(
        tokenAuthResponseSchema.parse({ firebaseToken, user: userProfile }),
      );
      segment.track("backend_edovo_login_succeeded", {
        isRecidiviz,
        isDemoUser: !userProfile.permissions?.includes("live_data"),
        pseudonymizedId: userProfile.pseudonymizedId,
        stateCode: userProfile.stateCode,
        encryptedEdovoToken,
      });
    } else {
      response
        .status(403)
        .json({ error: "You are not authorized to access this application" });

      segment.track("backend_edovo_login_denied", {
        isRecidiviz: isRecidiviz,
        stateCode: userData.facility_state,
        encryptedEdovoToken,
      });
    }
    await segment.flush();
  } catch (e) {
    next(e);
  }
});

setupExpressErrorHandler(app, {
  // we should only be throwing errors in case of malfunction,
  // not for routine login failures
  shouldHandleError: () => true,
});

app.use(
  async (
    error: Error,
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    const { encryptedEdovoToken, userData } = response.locals;
    let stateCode: string | undefined;
    if (userData?.facility_state) {
      stateCode = userData.facility_state;
    }

    next(error);

    segment.track("backend_edovo_login_internal_error", {
      isRecidiviz: false,
      stateCode,
      encryptedEdovoToken,
    });
    await segment.flush();
  },
);

app.use(errorHandler);

export const edovoToken = onRequest(
  {
    cors: true,
  },
  app,
);
