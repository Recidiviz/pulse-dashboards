// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { TRPCError } from "@trpc/server";

import { TRPCFastifyRequest } from "../../context";

// HTTP headers are flattened to lowercase in Fastify
const STATE_CODE_HEADER_KEY = "statecode";
const DEMO_DATA_HEADER_KEY = "usedemodata";

/**
 * Any request to a data CRUD endpoint should have some standard headers
 * used for dispatching them to the correct database. This function validates
 * that they exist and are supported, BUT NOT that the caller has permission
 * to access the indicated database!
 */
export function validateCRUDHeaders(req: TRPCFastifyRequest) {
  const stateCode = req.headers[STATE_CODE_HEADER_KEY];

  if (!stateCode || typeof stateCode !== "string") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Unsupported state code provided in request headers: ${stateCode}`,
    });
  }
  const isDemoRequest = req.headers[DEMO_DATA_HEADER_KEY] === "true";
  return { stateCode, isDemoRequest };
}
