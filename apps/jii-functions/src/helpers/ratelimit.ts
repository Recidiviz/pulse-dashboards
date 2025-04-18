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

import { Express } from "express";
import rateLimit from "express-rate-limit";

/**
 * Applies rate limiter middleware to the provided Express app with standard settings
 */
export function useRateLimiter(app: Express) {
  // matches the params set for the staff server, as a reasonable baseline
  const limiter = rateLimit({
    windowMs: 1000, // 1 second = 1000ms
    max: 15, // each IP address gets 15 requests per 1 second
    standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // disabling the `X-RateLimit-*` headers
  });
  app.use(limiter);
}
