// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { describe, expect, test } from "vitest";

import {
  testPrismaClient,
  testTRPCClient,
} from "~sentencing-server/test/setup";
import { fakeOffense } from "~sentencing-server/test/setup/seed";

describe("offense router", () => {
  describe("getOffenses", () => {
    test("should return only offenses that have insights", async () => {
      // Create a new offense that won't have an insight
      await testPrismaClient.offense.create({
        data: {
          stateCode: fakeOffense.stateCode,
          name: "New Offense",
          isSexOffense: false,
          isViolentOffense: true,
          frequency: 10,
        },
      });

      const returnedOffenses = await testTRPCClient.offense.getOffenses.query();

      // Only the original fake offense should be returned
      expect(returnedOffenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: fakeOffense.name,
            isSexOffense: false,
            isViolentOffense: true,
            frequency: fakeOffense.frequency,
          }),
        ]),
      );
    });
  });
});
