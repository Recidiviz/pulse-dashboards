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

import { Permission } from "~@jii/auth";

import type { AuthorizedResidentUserContext } from "../procedures/firebaseAuthedResidentProcedure";
import { baseProcedure } from "../procedures/init";
import { residentRouter } from "../router/routes/resident/router";
import { userId } from "./context";
import { testPrismaClient } from "./prisma";

export const testPseudonymizedId = "test-resident-id";

/**
 * Mutable context object that tests can modify before invoking routes.
 * Reset to defaults in beforeEach so tests start with a clean slate.
 */
export const mockCtx = {
  stateCode: "US_XX",
  pseudonymizedId: testPseudonymizedId,
  permissions: undefined as Permission[] | undefined,
};

vi.mock("../procedures/firebaseAuthedResidentProcedure", () => ({
  firebaseAuthedResidentProcedure: baseProcedure.use((opts) =>
    opts.next({
      ctx: {
        userId,
        stateCode: mockCtx.stateCode,
        prisma: testPrismaClient,
        userProfile: {
          stateCode: mockCtx.stateCode,
          pseudonymizedId: mockCtx.pseudonymizedId,
          permissions: mockCtx.permissions,
        },
      } satisfies AuthorizedResidentUserContext,
    }),
  ),
}));

beforeEach(() => {
  mockCtx.stateCode = "US_XX";
  mockCtx.pseudonymizedId = testPseudonymizedId;
  mockCtx.permissions = undefined;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const caller = residentRouter.createCaller({ req: {} as any });
