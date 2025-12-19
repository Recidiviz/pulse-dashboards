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

import { STAFF_FILE_NAME } from "~@meetings/import/constants";
import { getImportHandler } from "~@meetings/import/handler";
import { testPrismaClient } from "~@meetings/import/test/setup";
import {
  TEST_STAFF_FILE_NAME,
  TEST_STATE_CODE,
} from "~@meetings/import/test/setup/constants";
import { fakeClient, fakeStaff } from "~@meetings/import/test/setup/seed";
import { StateCode } from "~@meetings/prisma/client";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

describe("import staff data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should upsert existing staff and insert new ones", async () => {
    dataProviderSingleton.setData(TEST_STAFF_FILE_NAME, [
      // Existing staff with a new staff id but existing external id + type
      {
        state_code: StateCode.US_NE,
        // staff_id is a string in the import file
        staff_id: "100",
        stable_staff_external_id: fakeStaff.stableStaffExternalId,
        pseudonymized_id: fakeStaff.pseudonymizedId,
        full_name: JSON.stringify({
          given_names: "New Name",
          middle_names: fakeClient.middleNames,
          surname: fakeClient.surname,
          name_suffix: fakeClient.suffix,
        }),
        email: fakeStaff.email,
      },
      // New staff
      {
        state_code: StateCode.US_NE,
        // staff_id is a string in the import file
        staff_id: "2",
        stable_staff_external_id: "staff-ext-2",
        pseudonymized_id: "new-staff-pid-2",
        full_name: JSON.stringify({
          given_names: faker.person.firstName(),
          middle_names: fakeClient.middleNames,
          surname: fakeClient.surname,
          name_suffix: fakeClient.suffix,
        }),
        email: undefined, // Email is optional
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [STAFF_FILE_NAME]);

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
        pseudonymizedId: fakeStaff.pseudonymizedId,
        givenNames: "New Name",
        isActive: true,
        clients: [
          // should still have the relation to the client
          {
            clientId: fakeClient.personId,
          },
        ],
      }),
      expect.objectContaining({
        staffId: BigInt(2),
        stableStaffExternalId: "staff-ext-2",
        pseudonymizedId: "new-staff-pid-2",
        isActive: true,
        clients: [],
      }),
    ]);
  });

  test("should mark staff not in import as inactive", async () => {
    // Create an additional staff member that won't be in the import
    const inactiveStaff = await testPrismaClient.staff.create({
      data: {
        staffId: BigInt(999),
        stableStaffExternalId: "staff-ext-999",
        pseudonymizedId: "staff-pid-999",
        stateCode: StateCode.US_NE,
        givenNames: faker.person.firstName(),
        middleNames: faker.person.firstName(),
        surname: faker.person.lastName(),
        email: faker.internet.email(),
        isActive: true,
      },
    });

    // Import data that only includes the original fakeStaff
    dataProviderSingleton.setData(TEST_STAFF_FILE_NAME, [
      {
        state_code: StateCode.US_NE,
        staff_id: "100",
        stable_staff_external_id: fakeStaff.stableStaffExternalId,
        pseudonymized_id: fakeStaff.pseudonymizedId,
        full_name: JSON.stringify({
          given_names: fakeStaff.givenNames,
          middle_names: fakeStaff.middleNames,
          surname: fakeStaff.surname,
          name_suffix: "",
        }),
        email: fakeStaff.email,
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [STAFF_FILE_NAME]);

    // Check that the inactive staff is now marked as inactive
    const updatedInactiveStaff = await testPrismaClient.staff.findUnique({
      where: { staffId: inactiveStaff.staffId },
    });

    expect(updatedInactiveStaff).toMatchObject({
      staffId: BigInt(999),
      isActive: false,
    });

    // Check that the staff in the import is still active
    const activeStaff = await testPrismaClient.staff.findUnique({
      where: { stableStaffExternalId: fakeStaff.stableStaffExternalId },
    });

    expect(activeStaff).toMatchObject({
      stableStaffExternalId: fakeStaff.stableStaffExternalId,
      isActive: true,
    });
  });
});
