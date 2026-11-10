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

import { beforeEach } from "vitest";

import { getPrismaClientForStateCode } from "~@idaho-th/prisma";
import { StateCode } from "~@idaho-th/prisma/client";

import { resetDb } from "./utils";

// Tests hit a real Postgres instance (see libs/@idaho-th/prisma/compose.yml,
// test-db service) instead of mocking Prisma. Every test starts from a clean
// database — build the rows a test needs with the factories in
// ~@idaho-th/trpc/test/factories.
export const testPrismaClient = getPrismaClientForStateCode(StateCode.US_ID);

beforeEach(async () => {
  await resetDb(testPrismaClient);
});
