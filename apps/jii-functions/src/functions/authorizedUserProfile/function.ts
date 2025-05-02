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
import express, { Response } from "express";
import { onRequest } from "firebase-functions/v2/https";
import { z } from "zod";

import { checkResidentsRoster } from "../../helpers/firebaseAdmin";
import {
  errorHandler,
  makeRateLimiter,
  makeValidateUserPayload,
} from "../../helpers/middleware";
import { getRecidivizUserProfile } from "../../helpers/recidivizUsers";
import { verifyToken } from "./middleware";

const app = express();

app.use(makeRateLimiter());
app.use(verifyToken);
const auth0TokenPayloadSchema = z.object({
  userId: z.string(),
  stateCode: z.string().toUpperCase(),
});
type Auth0UserPayload = z.infer<typeof auth0TokenPayloadSchema>;
app.use(makeValidateUserPayload(auth0TokenPayloadSchema));

// there is only one route in this app, but Firebase rewrite rules may affect what it is.
// using a wildcard route means we don't have to keep it manually in sync with the config
app.get(
  "*",
  async (
    request,
    response: Response<unknown, { userData: Auth0UserPayload }>,
    next,
  ) => {
    try {
      const { userData } = response.locals;
      if (userData.stateCode === "RECIDIVIZ") {
        // assumed to be a valid user email, though this will throw if it isn't
        const userProfile = await getRecidivizUserProfile(userData.userId);
        response.json({ userProfile });
      } else {
        const userProfile = await checkResidentsRoster(
          userData.stateCode,
          userData.userId,
        );
        if (userProfile) {
          response.json({ userProfile });
        } else {
          response.status(404).json({ error: "User not found" });
        }
      }
    } catch (e) {
      next(e);
    }
  },
);

setupExpressErrorHandler(app, {
  // we should only be throwing errors in case of malfunction,
  // not for routine login failures
  shouldHandleError: () => true,
});

app.use(errorHandler);

export const authorizedUserProfile = onRequest(
  {
    cors: true,
  },
  app,
);
