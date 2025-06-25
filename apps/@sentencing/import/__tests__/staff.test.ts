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

import { STAFF_FILE_NAME } from "~@sentencing/import/constants";
import { getImportHandler } from "~@sentencing/import/handler";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import {
  TEST_STAFF_FILE_NAME,
  TEST_STATE_CODE,
} from "~@sentencing/import/test/setup/constants";
import { fakeCase, fakeStaff } from "~@sentencing/import/test/setup/seed";
import { StateCode } from "~@sentencing/prisma/client";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

describe("import staff data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should import new staff data and upsert existing staff", async () => {
    dataProviderSingleton.setData(TEST_STAFF_FILE_NAME, [
      // new staff
      {
        external_id: "new-staff-ext-id",
        pseudonymized_id: "new-staff-pid",
        case_ids: JSON.stringify(["new-case-ext-id"]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: faker.person.firstName(),
          middle_names: faker.person.firstName(),
          surname: faker.person.lastName(),
          name_suffix: faker.person.suffix(),
        }),
        email: faker.internet.email(),
      },
      // existing staff
      {
        external_id: fakeStaff.externalId,
        pseudonymized_id: fakeStaff.pseudonymizedId,
        case_ids: JSON.stringify([fakeCase.externalId]),
        state_code: StateCode.US_ID,
        full_name: JSON.stringify({
          given_names: faker.person.firstName(),
          middle_names: faker.person.firstName(),
          surname: faker.person.lastName(),
          name_suffix: faker.person.suffix(),
        }),
        // Set the email
        email: "existing_staff@gmail.com",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [STAFF_FILE_NAME]);

    // Check that the new case was created
    const dbStaff = await testPrismaClient.staff.findMany({});

    // There should only be two staff in the database - the new one and the updated existing one
    expect(dbStaff).toHaveLength(2);

    expect(dbStaff).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: "new-staff-ext-id",
        }),
        expect.objectContaining({
          externalId: "staff-ext-1",
          email: "existing_staff@gmail.com",
        }),
      ]),
    );
  });
});
