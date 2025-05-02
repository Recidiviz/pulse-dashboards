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

import { NextFunction, Request, Response } from "express";
import jwt from "express-jwt";
import { defineString } from "firebase-functions/params";

const AUTH0_PUBLIC_KEY = defineString("AUTH0_PUBLIC_KEY");

/**
 * Express middleware that will verify a JWT signed by the Auth0 service account.
 * Will throw if the JWT is missing or invalid.
 */
export async function verifyToken(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const handler = jwt({
    secret: AUTH0_PUBLIC_KEY.value().replace(/\\n/g, "\n"),
    algorithms: ["RS256"],
  });

  handler(request, response, next);
}
