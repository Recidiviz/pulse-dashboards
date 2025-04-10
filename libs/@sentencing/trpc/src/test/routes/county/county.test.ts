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

import { testPrismaClient, testTRPCClient } from "~@sentencing/trpc/test/setup";

describe("county router", () => {
  describe("getCounties", () => {
    test("should return list of counties and their districts", async () => {
      await testPrismaClient.district.create({
        data: {
          id: "district-id-1",
          name: "District 12",
          stateCode: "US_ID",
        },
      });

      await testPrismaClient.county.create({
        data: {
          id: "county-id-1",
          name: "County 1",
          stateCode: "US_ID",
          districtId: "district-id-1",
        },
      });

      const returnedCounties = await testTRPCClient.county.getCounties.query();

      expect(returnedCounties).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            county: "County 1",
            district: "District 12",
          }),
        ]),
      );
    });
  });
});
