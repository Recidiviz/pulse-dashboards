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

import {
  CASE_MANAGERS_FILE_NAME,
  SUPERVISION_OFFICERS_FILE_NAME,
} from "~@reentry/import/constants";
import { getImportHandler } from "~@reentry/import/handler";
import { testPrismaClient } from "~@reentry/import/test/setup";
import {
  TEST_CASE_MANAGERS_FILE_NAME,
  TEST_STATE_CODE,
  TEST_SUPERVISION_OFFICERS_FILE_NAME,
} from "~@reentry/import/test/setup/constants";
import { fakeClient, fakeStaff } from "~@reentry/import/test/setup/seed";
import { StateCode } from "~@reentry/prisma/client";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

describe("import staff data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  // The case manager and supervision officer files are identical in structure, so we can test both with the same logic.
  test.for([
    { testFile: TEST_CASE_MANAGERS_FILE_NAME, file: CASE_MANAGERS_FILE_NAME },
    {
      testFile: TEST_SUPERVISION_OFFICERS_FILE_NAME,
      file: SUPERVISION_OFFICERS_FILE_NAME,
    },
  ])(
    "should upsert existing staff and insert new ones",
    async ({ testFile, file }) => {
      const newClient = await testPrismaClient.client.create({
        data: {
          personId: 2,
          stablePersonExternalId: "client-ext-2",
          stablePersonExternalIdType: fakeClient.stablePersonExternalIdType,
          pseudonymizedId: "staff-pid-2",
          displayPersonExternalId: "client-dpe-2",
          givenNames: faker.person.firstName(),
          middleNames: faker.person.firstName(),
          surname: faker.person.lastName(),
          stateCode: StateCode.US_ID,
          birthDate: faker.date.birthdate(),
        },
      });

      dataProviderSingleton.setData(testFile, [
        // Existing staff with a new staff id but existing external id + type
        {
          state_code: StateCode.US_ID,
          // staff_id is a string in the import file
          staff_id: "100",
          stable_staff_external_id: fakeStaff.stableStaffExternalId,
          stable_staff_external_id_type: fakeStaff.stableStaffExternalIdType,
          pseudonymized_id: fakeStaff.pseudonymizedId,
          full_name: JSON.stringify({
            given_names: "New Name",
            middle_names: fakeClient.middleNames,
            surname: fakeClient.surname,
            name_suffix: fakeClient.suffix,
          }),
          email: fakeStaff.email,
          // client_person_ids are strings in the import file
          client_person_ids: [newClient.personId.toString()],
        },
        // New staff
        {
          state_code: StateCode.US_ID,
          // staff_id is a string in the import file
          staff_id: "2",
          stable_staff_external_id: "staff-ext-2",
          stable_staff_external_id_type: fakeStaff.stableStaffExternalIdType,
          pseudonymized_id: "new-staff-pid-2",
          full_name: JSON.stringify({
            given_names: faker.person.firstName(),
            middle_names: fakeClient.middleNames,
            surname: fakeClient.surname,
            name_suffix: fakeClient.suffix,
          }),
          email: undefined, // Email is optional
          // client_person_ids are strings in the import file
          client_person_ids: [fakeClient.personId.toString()],
        },
      ]);

      await importHandler.import(TEST_STATE_CODE, [file]);

      // Check that the new staff was created
      const dbStaff = await testPrismaClient.staff.findMany({
        include: {
          clients: {
            select: { clientId: true },
          },
        },
      });

      // There should only be two staff in the database - the new one and the updated existing one
      expect(dbStaff).toHaveLength(2);

      expect(dbStaff).toEqual([
        expect.objectContaining({
          staffId: BigInt(100),
          stableStaffExternalId: fakeStaff.stableStaffExternalId,
          stableStaffExternalIdType: fakeStaff.stableStaffExternalIdType,
          pseudonymizedId: fakeStaff.pseudonymizedId,
          givenNames: "New Name",
          // Should have added the new client assignment and removed the old one
          clients: [
            {
              clientId: newClient.personId,
            },
          ],
        }),
        expect.objectContaining({
          staffId: BigInt(2),
          stableStaffExternalId: "staff-ext-2",
          stableStaffExternalIdType: "staff-ext-type-1",
          pseudonymizedId: "new-staff-pid-2",
          clients: [
            {
              clientId: fakeClient.personId,
            },
          ],
        }),
      ]);
    },
  );
});
