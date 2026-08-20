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

import { caller, mockCtx } from "../../../../test/mockResidentProcedure";
import { testPrismaClient } from "../../../../test/prisma";

const facilityWithEarlierName = {
  id: "facility-2",
  name: "Alpha Facility",
  importedAt: new Date("2026-01-01"),
};

const facilityWithLaterName = {
  id: "facility-1",
  name: "Zulu Facility",
  importedAt: new Date("2026-01-01"),
};

describe("getFacilities", () => {
  test("throws FORBIDDEN when the user does not have the enhanced permission", async () => {
    const error: TRPCError = await caller.getFacilities().catch((e) => e);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe("FORBIDDEN");
  });

  describe("with the enhanced permission", () => {
    beforeEach(() => {
      mockCtx.permissions = ["enhanced"];
    });

    test("returns facilities sorted alphabetically by name, excluding importedAt", async () => {
      // inserted in reverse-alphabetical order so the assertion below only
      // passes if the endpoint actually sorts the results, rather than
      // happening to return them in insertion order
      await testPrismaClient.incarcerationFacility.createMany({
        data: [facilityWithLaterName, facilityWithEarlierName],
      });

      const result = await caller.getFacilities();

      expect(result).toEqual([
        { id: facilityWithEarlierName.id, name: facilityWithEarlierName.name },
        { id: facilityWithLaterName.id, name: facilityWithLaterName.name },
      ]);
    });

    test("throws NOT_FOUND when no facilities exist", async () => {
      const error: TRPCError = await caller.getFacilities().catch((e) => e);

      expect(error).toBeInstanceOf(TRPCError);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("No facilities found");
    });
  });
});
