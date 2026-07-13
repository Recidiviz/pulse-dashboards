// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import {
  initFastifyAndSetUser,
  testGlobalPrismaClient,
  testTRPCClient,
} from "~@meetings/trpc/test/setup";
import { fakeStaff } from "~@meetings/trpc/test/setup/seed";

describe("config router", () => {
  beforeEach(async () => {
    await initFastifyAndSetUser({
      "https://dashboard.recidiviz.org/email_address": "test@recidiviz.org",
      "https://dashboard.recidiviz.org/app_metadata": {
        stateCode: "recidiviz",
        allowedStates: ["US_NE"],
      },
    });
  });

  describe("getNames", () => {
    test("Should include undefined display name for a base config", async () => {
      await testGlobalPrismaClient.agencyConfig.create({
        data: { id: "test_base", version: 1, config: "version: 1" },
      });

      const result = await testTRPCClient.v1.config.getNames.query();

      expect(result).toEqual({ test_base: undefined });
    });

    test("Should include the parsed name for an agency config", async () => {
      await testGlobalPrismaClient.agencyConfig.create({
        data: {
          id: "us_ne",
          parentId: "test_base",
          version: 1,
          config: "name: Nebraska",
        },
      });

      const result = await testTRPCClient.v1.config.getNames.query();

      expect(result).toEqual({ us_ne: "Nebraska" });
    });

    test("Should return only the most recent version per each id", async () => {
      await testGlobalPrismaClient.agencyConfig.create({
        data: {
          id: "us_ne",
          parentId: "test_base",
          version: 1,
          config: "name: Nebraska 1 \nversion: 1",
        },
      });
      await testGlobalPrismaClient.agencyConfig.create({
        data: {
          id: "us_ne",
          parentId: "test_base",
          version: 2,
          config: "name: Nebraska 2 \nversion: 2",
        },
      });
      await testGlobalPrismaClient.agencyConfig.create({
        data: { id: "test_base", version: 1, config: "version: 1" },
      });

      const result = await testTRPCClient.v1.config.getNames.query();

      expect(result).toEqual({ us_ne: "Nebraska 2", base: undefined });
    });

    test("Should return an empty object when there are no configs", async () => {
      const result = await testTRPCClient.v1.config.getNames.query();

      expect(result).toEqual({});
    });
  });

  describe("getByState", () => {
    test("Should return the raw config for the latest version of the given id", async () => {
      await testGlobalPrismaClient.agencyConfig.create({
        data: {
          id: "us_ne",
          version: 1,
          config: "name: Nebraska \nversion: 1",
        },
      });
      await testGlobalPrismaClient.agencyConfig.create({
        data: {
          id: "us_ne",
          version: 2,
          config: "name: Nebraska \nversion: 2",
        },
      });

      const result = await testTRPCClient.v1.config.getByState.query({
        id: "us_ne",
      });

      expect(result).toEqual("name: Nebraska \nversion: 2");
    });

    test("throws NOT_FOUND when no config exists for the given id", async () => {
      await expect(
        testTRPCClient.v1.config.getByState.query({ id: "unknown-id" }),
      ).rejects.toThrow("No config found for id: unknown-id");
    });
  });

  describe("authorization", () => {
    beforeEach(async () => {
      // Override the outer recidiviz user with a regular state user.
      await initFastifyAndSetUser({
        "https://dashboard.recidiviz.org/email_address": fakeStaff[0].email,
        "https://dashboard.recidiviz.org/app_metadata": {
          stateCode: "US_NE",
        },
      });
    });

    test("throws FORBIDDEN for getNames when called by a non-recidiviz user", async () => {
      await expect(
        testTRPCClient.v1.config.getNames.query(),
      ).rejects.toMatchObject({
        message: "Admin permissions required for requests",
        data: { code: "FORBIDDEN" },
      });
    });

    test("throws FORBIDDEN for getByState when called by a non-recidiviz user", async () => {
      await expect(
        testTRPCClient.v1.config.getByState.query({ id: "US_NE" }),
      ).rejects.toMatchObject({
        message: "Admin permissions required for requests",
        data: { code: "FORBIDDEN" },
      });
    });
  });

  describe("stateless", () => {
    test("getByState does not depend on the request's stateCode header", async () => {
      await testGlobalPrismaClient.agencyConfig.create({
        data: { id: "test_base", version: 1, config: "version: 1" },
      });

      // recidivizStatelessProcedure never forwards ctx.prisma/ctx.stateCode to
      // the handler, so the result should be identical no matter which state
      // the request claims to be scoped to.
      await initFastifyAndSetUser(
        {
          "https://dashboard.recidiviz.org/email_address": "test@recidiviz.org",
          "https://dashboard.recidiviz.org/app_metadata": {
            stateCode: "recidiviz",
            allowedStates: ["US_ND"],
          },
        },
        { stateCode: "US_ND" },
      );

      const result = await testTRPCClient.v1.config.getNames.query();

      expect(result).toEqual({ test_base: undefined });
    });
  });
});
