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

import { describe, expect, test } from "vitest";

import {
  getAgencyConfig,
  getAgencyConfigs,
} from "~@meetings/trpc/routes/config/utils";
import { testGlobalPrismaClient } from "~@meetings/trpc/test/setup";

describe("getAgencyConfigs", () => {
  test("throws when an agency row references a base that doesn't exist", async () => {
    await testGlobalPrismaClient.agencyConfig.create({
      data: {
        id: "us_ne",
        parentId: "missing_base",
        version: 1,
        config: "name: Nebraska \nversion: 1 \nstateCode: US_NE",
      },
    });

    await expect(getAgencyConfigs()).rejects.toThrow(
      'AgencyConfig "us_ne" references missing base "missing_base"',
    );
  });

  test("throws when a row's stored config fails schema validation", async () => {
    await testGlobalPrismaClient.agencyConfig.create({
      data: { id: "test_base", version: 1, config: "version: 1" },
    });
    await testGlobalPrismaClient.agencyConfig.create({
      data: {
        id: "us_ne",
        parentId: "test_base",
        // Missing the required `name` field.
        version: 1,
        config: "stateCode: US_NE \nversion: 1",
      },
    });

    await expect(getAgencyConfigs()).rejects.toThrow();
  });

  test("skips rows whose id isn't in MEETINGS_STATE_CODES", async () => {
    await testGlobalPrismaClient.agencyConfig.create({
      data: { id: "test_base", version: 1, config: "version: 1" },
    });
    await testGlobalPrismaClient.agencyConfig.create({
      data: {
        id: "us_ne",
        parentId: "test_base",
        version: 1,
        config: "name: Nebraska \nversion: 1 \nstateCode: US_NE",
      },
    });
    await testGlobalPrismaClient.agencyConfig.create({
      data: {
        id: "test_agency",
        parentId: "test_base",
        version: 1,
        config: "name: Test Agency \nversion: 1 \nstateCode: US_XX",
      },
    });

    const configs = await getAgencyConfigs();

    expect(Object.keys(configs)).toEqual(["US_NE"]);
  });

  test("never surfaces a base row as if it were a full agency config", async () => {
    await testGlobalPrismaClient.agencyConfig.create({
      data: { id: "test_base", version: 1, config: "version: 1" },
    });

    const configs = await getAgencyConfigs();

    expect(configs).toEqual({});
  });

  test("overrides a mismatched stateCode with the row id", async () => {
    await testGlobalPrismaClient.agencyConfig.create({
      data: { id: "test_base", version: 1, config: "version: 1" },
    });
    await testGlobalPrismaClient.agencyConfig.create({
      data: {
        id: "us_ne",
        parentId: "test_base",
        version: 1,
        // Declares US_ME even though this row's id is us_ne.
        config: "name: Nebraska \nversion: 1 \nstateCode: US_ME",
      },
    });

    const configs = await getAgencyConfigs();

    expect(configs["US_NE"]).toMatchObject({ stateCode: "US_NE" });
  });
});

describe("getAgencyConfig", () => {
  test("returns undefined for a state code that isn't in MEETINGS_STATE_CODES", async () => {
    await expect(getAgencyConfig("US_XX")).resolves.toBeUndefined();
  });

  test("returns undefined when no row exists for a supported state code", async () => {
    await expect(getAgencyConfig("US_NE")).resolves.toBeUndefined();
  });

  test("returns the merged config for the requested state", async () => {
    await testGlobalPrismaClient.agencyConfig.create({
      data: { id: "base", version: 1, config: "version: 1" },
    });
    await testGlobalPrismaClient.agencyConfig.create({
      data: {
        id: "us_ne",
        parentId: "base",
        version: 1,
        config: "name: Nebraska \nversion: 1 \nstateCode: US_NE",
      },
    });

    await expect(getAgencyConfig("US_NE")).resolves.toMatchObject({
      name: "Nebraska",
      stateCode: "US_NE",
    });
  });

  test("throws when the row references a base that doesn't exist", async () => {
    await testGlobalPrismaClient.agencyConfig.create({
      data: {
        id: "us_ne",
        parentId: "missing_base",
        version: 1,
        config: "name: Nebraska \nversion: 1 \nstateCode: US_NE",
      },
    });

    await expect(getAgencyConfig("US_NE")).rejects.toThrow(
      'AgencyConfig "us_ne" references missing base "missing_base"',
    );
  });

  test("overrides a mismatched stateCode with the row id", async () => {
    await testGlobalPrismaClient.agencyConfig.create({
      data: { id: "base", version: 1, config: "version: 1" },
    });
    await testGlobalPrismaClient.agencyConfig.create({
      data: {
        id: "us_ne",
        parentId: "base",
        version: 1,
        // Declares US_ME even though this row's id is us_ne.
        config: "name: Nebraska \nversion: 1 \nstateCode: US_ME",
      },
    });

    await expect(getAgencyConfig("US_NE")).resolves.toMatchObject({
      stateCode: "US_NE",
    });
  });

  test("a broken config in another state doesn't break a lookup for a healthy one", async () => {
    await testGlobalPrismaClient.agencyConfig.create({
      data: { id: "base", version: 1, config: "version: 1" },
    });
    await testGlobalPrismaClient.agencyConfig.create({
      data: {
        id: "us_ne",
        parentId: "base",
        version: 1,
        config: "name: Nebraska \nversion: 1 \nstateCode: US_NE",
      },
    });
    await testGlobalPrismaClient.agencyConfig.create({
      data: {
        id: "us_tn",
        parentId: "base",
        // Missing the required `name` field — would fail schema validation.
        version: 1,
        config: "stateCode: US_TN \nversion: 1",
      },
    });

    await expect(getAgencyConfig("US_NE")).resolves.toMatchObject({
      stateCode: "US_NE",
    });
  });
});
