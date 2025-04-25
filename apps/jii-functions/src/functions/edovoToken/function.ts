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
import express from "express";
import { onRequest } from "firebase-functions/v2/https";

import { tokenAuthResponseSchema } from "~auth0-jii";

import { getFirebaseToken } from "../../helpers/firebaseAdmin";
import { errorHandler, rateLimiter } from "../../helpers/middleware";
import {
  checkRecidivizEmployeeRoster,
  checkResidentsRoster,
  edovoIdTokenPayloadSchema,
} from "./helpers";
import { decryptToken, verifyToken } from "./middleware";

const app = express();

app.use(rateLimiter());
app.use(decryptToken);
app.use(verifyToken);

// there is only one route in this app, but Firebase rewrite rules may affect what it is.
// using a wildcard route means we don't have to keep it manually in sync with the config
app.get("/*", async (request, response): Promise<void> => {
  const user = edovoIdTokenPayloadSchema.safeParse(request.user);

  if (!user.success) {
    response.status(400).json({ error: user.error });
    return;
  }

  let firebaseToken: string;

  const userData = user.data;

  let userProfile = await checkResidentsRoster(userData);
  if (!userProfile) {
    userProfile = await checkRecidivizEmployeeRoster(userData);
  }

  if (userProfile) {
    firebaseToken = await getFirebaseToken(
      `US_${userData.STATE}_${userData.USER_ID}`,
      userProfile,
    );

    response.json(
      tokenAuthResponseSchema.parse({ firebaseToken, user: userProfile }),
    );
  } else {
    response
      .status(403)
      .json({ error: "You are not authorized to access this application" });
  }
});

setupExpressErrorHandler(app);

app.use(errorHandler);

export const edovoToken = onRequest(
  {
    cors: true,
  },
  app,
);
