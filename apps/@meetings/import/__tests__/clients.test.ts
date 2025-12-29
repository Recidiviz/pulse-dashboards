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

import { CLIENTS_FILE_NAME } from "~@meetings/import/constants";
import { getImportHandler } from "~@meetings/import/handler";
import { testPrismaClient } from "~@meetings/import/test/setup";
import {
  TEST_CLIENTS_FILE_NAME,
  TEST_STATE_CODE,
} from "~@meetings/import/test/setup/constants";
import { fakeClient, fakeStaff } from "~@meetings/import/test/setup/seed";
import { StateCode } from "~@meetings/prisma/client";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

describe("import client data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should upsert existing clients and insert new ones", async () => {
    const newStaff = await testPrismaClient.staff.create({
      data: {
        staffId: 2,
        stableStaffExternalId: "staff-ext-2",
        pseudonymizedId: "staff-pid-2",
        givenNames: faker.person.firstName(),
        middleNames: faker.person.firstName(),
        surname: faker.person.lastName(),
        email: faker.internet.email(),
        stateCode: StateCode.US_NE,
      },
    });

    dataProviderSingleton.setData(TEST_CLIENTS_FILE_NAME, [
      // Existing client with a new person id but existing external id + type
      {
        state_code: StateCode.US_NE,
        // person_id is a string in the import file
        person_id: "100",
        stable_person_external_id: fakeClient.stablePersonExternalId,
        stable_person_external_id_type: fakeClient.stablePersonExternalIdType,
        display_person_external_id: fakeClient.displayPersonExternalId,
        pseudonymized_id: fakeClient.pseudonymizedId,
        person_name: JSON.stringify({
          given_names: "New Name",
          middle_names: fakeClient.middleNames,
          surname: fakeClient.surname,
          name_suffix: fakeClient.suffix,
        }),
        officer_id: newStaff.stableStaffExternalId,
        supervision_type: "PAROLE",
      },
      // new client
      {
        state_code: StateCode.US_NE,
        // person_id is a string in the import file
        person_id: "2",
        stable_person_external_id: "client-ext-2",
        stable_person_external_id_type: fakeClient.stablePersonExternalIdType,
        display_person_external_id: "new-client-display-ext-id",
        pseudonymized_id: "new-client-pid",
        person_name: JSON.stringify({
          given_names: faker.person.firstName(),
          middle_names: faker.person.firstName(),
          surname: faker.person.lastName(),
          name_suffix: faker.person.suffix(),
        }),
        current_address: faker.location.streetAddress(),
        officer_id: fakeStaff.stableStaffExternalId,
        supervision_type: "GENERAL",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CLIENTS_FILE_NAME]);

    // Check that the new case was created
    const dbClients = await testPrismaClient.client.findMany({
      include: {
        staff: {
          select: {
            staffId: true,
          },
        },
      },
    });

    // There should only be two clients in the database - the new one and the updated existing one
    expect(dbClients).toHaveLength(2);

    expect(dbClients).toEqual([
      expect.objectContaining({
        personId: BigInt(100),
        stablePersonExternalId: fakeClient.stablePersonExternalId,
        stablePersonExternalIdType: fakeClient.stablePersonExternalIdType,
        pseudonymizedId: fakeClient.pseudonymizedId,
        displayPersonExternalId: fakeClient.displayPersonExternalId,
        givenNames: "New Name",
        isActive: true,
        // Should have added the new staff assignment and removed the old one
        staff: [
          {
            staffId: newStaff.staffId,
          },
        ],
      }),
      expect.objectContaining({
        personId: BigInt(2),
        stablePersonExternalId: "client-ext-2",
        stablePersonExternalIdType: "client-ext-type-1",
        pseudonymizedId: "new-client-pid",
        displayPersonExternalId: "new-client-display-ext-id",
        isActive: true,
        staff: [
          {
            staffId: fakeStaff.staffId,
          },
        ],
        supervisionType: "GENERAL",
      }),
    ]);
  });

  test("should mark clients not in import as inactive", async () => {
    // Create an additional client that won't be in the import
    const inactiveClient = await testPrismaClient.client.create({
      data: {
        personId: BigInt(999),
        stablePersonExternalId: "client-ext-999",
        stablePersonExternalIdType: "client-ext-type-1",
        pseudonymizedId: "client-pid-999",
        displayPersonExternalId: "client-display-ext-999",
        stateCode: StateCode.US_NE,
        givenNames: faker.person.firstName(),
        middleNames: faker.person.firstName(),
        surname: faker.person.lastName(),
        suffix: faker.person.suffix(),
        supervisionType: "PAROLE",
        isActive: true,
      },
    });

    // Import data that only includes the original fakeClient
    dataProviderSingleton.setData(TEST_CLIENTS_FILE_NAME, [
      {
        state_code: StateCode.US_NE,
        person_id: "100",
        stable_person_external_id: fakeClient.stablePersonExternalId,
        stable_person_external_id_type: fakeClient.stablePersonExternalIdType,
        display_person_external_id: fakeClient.displayPersonExternalId,
        pseudonymized_id: fakeClient.pseudonymizedId,
        person_name: JSON.stringify({
          given_names: fakeClient.givenNames,
          middle_names: fakeClient.middleNames,
          surname: fakeClient.surname,
          name_suffix: fakeClient.suffix,
        }),
        officer_id: fakeStaff.stableStaffExternalId,
        supervision_type: "PAROLE",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CLIENTS_FILE_NAME]);

    // Check that the inactive client is now marked as inactive
    const updatedInactiveClient = await testPrismaClient.client.findUnique({
      where: { personId: inactiveClient.personId },
    });

    expect(updatedInactiveClient).toMatchObject({
      personId: BigInt(999),
      isActive: false,
    });

    // Check that the client in the import is still active
    const activeClient = await testPrismaClient.client.findFirst({
      where: {
        stablePersonExternalId: fakeClient.stablePersonExternalId,
        stablePersonExternalIdType: fakeClient.stablePersonExternalIdType,
      },
    });

    expect(activeClient).toMatchObject({
      stablePersonExternalId: fakeClient.stablePersonExternalId,
      isActive: true,
    });
  });
});
