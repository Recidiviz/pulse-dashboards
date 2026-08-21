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

import tk from "timekeeper";

import { StateCode } from "~@jii/configs";
import { UserFlagId } from "~@jii/prisma";

import { userId } from "../test/context";
import { testPrismaClient } from "../test/prisma";
import { isUserFlagActive } from "./featureFlags";

const stateCode: StateCode = "US_NE";
const activeStatewideFlag = "testActiveStatewideFlag" as UserFlagId;
const futureStatewideFlag = "testFutureStatewideFlag" as UserFlagId;
const personalOnlyFlag = "testPersonalOnlyFlag" as UserFlagId;

// vi.mock factories below are hoisted above top-level const declarations, so
// these dates must be declared via vi.hoisted to be visible inside them.
const { PAST_DATE, FUTURE_DATE } = vi.hoisted(() => ({
  PAST_DATE: new Date("2020-01-01T00:00:00Z"),
  FUTURE_DATE: new Date("2099-01-01T00:00:00Z"),
}));

// Replace the enum so assertions don't depend on any specific production flags.
vi.mock("~@jii/prisma", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~@jii/prisma")>();
  return {
    ...actual,
    UserFlagId: {
      testActiveStatewideFlag: "testActiveStatewideFlag",
      testFutureStatewideFlag: "testFutureStatewideFlag",
      testPersonalOnlyFlag: "testPersonalOnlyFlag",
    },
  };
});

// Configure statewide flags for the US_NE test state using the test flag IDs.
// testActiveStatewideFlag uses a past date so it's always statewide-active;
// testFutureStatewideFlag uses a far-future date so it's never statewide-active.
// testPersonalOnlyFlag is intentionally left unconfigured so it always falls
// through to the DB check.
vi.mock("~@jii/configs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~@jii/configs")>();
  return {
    ...actual,
    residentsConfigByState: {
      ...actual.residentsConfigByState,
      US_NE: {
        ...actual.residentsConfigByState.US_NE,
        enabledUserFlags: {
          testActiveStatewideFlag: PAST_DATE,
          testFutureStatewideFlag: FUTURE_DATE,
        },
      },
    },
  };
});

beforeEach(() => {
  // unlike most of the tests in this library, we have to mock out Prisma here;
  // we are using fake flag IDs for stability and flexibility, and those values will
  // violate the PG-level enum if we try to actually write them to the DB.
  vi.spyOn(testPrismaClient.userFlagInstance, "count").mockResolvedValue(0);
});

afterEach(() => {
  tk.reset();
  vi.restoreAllMocks();
});

describe("isUserFlagActive", () => {
  test("statewide flag effective in the past, no personal flag", async () => {
    const result = await isUserFlagActive({
      flagId: activeStatewideFlag,
      userIdFromAuthProvider: userId,
      stateCode,
      prisma: testPrismaClient,
    });

    expect(result).toBe(true);
  });

  test("statewide flag effective exactly now, no personal flag", async () => {
    tk.freeze(PAST_DATE);

    const result = await isUserFlagActive({
      flagId: activeStatewideFlag,
      userIdFromAuthProvider: userId,
      stateCode,
      prisma: testPrismaClient,
    });

    expect(result).toBe(true);
  });

  test("statewide flag effective in the future, no personal flag", async () => {
    const result = await isUserFlagActive({
      flagId: futureStatewideFlag,
      userIdFromAuthProvider: userId,
      stateCode,
      prisma: testPrismaClient,
    });

    expect(result).toBe(false);
  });

  test("statewide flag effective in the future, active personal flag", async () => {
    vi.mocked(testPrismaClient.userFlagInstance.count).mockResolvedValue(1);

    const result = await isUserFlagActive({
      flagId: futureStatewideFlag,
      userIdFromAuthProvider: userId,
      stateCode,
      prisma: testPrismaClient,
    });

    expect(result).toBe(true);
  });

  test("statewide flag effective in the past, active personal flag", async () => {
    vi.mocked(testPrismaClient.userFlagInstance.count).mockResolvedValue(1);

    const result = await isUserFlagActive({
      flagId: activeStatewideFlag,
      userIdFromAuthProvider: userId,
      stateCode,
      prisma: testPrismaClient,
    });

    expect(result).toBe(true);
  });

  test("no statewide flag, active personal flag", async () => {
    vi.mocked(testPrismaClient.userFlagInstance.count).mockResolvedValue(1);

    const result = await isUserFlagActive({
      flagId: personalOnlyFlag,
      userIdFromAuthProvider: userId,
      stateCode,
      prisma: testPrismaClient,
    });

    expect(result).toBe(true);
  });

  test("no statewide flag, no personal flag", async () => {
    const result = await isUserFlagActive({
      flagId: personalOnlyFlag,
      userIdFromAuthProvider: userId,
      stateCode,
      prisma: testPrismaClient,
    });

    expect(result).toBe(false);
  });

  // because we are mocking all prisma calls we do want to verify that we're issuing the correct query
  test("queries the DB with the given userId, flagId, and effectiveAt <= now", async () => {
    const now = new Date("2026-03-01T00:00:00Z");
    tk.freeze(now);

    await isUserFlagActive({
      flagId: personalOnlyFlag,
      userIdFromAuthProvider: userId,
      stateCode,
      prisma: testPrismaClient,
    });

    expect(testPrismaClient.userFlagInstance.count).toHaveBeenCalledWith({
      where: {
        userId,
        flagId: personalOnlyFlag,
        effectiveAt: { lte: now },
      },
    });
  });
});
