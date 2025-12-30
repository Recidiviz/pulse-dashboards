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

import { RESIDENTS_FILE_NAME } from "~@meetings/import/constants";
import { getImportHandler } from "~@meetings/import/handler";
import { testPrismaClient } from "~@meetings/import/test/setup";
import {
  TEST_RESIDENTS_FILE_NAME,
  TEST_STATE_CODE,
} from "~@meetings/import/test/setup/constants";
import { fakeResident } from "~@meetings/import/test/setup/seed";
import { StateCode } from "~@meetings/prisma/client";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

describe("import resident data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should upsert existing residents and insert new ones", async () => {
    dataProviderSingleton.setData(TEST_RESIDENTS_FILE_NAME, [
      // Existing resident with a new person id but existing external id + type
      {
        state_code: StateCode.US_NE,
        // person_id is a string in the import file
        person_id: "100",
        stable_person_external_id: fakeResident.stablePersonExternalId,
        stable_person_external_id_type: fakeResident.stablePersonExternalIdType,
        display_person_external_id: fakeResident.displayPersonExternalId,
        pseudonymized_id: fakeResident.pseudonymizedId,
        full_name: JSON.stringify({
          given_names: "New Name",
          middle_names: fakeResident.middleNames,
          surname: fakeResident.surname,
          name_suffix: fakeResident.suffix,
        }),
        facility_id: "facility-2",
      },
      // new resident
      {
        state_code: StateCode.US_NE,
        // person_id is a string in the import file
        person_id: "3",
        stable_person_external_id: "resident-ext-2",
        stable_person_external_id_type: fakeResident.stablePersonExternalIdType,
        display_person_external_id: "new-resident-display-ext-id",
        pseudonymized_id: "new-resident-pid",
        full_name: JSON.stringify({
          given_names: faker.person.firstName(),
          middle_names: faker.person.firstName(),
          surname: faker.person.lastName(),
          name_suffix: faker.person.suffix(),
        }),
        facility_id: "facility-1",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [RESIDENTS_FILE_NAME]);

    // Check that the new resident was created
    const dbResidents = await testPrismaClient.resident.findMany({});

    // There should only be two residents in the database - the new one and the updated existing one
    expect(dbResidents).toHaveLength(2);

    expect(dbResidents).toEqual([
      expect.objectContaining({
        personId: BigInt(100),
        stablePersonExternalId: fakeResident.stablePersonExternalId,
        stablePersonExternalIdType: fakeResident.stablePersonExternalIdType,
        pseudonymizedId: fakeResident.pseudonymizedId,
        displayPersonExternalId: fakeResident.displayPersonExternalId,
        givenNames: "New Name",
        facilityId: "facility-2",
        isActive: true,
      }),
      expect.objectContaining({
        personId: BigInt(3),
        stablePersonExternalId: "resident-ext-2",
        stablePersonExternalIdType: "resident-ext-type-1",
        pseudonymizedId: "new-resident-pid",
        displayPersonExternalId: "new-resident-display-ext-id",
        facilityId: "facility-1",
        isActive: true,
      }),
    ]);
  });

  test("should mark residents not in import as inactive", async () => {
    // Create an additional resident that won't be in the import
    const inactiveResident = await testPrismaClient.resident.create({
      data: {
        personId: BigInt(999),
        stablePersonExternalId: "resident-ext-999",
        stablePersonExternalIdType: "resident-ext-type-1",
        pseudonymizedId: "resident-pid-999",
        displayPersonExternalId: "resident-display-ext-999",
        stateCode: StateCode.US_NE,
        givenNames: faker.person.firstName(),
        middleNames: faker.person.firstName(),
        surname: faker.person.lastName(),
        suffix: faker.person.suffix(),
        facilityId: "facility-999",
        isActive: true,
      },
    });

    // Import data that only includes the original fakeResident
    dataProviderSingleton.setData(TEST_RESIDENTS_FILE_NAME, [
      {
        state_code: StateCode.US_NE,
        person_id: "100",
        stable_person_external_id: fakeResident.stablePersonExternalId,
        stable_person_external_id_type: fakeResident.stablePersonExternalIdType,
        display_person_external_id: fakeResident.displayPersonExternalId,
        pseudonymized_id: fakeResident.pseudonymizedId,
        full_name: JSON.stringify({
          given_names: fakeResident.givenNames,
          middle_names: fakeResident.middleNames,
          surname: fakeResident.surname,
          name_suffix: fakeResident.suffix,
        }),
        facility_id: fakeResident.facilityId,
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [RESIDENTS_FILE_NAME]);

    // Check that the inactive resident is now marked as inactive
    const updatedInactiveResident = await testPrismaClient.resident.findUnique({
      where: { personId: inactiveResident.personId },
    });

    expect(updatedInactiveResident).toMatchObject({
      personId: BigInt(999),
      isActive: false,
    });

    // Check that the resident in the import is still active
    const activeResident = await testPrismaClient.resident.findFirst({
      where: {
        stablePersonExternalId: fakeResident.stablePersonExternalId,
        stablePersonExternalIdType: fakeResident.stablePersonExternalIdType,
      },
    });

    expect(activeResident).toMatchObject({
      stablePersonExternalId: fakeResident.stablePersonExternalId,
      isActive: true,
    });
  });
});
