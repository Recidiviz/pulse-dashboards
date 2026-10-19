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
import { describe, expect, test } from "vitest";

import { CLIENTS_FILE_NAME } from "~@sentencing/import/constants";
import { clientImportSchema } from "~@sentencing/import/models";
import { createFakeFullNameForImport } from "~@sentencing/import/test/common/utils";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import {
  fakeCase,
  fakeClient,
  fakeCounty,
} from "~@sentencing/import/test/setup/seed";
import {
  importFile,
  ImportRowOverrides,
} from "~@sentencing/import/test/setup/utils";
import { Gender, StateCode } from "~@sentencing/prisma/client";

/** A row for the seeded client. Tests pass the fields they care about. */
function createClientImportRow(
  overrides: ImportRowOverrides<typeof clientImportSchema> = {},
) {
  return {
    external_id: fakeClient.externalId,
    pseudonymized_id: fakeClient.pseudonymizedId,
    case_ids: JSON.stringify([]),
    state_code: StateCode.US_ID,
    full_name: createFakeFullNameForImport(),
    gender: fakeClient.gender,
    birth_date: fakeClient.birthDate,
    ...overrides,
  };
}

function findClient(externalId = fakeClient.externalId) {
  return testPrismaClient.client.findUnique({ where: { externalId } });
}

describe("import client data", () => {
  test("should upsert existing clients and insert new ones", async () => {
    await importFile(CLIENTS_FILE_NAME, [
      // New client
      createClientImportRow({
        external_id: "new-client-ext-id",
        pseudonymized_id: "new-client-pid",
        county: faker.location.county(),
      }),
      // existing client
      createClientImportRow({
        case_ids: JSON.stringify([fakeCase.externalId]),
        // Set a new county
        county: "my fake county",
        district: "my fake district",
      }),
    ]);

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

  test("should keep both county and district when both are provided", async () => {
    await importFile(CLIENTS_FILE_NAME, [
      // existing client
      createClientImportRow({
        case_ids: JSON.stringify([fakeCase.externalId]),
        county: "my fake county",
        district: "my fake district",
      }),
    ]);

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
        district: expect.objectContaining({ name: "my fake district" }),
      }),
    ]);
  });

  test("should keep district if county is not provided", async () => {
    await testPrismaClient.client.update({
      where: { externalId: fakeClient.externalId },
      data: { countyId: null },
    });

    await importFile(CLIENTS_FILE_NAME, [
      // existing client
      createClientImportRow({
        case_ids: JSON.stringify([fakeCase.externalId]),
        district: "my fake district",
      }),
    ]);

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
    await importFile(CLIENTS_FILE_NAME, [
      // New client
      createClientImportRow({
        external_id: "new-client-ext-id",
        pseudonymized_id: "new-client-pid",
        case_ids: JSON.stringify(["new-case-ext-id"]),
        gender: Gender.FEMALE,
        county: faker.location.county(),
      }),
      // existing client
      createClientImportRow({
        case_ids: JSON.stringify([fakeCase.externalId]),
        // Set a new county
        county: "my fake county",
      }),
    ]);

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
    await importFile(CLIENTS_FILE_NAME, [
      // New client
      createClientImportRow({
        external_id: "new-client-ext-id",
        pseudonymized_id: "new-client-pid",
        case_ids: JSON.stringify(["new-case-ext-id"]),
        gender: Gender.INTERNAL_UNKNOWN,
        county: faker.location.county(),
      }),
    ]);

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
    await importFile(CLIENTS_FILE_NAME, [
      // New client
      createClientImportRow({
        external_id: "new-client-ext-id",
        pseudonymized_id: "new-client-pid",
        case_ids: JSON.stringify(["new-case-ext-id"]),
        gender: Gender.EXTERNAL_UNKNOWN,
        county: faker.location.county(),
      }),
    ]);

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
    await importFile(CLIENTS_FILE_NAME, [
      // existing client
      createClientImportRow({
        case_ids: JSON.stringify([fakeCase.externalId]),
        gender: Gender.EXTERNAL_UNKNOWN,
        county: "my fake county",
      }),
    ]);

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
    await importFile(CLIENTS_FILE_NAME, [
      // New client
      createClientImportRow({
        external_id: "new-client-ext-id",
        pseudonymized_id: "new-client-pid",
        case_ids: JSON.stringify(["new-case-ext-id"]),
        gender: Gender.FEMALE,
        county: faker.location.county(),
      }),
      // existing client
      createClientImportRow({
        case_ids: JSON.stringify([fakeCase.externalId]),
        // Set a new county
        county: "my fake county",
      }),
    ]);

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
    await importFile(CLIENTS_FILE_NAME, [
      // New client
      createClientImportRow({
        external_id: "new-client-ext-id",
        pseudonymized_id: "new-client-pid",
        case_ids: JSON.stringify(["new-case-ext-id"]),
        gender: Gender.INTERNAL_UNKNOWN,
        county: undefined,
      }),
    ]);

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

  test("should keep the existing county and district when they are missing from the import", async () => {
    const before = await testPrismaClient.client.update({
      where: { externalId: fakeClient.externalId },
      data: { district: { connect: { name: fakeCounty.district.name } } },
    });

    await importFile(CLIENTS_FILE_NAME, [createClientImportRow()]);

    expect(before.countyId).not.toBeNull();
    expect(before.districtId).not.toBeNull();
    // Only the name (new each row) and the gender lock (the gender is known)
    // change.
    expect(await findClient()).toEqual({
      ...before,
      fullName: expect.any(String),
      isGenderLocked: true,
    });
  });

  test("should store a date-only birth date as that day in UTC midnight", async () => {
    await importFile(CLIENTS_FILE_NAME, [
      createClientImportRow({ birth_date: "1990-05-20" }),
    ]);

    expect((await findClient())?.birthDate).toEqual(
      new Date("1990-05-20T00:00:00.000Z"),
    );
  });

  test("should import every client in a large file", async () => {
    const rowCount = 1001;

    await importFile(
      CLIENTS_FILE_NAME,
      Array.from({ length: rowCount }, (_, i) =>
        createClientImportRow({
          external_id: `large-file-client-${i}`,
          pseudonymized_id: `large-file-client-pid-${i}`,
        }),
      ),
    );

    expect(
      await testPrismaClient.client.count({
        where: { externalId: { startsWith: "large-file-client-" } },
      }),
    ).toBe(rowCount);
  });

  test("should link clients to existing cases and ignore unknown case ids", async () => {
    await importFile(CLIENTS_FILE_NAME, [
      createClientImportRow({
        external_id: "new-client-ext-id",
        pseudonymized_id: "new-client-pid",
        case_ids: JSON.stringify([fakeCase.externalId, "unknown-case-ext-id"]),
      }),
    ]);

    const dbCase = await testPrismaClient.case.findUnique({
      where: { externalId: fakeCase.externalId },
    });
    expect(dbCase?.clientId).toEqual("new-client-ext-id");
  });
});
