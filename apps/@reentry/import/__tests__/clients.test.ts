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

import { CLIENTS_FILE_NAME } from "~@reentry/import/constants";
import { getImportHandler } from "~@reentry/import/handler";
import { testPrismaClient } from "~@reentry/import/test/setup";
import {
  TEST_CLIENTS_FILE_NAME,
  TEST_STATE_CODE,
} from "~@reentry/import/test/setup/constants";
import { fakeClient, fakeStaff } from "~@reentry/import/test/setup/seed";
import { StateCode } from "~@reentry/prisma/client";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

describe("import client data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should upsert existing clients and insert new ones", async () => {
    const newStaff = await testPrismaClient.staff.create({
      data: {
        staffId: "staff-2",
        pseudonymizedId: "staff-pid-2",
        givenNames: faker.person.firstName(),
        middleNames: faker.person.firstName(),
        surname: faker.person.lastName(),
        email: faker.internet.email(),
        stateCode: StateCode.US_ID,
      },
    });

    dataProviderSingleton.setData(TEST_CLIENTS_FILE_NAME, [
      // Existing client
      {
        state_code: StateCode.US_ID,
        person_id: fakeClient.personId,
        external_id: fakeClient.externalId,
        pseudonymized_id: fakeClient.pseudonymizedId,
        full_name: JSON.stringify({
          given_names: "New Name",
          middle_names: fakeClient.middleNames,
          surname: fakeClient.surname,
          name_suffix: fakeClient.suffix,
        }),
        birth_date: fakeClient.birthDate,
        current_address: fakeClient.address,
        assigned_staff_ids: [newStaff.staffId],
      },
      // new client
      {
        state_code: StateCode.US_ID,
        person_id: "new-client-person-id",
        external_id: "new-client-ext-id",
        display_person_external_id: "new-client-display-ext-id",
        pseudonymized_id: "new-client-pid",
        full_name: JSON.stringify({
          given_names: faker.person.firstName(),
          middle_names: faker.person.firstName(),
          surname: faker.person.lastName(),
          name_suffix: faker.person.suffix(),
        }),
        birth_date: faker.date.birthdate(),
        current_address: faker.location.streetAddress(),
        assigned_staff_ids: [fakeStaff.staffId],
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
        personId: fakeClient.personId,
        givenNames: "New Name",
        // Should have added the new staff assignment and removed the old one
        staff: [
          {
            staffId: newStaff.staffId,
          },
        ],
      }),
      expect.objectContaining({
        personId: "new-client-person-id",
        staff: [
          {
            staffId: fakeStaff.staffId,
          },
        ],
      }),
    ]);
  });
});
