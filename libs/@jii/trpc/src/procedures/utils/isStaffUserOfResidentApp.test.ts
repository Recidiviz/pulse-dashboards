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

import type { PrismaClient } from "~@jii/prisma";

import type { AuthorizedResidentUserContext } from "../firebaseAuthedResidentProcedure";
import { isStaffUserOfResidentApp } from "./isStaffUserOfResidentApp";

const mockPrisma = {} as PrismaClient;

const baseCtx = {
  userId: "user-123",
  stateCode: "US_XX",
  prisma: mockPrisma,
};

test("returns false for a resident user", () => {
  const ctx: AuthorizedResidentUserContext = {
    ...baseCtx,
    userProfile: {
      stateCode: "US_XX",
      externalId: "DOC123",
      pseudonymizedId: "pseudo-abc",
    },
  };

  expect(isStaffUserOfResidentApp(ctx)).toBe(false);
});

test("returns true for a staff user", () => {
  const ctx: AuthorizedResidentUserContext = {
    ...baseCtx,
    userProfile: {
      stateCode: "US_XX",
    },
  };

  expect(isStaffUserOfResidentApp(ctx)).toBe(true);
});

test("returns true for a Recidiviz employee", () => {
  const ctx: AuthorizedResidentUserContext = {
    ...baseCtx,
    userProfile: {
      stateCode: "RECIDIVIZ",
      allowedStates: ["US_XX"],
    },
  };

  expect(isStaffUserOfResidentApp(ctx)).toBe(true);
});
