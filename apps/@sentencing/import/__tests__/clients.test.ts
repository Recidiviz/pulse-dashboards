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

import { faker } from "@faker-js/faker";
import { Gender, StateCode } from "@prisma/sentencing-server/client";
import { describe, expect, test } from "vitest";

import { CLIENTS_FILE_NAME } from "~@sentencing/import/constants";
import { getImportHandler } from "~@sentencing/import/handler";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import {
  TEST_CLIENTS_FILE_NAME,
  TEST_STATE_CODE,
} from "~@sentencing/import/test/setup/constants";
import { fakeCase, fakeClient } from "~@sentencing/import/test/setup/seed";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

describe("import client data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should upsert existing clients and insert new ones", async () => {
    dataProviderSingleton.setData(TEST_CLIENTS_FILE_NAME, [
      // New client
      {
        external_id: "new-client-ext-id",
        pseudonymized_id: "new-client-pid",
        case_ids: JSON.stringify([]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: faker.person.firstName(),
          middle_names: faker.person.firstName(),
          surname: faker.person.lastName(),
          name_suffix: faker.person.suffix(),
        }),
        gender: faker.helpers.enumValue(Gender),
        county: faker.location.county(),
        birth_date: faker.date.birthdate(),
      },
      // existing client
      {
        external_id: fakeClient.externalId,
        pseudonymized_id: fakeClient.pseudonymizedId,
        case_ids: JSON.stringify([fakeCase.externalId]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: faker.person.firstName(),
          middle_names: faker.person.firstName(),
          surname: faker.person.lastName(),
          name_suffix: faker.person.suffix(),
        }),
        gender: faker.helpers.enumValue(Gender),
        // Set a new county
        county: "my fake county",
        district: "my fake district",
        birth_date: faker.date.birthdate(),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CLIENTS_FILE_NAME]);

    // Check that the new case was created
    const dbClients = await testPrismaClient.client.findMany({
      include: {
        county: true,
        district: true,
      },
    });

    // There should only be two clients in the database - the new one and the updated existing one
    expect(dbClients).toHaveLength(2);

    expect(dbClients).toEqual([
      expect.objectContaining({
        externalId: "new-client-ext-id",
      }),
      expect.objectContaining({
        externalId: "client-ext-1",
        county: expect.objectContaining({ name: "my fake county" }),
      }),
    ]);
  });

  test("should null district if county is provided", async () => {
    dataProviderSingleton.setData(TEST_CLIENTS_FILE_NAME, [
      // existing client
      {
        external_id: fakeClient.externalId,
        pseudonymized_id: fakeClient.pseudonymizedId,
        case_ids: JSON.stringify([fakeCase.externalId]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: faker.person.firstName(),
          middle_names: faker.person.firstName(),
          surname: faker.person.lastName(),
          name_suffix: faker.person.suffix(),
        }),
        gender: faker.helpers.enumValue(Gender),
        county: "my fake county",
        district: "my fake district",
        birth_date: faker.date.birthdate(),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CLIENTS_FILE_NAME]);

    const dbClients = await testPrismaClient.client.findMany({
      include: {
        county: true,
        district: true,
      },
    });

    expect(dbClients).toEqual([
      expect.objectContaining({
        externalId: fakeClient.externalId,
        county: expect.objectContaining({ name: "my fake county" }),
        district: null,
      }),
    ]);
  });

  test("should keep district if county is not provided", async () => {
    dataProviderSingleton.setData(TEST_CLIENTS_FILE_NAME, [
      // existing client
      {
        external_id: fakeClient.externalId,
        pseudonymized_id: fakeClient.pseudonymizedId,
        case_ids: JSON.stringify([fakeCase.externalId]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: faker.person.firstName(),
          middle_names: faker.person.firstName(),
          surname: faker.person.lastName(),
          name_suffix: faker.person.suffix(),
        }),
        gender: faker.helpers.enumValue(Gender),
        district: "my fake district",
        birth_date: faker.date.birthdate(),
      },
    ]);

    await testPrismaClient.client.update({
      where: { externalId: fakeClient.externalId },
      data: { countyId: null },
    });

    await importHandler.import(TEST_STATE_CODE, [CLIENTS_FILE_NAME]);

    const dbClients = await testPrismaClient.client.findMany({
      include: {
        county: true,
        district: true,
      },
    });

    expect(dbClients).toEqual([
      expect.objectContaining({
        externalId: fakeClient.externalId,
        county: null,
        district: expect.objectContaining({ name: "my fake district" }),
      }),
    ]);
  });

  test("should set isGenderLocked if known gender is provided", async () => {
    dataProviderSingleton.setData(TEST_CLIENTS_FILE_NAME, [
      // New client
      {
        external_id: "new-client-ext-id",
        pseudonymized_id: "new-client-pid",
        case_ids: JSON.stringify(["new-case-ext-id"]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: "Given",
          middle_names: "Middle",
          surname: "Last",
          name_suffix: "Sr.",
        }),
        gender: Gender.FEMALE,
        county: faker.location.county(),
        birth_date: faker.date.birthdate(),
      },
      // existing client
      {
        external_id: fakeClient.externalId,
        pseudonymized_id: fakeClient.pseudonymizedId,
        case_ids: JSON.stringify([fakeCase.externalId]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: faker.person.firstName(),
          middle_names: faker.person.firstName(),
          surname: faker.person.lastName(),
          name_suffix: faker.person.suffix(),
        }),
        gender: faker.helpers.enumValue(Gender),
        // Set a new county
        county: "my fake county",
        birth_date: faker.date.birthdate(),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CLIENTS_FILE_NAME]);

    const dbClients = await testPrismaClient.client.findMany({});

    // The new client should have been inserted and the old one kept
    expect(dbClients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: fakeClient.externalId,
        }),
        expect.objectContaining({
          externalId: "new-client-ext-id",
          gender: Gender.FEMALE,
          isGenderLocked: true,
        }),
      ]),
    );
  });

  test("should not set isGenderLocked if internal unknown gender is provided", async () => {
    dataProviderSingleton.setData(TEST_CLIENTS_FILE_NAME, [
      // New client
      {
        external_id: "new-client-ext-id",
        pseudonymized_id: "new-client-pid",
        case_ids: JSON.stringify(["new-case-ext-id"]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: "Given",
          middle_names: "Middle",
          surname: "Last",
          name_suffix: "Sr.",
        }),
        gender: Gender.INTERNAL_UNKNOWN,
        county: faker.location.county(),
        birth_date: faker.date.birthdate(),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CLIENTS_FILE_NAME]);

    const dbClients = await testPrismaClient.client.findMany({});

    // The new client should have been inserted and the old one kept
    expect(dbClients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: fakeClient.externalId,
        }),
        expect.objectContaining({
          externalId: "new-client-ext-id",
          gender: Gender.INTERNAL_UNKNOWN,
          isGenderLocked: false,
        }),
      ]),
    );
  });

  test("should not set isGenderLocked if external unknown gender is provided", async () => {
    dataProviderSingleton.setData(TEST_CLIENTS_FILE_NAME, [
      // New client
      {
        external_id: "new-client-ext-id",
        pseudonymized_id: "new-client-pid",
        case_ids: JSON.stringify(["new-case-ext-id"]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: "Given",
          middle_names: "Middle",
          surname: "Last",
          name_suffix: "Sr.",
        }),
        gender: Gender.EXTERNAL_UNKNOWN,
        county: faker.location.county(),
        birth_date: faker.date.birthdate(),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CLIENTS_FILE_NAME]);

    const dbClients = await testPrismaClient.client.findMany({});

    // The new client should have been inserted and the old one kept
    expect(dbClients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: fakeClient.externalId,
        }),
        expect.objectContaining({
          externalId: "new-client-ext-id",
          gender: Gender.EXTERNAL_UNKNOWN,
          isGenderLocked: false,
        }),
      ]),
    );
  });

  test("should not override gender if updating with unknown gender", async () => {
    dataProviderSingleton.setData(TEST_CLIENTS_FILE_NAME, [
      // existing client
      {
        external_id: fakeClient.externalId,
        pseudonymized_id: fakeClient.pseudonymizedId,
        case_ids: JSON.stringify([fakeCase.externalId]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: faker.person.firstName(),
          middle_names: faker.person.firstName(),
          surname: faker.person.lastName(),
          name_suffix: faker.person.suffix(),
        }),
        gender: Gender.EXTERNAL_UNKNOWN,
        county: "my fake county",
        birth_date: faker.date.birthdate(),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CLIENTS_FILE_NAME]);

    const dbClients = await testPrismaClient.client.findMany({});

    // The gender should have been kept
    expect(dbClients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: fakeClient.externalId,
          gender: fakeClient.gender,
          isCountyLocked: true,
        }),
      ]),
    );
  });

  test("should set isCountyLocked if county of residence is provided", async () => {
    dataProviderSingleton.setData(TEST_CLIENTS_FILE_NAME, [
      // New client
      {
        external_id: "new-client-ext-id",
        pseudonymized_id: "new-client-pid",
        case_ids: JSON.stringify(["new-case-ext-id"]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: "Given",
          middle_names: "Middle",
          surname: "Last",
          name_suffix: "Sr.",
        }),
        gender: Gender.FEMALE,
        county: faker.location.county(),
        birth_date: faker.date.birthdate(),
      },
      // existing client
      {
        external_id: fakeClient.externalId,
        pseudonymized_id: fakeClient.pseudonymizedId,
        case_ids: JSON.stringify([fakeCase.externalId]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: faker.person.firstName(),
          middle_names: faker.person.firstName(),
          surname: faker.person.lastName(),
          name_suffix: faker.person.suffix(),
        }),
        gender: faker.helpers.enumValue(Gender),
        // Set a new county
        county: "my fake county",
        birth_date: faker.date.birthdate(),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CLIENTS_FILE_NAME]);

    const dbClients = await testPrismaClient.client.findMany({});

    // The new client should have been inserted and the old one kept
    expect(dbClients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: fakeClient.externalId,
        }),
        expect.objectContaining({
          externalId: "new-client-ext-id",
          gender: Gender.FEMALE,
          isGenderLocked: true,
          isCountyLocked: true,
        }),
      ]),
    );
  });

  test("should not set isCountyLocked if county of residence is provided", async () => {
    dataProviderSingleton.setData(TEST_CLIENTS_FILE_NAME, [
      // New client
      {
        external_id: "new-client-ext-id",
        pseudonymized_id: "new-client-pid",
        case_ids: JSON.stringify(["new-case-ext-id"]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: "Given",
          middle_names: "Middle",
          surname: "Last",
          name_suffix: "Sr.",
        }),
        gender: Gender.INTERNAL_UNKNOWN,
        county: undefined,
        birth_date: faker.date.birthdate(),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CLIENTS_FILE_NAME]);

    const dbClients = await testPrismaClient.client.findMany({});

    // The new client should have been inserted and the old one kept
    expect(dbClients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: fakeClient.externalId,
        }),
        expect.objectContaining({
          externalId: "new-client-ext-id",
          gender: Gender.INTERNAL_UNKNOWN,
          isGenderLocked: false,
          isCountyLocked: false,
        }),
      ]),
    );
  });
});
