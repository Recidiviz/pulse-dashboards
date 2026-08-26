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

import type { Request, Response } from "express";

import { mintScopedKeyHandler } from "./mintScopedKeyHandler";
import { PersonScopedKeyMinter } from "./PersonScopedKeyMinter";

/**
 * POST /api/:stateCode/workflows/person-scoped-key
 *
 * Mints a scoped Typesense API key per collection for the authenticated user's
 * person (client/resident) search, filtered to their person-visibility scope.
 *
 * Body: { system: "SUPERVISION" | "INCARCERATION" | "ALL" }
 * Returns: {
 *   keys: Record<collectionName, string>,
 *   expiresAt: ISO8601,
 *   typesenseHost: string,
 * }
 */
export async function mintPersonScopedKey(req: Request, res: Response) {
  return mintScopedKeyHandler(
    req,
    res,
    (stateCode, ctx) => new PersonScopedKeyMinter(stateCode, ctx),
  );
}
