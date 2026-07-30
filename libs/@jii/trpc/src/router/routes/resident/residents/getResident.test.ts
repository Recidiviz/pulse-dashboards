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

import {
  caller,
  mockCtx,
  testPseudonymizedId,
} from "../../../../test/mockResidentProcedure";
import { testPrismaClient } from "../../../../test/prisma";

// findStateSchema is mocked so these tests don't depend on any real state's schema
const { mockFindStateSchema } = vi.hoisted(() => ({
  mockFindStateSchema: vi.fn(),
}));

vi.mock("~@jii/schemas", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~@jii/schemas")>();
  return { ...actual, findStateSchema: mockFindStateSchema };
});

const testResident = {
  pseudonymizedId: testPseudonymizedId,
  personExternalId: "ext-1",
  displayId: "display-1",
  givenNames: null,
  middleNames: null,
  surname: null,
  facilityId: null,
  unitId: null,
  officerId: null,
  importedAt: new Date("2026-01-01"),
  stateSpecificData: { rawField: "rawValue" },
};

beforeEach(() => {
  mockFindStateSchema.mockReset();
  mockFindStateSchema.mockReturnValue(undefined);
});

describe("getResident", () => {
  test("throws NOT_FOUND when the resident does not exist", async () => {
    // querying own pseudonymizedId so residentRestrictedMiddleware lets the
    // request through and the NOT_FOUND path in getResident itself is reached
    const error: TRPCError = await caller
      .getResident({ pseudonymizedId: testPseudonymizedId })
      .catch((e) => e);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe(
      `Resident ${testPseudonymizedId} could not be found.`,
    );
  });

  describe("when the resident exists", () => {
    beforeEach(async () => {
      await testPrismaClient.resident.create({ data: testResident });
    });

    test("returns the resident record with stateSpecificData undefined when no schema is registered", async () => {
      const result = await caller.getResident({
        pseudonymizedId: testPseudonymizedId,
      });

      expect(mockFindStateSchema).toHaveBeenCalledWith(mockCtx.stateCode);
      expect(result).toEqual({ ...testResident, stateSpecificData: undefined });
    });

    test("returns schema-validated stateSpecificData when a schema is registered", async () => {
      const parsedData = { knownField: "parsed" };
      mockFindStateSchema.mockReturnValue({ parse: vi.fn(() => parsedData) });

      const result = await caller.getResident({
        pseudonymizedId: testPseudonymizedId,
      });

      expect(result.stateSpecificData).toEqual(parsedData);
    });

    test("propagates the error when stateSpecificData fails schema validation", async () => {
      mockFindStateSchema.mockReturnValue({
        parse: vi.fn(() => {
          throw new Error("invalid shape");
        }),
      });

      await expect(
        caller.getResident({ pseudonymizedId: testPseudonymizedId }),
      ).rejects.toThrow("invalid shape");
    });
  });
});
