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

import { expectTypeOf } from "vitest";

import { residentsConfigByState, StateCode } from "~@jii/configs";
import { ResidentFlagId } from "~@jii/prisma";

import {
  caller,
  mockCtx,
  testPseudonymizedId,
} from "../../../test/mockResidentProcedure";
import { testPrismaClient } from "../../../test/prisma";

// ResidentFlagId is a prisma type that has to be defined in the schema. ResidentsConfig can't
// import that type because that would import from the server scope to the universal scope. This
// type-level check lives in trpc (server scope) so it can see both sides and fail typecheck if
// they drift.
type ConfigResidentFlag = keyof Required<
  (typeof residentsConfigByState)[StateCode]
>["enabledResidentFlags"];
expectTypeOf<ResidentFlagId>().toEqualTypeOf<ConfigResidentFlag>();

// Replace the enum so assertions don't depend on any specific production flags.
vi.mock("~@jii/prisma", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~@jii/prisma")>();
  return {
    ...actual,
    ResidentFlagId: {
      testStatewideEnabledFlag: "testStatewideEnabledFlag",
      testStatewideDisabledFlag: "testStatewideDisabledFlag",
      testPersonalFlag: "testPersonalFlag",
      testNeverEnabledFlag: "testNeverEnabledFlag",
      testFacilityEnabledFlag: "testFacilityEnabledFlag",
      testFacilityDisabledFlag: "testFacilityDisabledFlag",
    },
  };
});

const testFacilityId = "test-facility";

// Configure statewide and facility flags for the US_NE test state using the test
// flag IDs. The "enabled" flags use a past date so they're always active; the
// "disabled" flags use a far-future date so they're always inactive.
vi.mock("~@jii/configs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~@jii/configs")>();
  return {
    ...actual,
    residentsConfigByState: {
      ...actual.residentsConfigByState,
      US_NE: {
        ...actual.residentsConfigByState.US_NE,
        enabledResidentFlags: {
          testStatewideEnabledFlag: new Date("2020-01-01"),
          testStatewideDisabledFlag: new Date("2099-01-01"),
        },
        enabledResidentFacilityFlags: {
          "test-facility": {
            testFacilityEnabledFlag: new Date("2020-01-01"),
            testFacilityDisabledFlag: new Date("2099-01-01"),
          },
        },
      },
    },
  };
});

async function createResident(facilityId: string | null) {
  await testPrismaClient.resident.create({
    data: {
      pseudonymizedId: testPseudonymizedId,
      personExternalId: "ext-1",
      displayId: "display-1",
      importedAt: new Date("2026-01-01"),
      stateSpecificData: {},
      facilityId,
    },
  });
}

// Intercept DB reads so tests don't depend on real DB state or enum values.
beforeEach(() => {
  vi.spyOn(testPrismaClient.residentFlagInstance, "findMany").mockResolvedValue(
    [],
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getFlags", () => {
  test("all_resident_flags_enabled permission returns all flags", async () => {
    mockCtx.permissions = ["all_resident_flags_enabled"];

    const result = await caller.getFlags({
      pseudonymizedId: testPseudonymizedId,
    });

    expect(result).toEqual({
      testStatewideEnabledFlag: true,
      testStatewideDisabledFlag: true,
      testPersonalFlag: true,
      testNeverEnabledFlag: true,
      testFacilityEnabledFlag: true,
      testFacilityDisabledFlag: true,
    });
  });

  test("returns empty object when no personal or statewide flags are set", async () => {
    const result = await caller.getFlags({
      pseudonymizedId: testPseudonymizedId,
    });

    expect(result).toEqual({});
  });

  describe("personal flags", () => {
    test("returns flags present in the DB", async () => {
      vi.mocked(
        testPrismaClient.residentFlagInstance.findMany,
      ).mockResolvedValue([
        {
          pseudonymizedId: testPseudonymizedId,
          effectiveAt: new Date("2020-01-01"),
          flagId: "testPersonalFlag" as ResidentFlagId,
        },
      ]);

      const result = await caller.getFlags({
        pseudonymizedId: testPseudonymizedId,
      });

      expect(result).toEqual({ testPersonalFlag: true });
    });

    test("queries by the input pseudonymizedId", async () => {
      await caller.getFlags({ pseudonymizedId: testPseudonymizedId });

      expect(
        testPrismaClient.residentFlagInstance.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            pseudonymizedId: testPseudonymizedId,
          }),
        }),
      );
    });
  });

  describe("statewide flags", () => {
    beforeEach(() => {
      mockCtx.stateCode = "US_NE";
    });

    test("returns flags whose config date is in the past", async () => {
      const result = await caller.getFlags({
        pseudonymizedId: testPseudonymizedId,
      });

      expect(result).toEqual({ testStatewideEnabledFlag: true });
    });

    test("does not return flags whose config date is in the future", async () => {
      const result = await caller.getFlags({
        pseudonymizedId: testPseudonymizedId,
      });

      expect(result).not.toHaveProperty("testStatewideDisabledFlag");
    });
  });

  describe("facility flags", () => {
    beforeEach(() => {
      mockCtx.stateCode = "US_NE";
    });

    test("returns flags whose config date is in the past for the resident's facility", async () => {
      await createResident(testFacilityId);

      const result = await caller.getFlags({
        pseudonymizedId: testPseudonymizedId,
      });

      expect(result).toEqual({
        testFacilityEnabledFlag: true,
        // US_NE also has a statewide flag enabled; it's asserted separately above
        testStatewideEnabledFlag: true,
      });
    });

    test("does not return flags whose config date is in the future", async () => {
      await createResident(testFacilityId);

      const result = await caller.getFlags({
        pseudonymizedId: testPseudonymizedId,
      });

      expect(result).not.toHaveProperty("testFacilityDisabledFlag");
    });

    test("does not return facility flags configured for a different facility", async () => {
      await createResident("some-other-facility");

      const result = await caller.getFlags({
        pseudonymizedId: testPseudonymizedId,
      });

      expect(result).toEqual({ testStatewideEnabledFlag: true });
    });

    test("does not throw when the resident has no facilityId", async () => {
      await createResident(null);

      const result = await caller.getFlags({
        pseudonymizedId: testPseudonymizedId,
      });

      expect(result).toEqual({ testStatewideEnabledFlag: true });
    });

    test("does not throw when the resident record does not exist", async () => {
      const result = await caller.getFlags({
        pseudonymizedId: testPseudonymizedId,
      });

      expect(result).toEqual({ testStatewideEnabledFlag: true });
    });
  });

  describe("merging personal, statewide, and facility flags", () => {
    beforeEach(() => {
      mockCtx.stateCode = "US_NE";
    });

    test("returns the union of personal DB flags, statewide config flags, and facility config flags", async () => {
      await createResident(testFacilityId);
      vi.mocked(
        testPrismaClient.residentFlagInstance.findMany,
      ).mockResolvedValue([
        {
          pseudonymizedId: testPseudonymizedId,
          effectiveAt: new Date("2020-01-01"),
          flagId: "testPersonalFlag" as ResidentFlagId,
        },
      ]);

      const result = await caller.getFlags({
        pseudonymizedId: testPseudonymizedId,
      });

      expect(result).toEqual({
        testPersonalFlag: true,
        testStatewideEnabledFlag: true,
        testFacilityEnabledFlag: true,
      });
    });
  });
});
