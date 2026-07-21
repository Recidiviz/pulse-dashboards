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
    test("Should return the full row for the latest version of the given id", async () => {
      await testGlobalPrismaClient.agencyConfig.create({
        data: {
          id: "us_ne",
          parentId: "test_base",
          version: 1,
          config: "name: Nebraska \nversion: 1",
        },
      });
      await testGlobalPrismaClient.agencyConfig.create({
        data: {
          id: "us_ne",
          parentId: "test_base",
          version: 2,
          config: "name: Nebraska \nversion: 2",
        },
      });

      const result = await testTRPCClient.v1.config.getByState.query({
        id: "us_ne",
      });

      expect(result).toEqual({
        id: "us_ne",
        parentId: "test_base",
        version: 2,
        config: "name: Nebraska \nversion: 2",
      });
    });

    test("throws NOT_FOUND when no config exists for the given id", async () => {
      await expect(
        testTRPCClient.v1.config.getByState.query({ id: "unknown-id" }),
      ).rejects.toThrow("No config found for id: unknown-id");
    });
  });

  describe("saveNewConfig", () => {
    beforeEach(async () => {
      await testGlobalPrismaClient.agencyConfig.create({
        data: { id: "test_base", version: 1, config: "version: 1" },
      });
      await testGlobalPrismaClient.agencyConfig.create({
        data: {
          id: "us_ne",
          parentId: "test_base",
          version: 1,
          config: "name: Nebraska 1 \nversion: 1 \nstateCode: US_NE",
        },
      });
    });
    test("Successfully adds updated configs", async () => {
      const updatedBaseConfig = "version: 2";
      const baseResult = await testTRPCClient.v1.config.saveNewConfig.mutate({
        id: "test_base",
        parentId: null,
        newConfig: updatedBaseConfig,
      });

      expect(baseResult).toEqual({
        id: "test_base",
        parentId: null,
        version: 2,
        config: updatedBaseConfig,
      });
      await expect(
        testTRPCClient.v1.config.getByState.query({ id: "test_base" }),
      ).resolves.toEqual(baseResult);

      const updatedAgencyConfig =
        "name: Nebraska 2 \nversion: 2 \nstateCode: US_NE";
      const agencyResult = await testTRPCClient.v1.config.saveNewConfig.mutate({
        id: "us_ne",
        parentId: "test_base",
        newConfig: updatedAgencyConfig,
      });

      expect(agencyResult).toEqual({
        id: "us_ne",
        parentId: "test_base",
        version: 2,
        config: updatedAgencyConfig,
      });
      await expect(
        testTRPCClient.v1.config.getByState.query({ id: "us_ne" }),
      ).resolves.toEqual(agencyResult);
    });

    test("throws BAD_REQUEST when given bad yaml", async () => {
      const invalidYamlNewBase =
        "version: 2 \n  name: base \n  stateCode: null";
      await expect(
        testTRPCClient.v1.config.saveNewConfig.mutate({
          id: "test_base",
          newConfig: invalidYamlNewBase,
          parentId: null,
        }),
      ).rejects.toThrow("Invalid YAML syntax.");

      const invalidYamlNewAgencyConfig =
        "name: Nebraska 2 \n  version: 2 \n  stateCode: US_NE";
      await expect(
        testTRPCClient.v1.config.saveNewConfig.mutate({
          id: "us_ne",
          newConfig: invalidYamlNewAgencyConfig,
          parentId: "test_base",
        }),
      ).rejects.toThrow("Invalid YAML syntax.");
    });
    test("throws BAD_REQUEST when fails to validate against zod schemas", async () => {
      const invalidNewBase = "version: false";
      await expect(
        testTRPCClient.v1.config.saveNewConfig.mutate({
          id: "test_base",
          newConfig: invalidNewBase,
          parentId: null,
        }),
      ).rejects.toThrow("Configuration validation failed.");
      const invaidNewAgencyConfig =
        "name: Nebraska \nversion: one \nstateCode: US_NE";
      await expect(
        testTRPCClient.v1.config.saveNewConfig.mutate({
          id: "us_ne",
          newConfig: invaidNewAgencyConfig,
          parentId: "test_base",
        }),
      ).rejects.toThrow("Configuration validation failed.");
    });

    describe("version control", () => {
      test("Can save config for id with no previous version", async () => {
        const newAgencyIdConfig =
          "name: Arizona \nversion: 1 \nstateCode: US_AZ";
        const newAgencyResult =
          await testTRPCClient.v1.config.saveNewConfig.mutate({
            id: "us_az",
            parentId: "test_base",
            newConfig: newAgencyIdConfig,
          });

        expect(newAgencyResult).toEqual({
          id: "us_az",
          parentId: "test_base",
          version: 1,
          config: newAgencyIdConfig,
        });
        await expect(
          testTRPCClient.v1.config.getByState.query({ id: "us_az" }),
        ).resolves.toEqual(newAgencyResult);
      });
      test("Allows adding non sequential versions", async () => {
        const newAgencyConfig =
          "name: Nebraska 2 \nversion: 4 \nstateCode: US_NE";
        const agencyResult =
          await testTRPCClient.v1.config.saveNewConfig.mutate({
            id: "us_ne",
            parentId: "test_base",
            newConfig: newAgencyConfig,
          });
        expect(agencyResult).toEqual({
          id: "us_ne",
          parentId: "test_base",
          version: 4,
          config: newAgencyConfig,
        });
        await expect(
          testTRPCClient.v1.config.getByState.query({ id: "us_ne" }),
        ).resolves.toEqual(agencyResult);
      });
      test("throws BAD_REQUEST for versions less than or equal to latest version", async () => {
        const newAgencyConfigV4 =
          "name: Nebraska \nversion: 4 \nstateCode: US_NE";
        await testTRPCClient.v1.config.saveNewConfig.mutate({
          id: "us_ne",
          parentId: "test_base",
          newConfig: newAgencyConfigV4,
        });
        const newAgencyConfigV2 =
          "name: Nebraska \nversion: 2 \nstateCode: US_NE";
        await expect(
          testTRPCClient.v1.config.saveNewConfig.mutate({
            id: "us_ne",
            newConfig: newAgencyConfigV2,
            parentId: "test_base",
          }),
        ).rejects.toThrow("Invalid version number. Must be greater than 4.");
      });
    });

    test("throws BAD_REQUEST if different parentId is used for existing id", async () => {
      const newAgencyConfigV2 =
        "name: Nebraska \nversion: 2 \nstateCode: US_NE";
      await expect(
        testTRPCClient.v1.config.saveNewConfig.mutate({
          id: "us_ne",
          newConfig: newAgencyConfigV2,
          parentId: "different_base",
        }),
      ).rejects.toThrow("Cannot change the parentId.");
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

    test("throws FORBIDDEN for saveNewConfig when called by a non-recidiviz user", async () => {
      await expect(
        testTRPCClient.v1.config.saveNewConfig.mutate({
          id: "test_base",
          newConfig: "version: 2",
          parentId: null,
        }),
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
