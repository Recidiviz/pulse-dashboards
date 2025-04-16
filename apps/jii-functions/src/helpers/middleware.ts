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
import rateLimit from "express-rate-limit";

/**
 * Applies rate limiter middleware to the provided Express app with standard settings
 */
export function rateLimiter() {
  // matches the params set for the staff server, as a reasonable baseline
  return rateLimit({
    windowMs: 1000, // 1 second = 1000ms
    max: 15, // each IP address gets 15 requests per 1 second
    standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // disabling the `X-RateLimit-*` headers
  });
}

/**
 * Express middleware that converts thrown errors into JSON responses.
 * Should be applied last (after the endpoint function)
 */
export function errorHandler(
  error: Error,
  request: Request,
  response: Response,
  // if we don't define the fourth arg, express won't recognize this as an error handler.
  // we don't need to use it because we are terminating all requests here
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  // this is what the JWT middleware throws
  if (error.name === "UnauthorizedError") {
    // we might want to clean up this message eventually
    // but forwarding the original will help with testing
    response.status(401).json({ error });
  } else {
    response.status(500).json({ error });
  }
}
