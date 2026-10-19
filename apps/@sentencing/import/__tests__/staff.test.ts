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
import { staffImportSchema } from "~@sentencing/import/models";
import { createFakeFullNameForImport } from "~@sentencing/import/test/common/utils";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import {
  fakeCase,
  fakeCounty,
  fakeStaff,
} from "~@sentencing/import/test/setup/seed";
import {
  importFile,
  ImportRowOverrides,
} from "~@sentencing/import/test/setup/utils";
import { StateCode } from "~@sentencing/prisma/client";

// The seeded staff member's ids, for rows that update them.
const fakeStaffImportIds = {
  external_id: fakeStaff.externalId,
  pseudonymized_id: fakeStaff.pseudonymizedId,
};

/** A row for a new staff member. Tests pass the fields they care about. */
function createStaffImportRow(
  overrides: ImportRowOverrides<typeof staffImportSchema> = {},
) {
  return {
    external_id: faker.string.uuid(),
    pseudonymized_id: faker.string.uuid(),
    case_ids: JSON.stringify([]),
    state_code: StateCode.US_ID,
    full_name: createFakeFullNameForImport(),
    ...overrides,
  };
}

function findStaff(externalId = fakeStaff.externalId) {
  return testPrismaClient.staff.findUnique({ where: { externalId } });
}

const SUPERVISOR_ID = "supervisor-ext-id";

async function createSupervisorOfFakeStaff() {
  await testPrismaClient.staff.create({
    data: {
      externalId: SUPERVISOR_ID,
      pseudonymizedId: "supervisor-pid",
      fullName: faker.person.fullName(),
      stateCode: StateCode.US_ID,
      directReports: { connect: { externalId: fakeStaff.externalId } },
    },
  });
}

describe("import staff data", () => {
  test("should import new staff data and upsert existing staff", async () => {
    await importFile(STAFF_FILE_NAME, [
      // new staff
      createStaffImportRow({
        external_id: "new-staff-ext-id",
        pseudonymized_id: "new-staff-pid",
        case_ids: JSON.stringify(["new-case-ext-id"]),
        email: faker.internet.email(),
      }),
      // existing staff
      createStaffImportRow({
        ...fakeStaffImportIds,
        case_ids: JSON.stringify([fakeCase.externalId]),
        // Set the email
        email: "existing_staff@gmail.com",
      }),
    ]);

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

  test("should skip staff without a full name", async () => {
    await importFile(STAFF_FILE_NAME, [
      createStaffImportRow({ external_id: "unnamed-staff", full_name: null }),
    ]);

    expect(await findStaff("unnamed-staff")).toBeNull();
  });

  test("should create US_MO districts from their codes and reuse them", async () => {
    await importFile(STAFF_FILE_NAME, [
      createStaffImportRow({
        external_id: "mo-staff-1",
        state_code: StateCode.US_MO,
        district: "23",
      }),
      createStaffImportRow({
        external_id: "mo-staff-2",
        state_code: StateCode.US_MO,
        district: "23",
      }),
    ]);

    const districts = await testPrismaClient.district.findMany({
      where: { name: "District 23 - Kennett Community Supervision Center" },
    });
    expect(districts).toHaveLength(1);

    const staff = await testPrismaClient.staff.findMany({
      where: { externalId: { in: ["mo-staff-1", "mo-staff-2"] } },
    });
    expect(staff.map(({ districtId }) => districtId)).toEqual([
      districts[0].id,
      districts[0].id,
    ]);
  });

  test("should link staff to existing cases and ignore unknown case ids", async () => {
    await importFile(STAFF_FILE_NAME, [
      createStaffImportRow({
        external_id: "new-staff-ext-id",
        case_ids: JSON.stringify([fakeCase.externalId, "unknown-case-ext-id"]),
      }),
    ]);

    const dbCase = await testPrismaClient.case.findUnique({
      where: { externalId: fakeCase.externalId },
    });
    expect(dbCase?.staffId).toEqual("new-staff-ext-id");
  });

  test("should format office phone numbers", async () => {
    await importFile(STAFF_FILE_NAME, [
      createStaffImportRow({
        external_id: "new-staff-ext-id",
        office_phone_number: "(573) 555-1234",
      }),
    ]);

    const dbStaff = await findStaff("new-staff-ext-id");
    expect(dbStaff?.officePhoneNumber).toEqual("573-555-1234");
  });

  test("should keep the existing email, office address, and district when they are missing from the import", async () => {
    const before = await testPrismaClient.staff.update({
      where: { externalId: fakeStaff.externalId },
      data: {
        officeAddress: "1 Main St, Jefferson City, MO 65101",
        district: { connect: { id: fakeCounty.district.id } },
      },
    });

    await importFile(STAFF_FILE_NAME, [
      createStaffImportRow(fakeStaffImportIds),
    ]);

    expect(before).toEqual(
      expect.objectContaining({
        email: fakeStaff.email,
        officeAddress: "1 Main St, Jefferson City, MO 65101",
        districtId: fakeCounty.district.id,
      }),
    );
    // Only the name (new each row) and supervisesAll (missing means false)
    // change.
    expect(await findStaff()).toEqual({
      ...before,
      fullName: expect.any(String),
      supervisesAll: false,
    });
  });

  test("should link supervisors, even when they appear after their direct reports", async () => {
    await importFile(STAFF_FILE_NAME, [
      createStaffImportRow({
        external_id: "direct-report-ext-id",
        supervisor_id: SUPERVISOR_ID,
      }),
      createStaffImportRow({ external_id: SUPERVISOR_ID }),
    ]);

    const dbStaff = await findStaff("direct-report-ext-id");
    expect(dbStaff?.supervisorId).toEqual(SUPERVISOR_ID);
  });

  // The import is the source of truth for who reports to whom.
  test("should clear the supervisor link when the import has no supervisor", async () => {
    await createSupervisorOfFakeStaff();

    await importFile(STAFF_FILE_NAME, [
      createStaffImportRow(fakeStaffImportIds),
    ]);

    const dbStaff = await findStaff();
    expect(dbStaff?.supervisorId).toBeNull();
  });

  // One bad supervisor reference leaves that link alone rather than failing the
  // import or clearing it.
  test("should keep the current supervisor link when the new supervisor isn't in the database", async () => {
    await createSupervisorOfFakeStaff();

    await importFile(STAFF_FILE_NAME, [
      createStaffImportRow({
        ...fakeStaffImportIds,
        supervisor_id: "unknown-supervisor-ext-id",
      }),
    ]);

    const dbStaff = await findStaff();
    expect(dbStaff?.supervisorId).toEqual(SUPERVISOR_ID);
  });
});
