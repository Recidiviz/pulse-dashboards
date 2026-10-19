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

import { CASES_FILE_NAME } from "~@sentencing/import/constants";
import { caseImportSchema } from "~@sentencing/import/models";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import {
  fakeCase,
  fakeClient,
  fakeCounty,
  fakeStaff,
} from "~@sentencing/import/test/setup/seed";
import {
  importFile,
  ImportRowOverrides,
} from "~@sentencing/import/test/setup/utils";
import { ReportType, StateCode } from "~@sentencing/prisma/client";

// Differs from the seeded case's score, so tests can tell it was imported.
const LSIR_SCORE = 1000;
const FULL_PSI_REPORT_TYPE = "PSI Assigned Full";

/**
 * A row for the seeded case with only the fields the import requires. Tests
 * pass the fields they care about, including a different external_id for new
 * cases.
 */
function createCaseImportRow(
  overrides: ImportRowOverrides<typeof caseImportSchema> = {},
) {
  return {
    external_id: fakeCase.externalId,
    state_code: StateCode.US_ID,
    staff_id: fakeStaff.externalId,
    client_id: fakeClient.externalId,
    ...overrides,
  };
}

function findCase(externalId = fakeCase.externalId) {
  return testPrismaClient.case.findUnique({ where: { externalId } });
}

describe("import case data", () => {
  test("should upsert existing cases and add new cases", async () => {
    await importFile(CASES_FILE_NAME, [
      // Existing case
      createCaseImportRow({
        county: faker.location.county(),
        // Set the LSIR score to a new value
        lsir_score: LSIR_SCORE.toString(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
      // New case
      createCaseImportRow({
        external_id: "new-case-ext-id",
        county: faker.location.county(),
        lsir_score: faker.number.int({ max: 100 }).toString(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
    ]);

    const dbCases = await testPrismaClient.case.findMany({});

    // The old case should have been updated and the new one should have been inserted
    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
        lsirScore: LSIR_SCORE,
        // Make sure report type is converted to the enum
        reportType: ReportType.FullPSI,
        isCountyLocked: true,
      }),
      expect.objectContaining({ externalId: "new-case-ext-id" }),
    ]);
  });

  test("should not override lsirScore if provided data is undefined", async () => {
    await importFile(CASES_FILE_NAME, [
      // Existing case with no lsirScore
      createCaseImportRow({
        county: faker.location.county(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
    ]);

    const dbCases = await testPrismaClient.case.findMany({});

    // The old case should have been updated but the lsirScore should not have been overridden
    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
        lsirScore: fakeCase.lsirScore,
        isCountyLocked: true,
      }),
    ]);
  });

  test("should allow new cases to be uploaded even if their staff or client doesn't exist yet", async () => {
    await importFile(CASES_FILE_NAME, [
      // Existing case
      createCaseImportRow({
        county: faker.location.county(),
        lsir_score: LSIR_SCORE.toString(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
      // New case with nonexistent staff and client
      createCaseImportRow({
        external_id: "new-case-ext-id",
        staff_id: "non-existent-staff-id",
        client_id: "non-existent-client-id",
        county: faker.location.county(),
        lsir_score: faker.number.int({ max: 100 }).toString(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
    ]);

    const dbCases = await testPrismaClient.case.findMany({});

    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
      }),
      expect.objectContaining({
        externalId: "new-case-ext-id",
        // The new one should have been allowed to have been uploaded with no client or case
        clientId: null,
        staffId: null,
        isCountyLocked: true,
      }),
    ]);
  });

  test("should set lsirScoreLocked if lsir score is provided", async () => {
    await importFile(CASES_FILE_NAME, [
      // Existing case
      createCaseImportRow({
        county: faker.location.county(),
        lsir_score: LSIR_SCORE.toString(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
      // New case
      createCaseImportRow({
        external_id: "new-case-ext-id",
        county: faker.location.county(),
        lsir_score: faker.number.int({ max: 100 }).toString(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
    ]);

    const dbCases = await testPrismaClient.case.findMany({});

    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
      }),
      expect.objectContaining({
        externalId: "new-case-ext-id",
        // The new one should have also been linked to the existing client and cases
        clientId: fakeClient.externalId,
        staffId: fakeStaff.externalId,
        isLsirScoreLocked: true,
      }),
    ]);
  });

  test("should not set lsirScoreLocked if lsir score is not provided", async () => {
    await importFile(CASES_FILE_NAME, [
      // Existing case
      createCaseImportRow({
        county: faker.location.county(),
        // Set the LSIR score to a new value
        lsir_score: LSIR_SCORE.toString(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
      // New case
      createCaseImportRow({
        external_id: "new-case-ext-id",
        county: faker.location.county(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
    ]);

    const dbCases = await testPrismaClient.case.findMany({});

    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
      }),
      expect.objectContaining({
        externalId: "new-case-ext-id",
        // The new one should have also been linked to the existing client and cases
        clientId: fakeClient.externalId,
        staffId: fakeStaff.externalId,
        isLsirScoreLocked: false,
      }),
    ]);
  });

  test("should set isReportTypeLocked if report type is provided", async () => {
    await importFile(CASES_FILE_NAME, [
      // Existing case
      createCaseImportRow({
        county: faker.location.county(),
        lsir_score: LSIR_SCORE.toString(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
    ]);

    const dbCases = await testPrismaClient.case.findMany({});

    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
        reportType: ReportType.FullPSI,
        isReportTypeLocked: true,
      }),
    ]);
  });

  test("should not set isReportTypeLocked if report type is not provided", async () => {
    await importFile(CASES_FILE_NAME, [
      // Existing case
      createCaseImportRow({
        county: faker.location.county(),
        lsir_score: LSIR_SCORE.toString(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
      // New case
      createCaseImportRow({
        external_id: "new-case-ext-id",
        county: faker.location.county(),
      }),
    ]);

    const dbCases = await testPrismaClient.case.findMany({});

    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
      }),
      expect.objectContaining({
        externalId: "new-case-ext-id",
        isReportTypeLocked: false,
      }),
    ]);
  });

  test("should set isCountyLocked if county of sentencing is provided", async () => {
    await importFile(CASES_FILE_NAME, [
      // Existing case
      createCaseImportRow({
        county: faker.location.county(),
        lsir_score: LSIR_SCORE.toString(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
    ]);

    const dbCases = await testPrismaClient.case.findMany({});

    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
        reportType: ReportType.FullPSI,
        isReportTypeLocked: true,
        isCountyLocked: true,
      }),
    ]);
  });

  test("should not set isCountyLocked if county of sentencing is not provided", async () => {
    await importFile(CASES_FILE_NAME, [
      // Existing case
      createCaseImportRow({
        county: faker.location.county(),
        lsir_score: LSIR_SCORE.toString(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
      // New case
      createCaseImportRow({
        external_id: "new-case-ext-id",
        county: undefined,
      }),
    ]);

    const dbCases = await testPrismaClient.case.findMany({});

    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
        isCountyLocked: true,
      }),
      expect.objectContaining({
        externalId: "new-case-ext-id",
        isReportTypeLocked: false,
        isCountyLocked: false,
      }),
    ]);
  });

  test("should null district if county is provided", async () => {
    await importFile(CASES_FILE_NAME, [
      // Existing case
      createCaseImportRow({
        county: fakeCounty.name,
        district: faker.location.city(),
        lsir_score: LSIR_SCORE.toString(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
    ]);

    const dbCases = await testPrismaClient.case.findMany({
      include: {
        county: true,
        district: true,
      },
    });

    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
        county: expect.objectContaining({ name: fakeCounty.name }),
        district: null,
      }),
    ]);
  });

  test("should keep district if county is not provided", async () => {
    await testPrismaClient.case.update({
      where: { externalId: fakeCase.externalId },
      data: { countyId: null },
    });

    await importFile(CASES_FILE_NAME, [
      // Existing case
      createCaseImportRow({
        district: fakeCounty.district.name,
        lsir_score: LSIR_SCORE.toString(),
        report_type: FULL_PSI_REPORT_TYPE,
      }),
    ]);

    const dbCases = await testPrismaClient.case.findMany({
      include: {
        county: true,
        district: true,
      },
    });

    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
        county: null,
        district: expect.objectContaining({ name: fakeCounty.district.name }),
      }),
    ]);
  });

  test("should properly set isCancelled status", async () => {
    await importFile(CASES_FILE_NAME, [
      // Case without investigation status
      createCaseImportRow({
        district: fakeCounty.district.name,
        lsir_score: LSIR_SCORE.toString(),
        report_type: FULL_PSI_REPORT_TYPE,
        investigation_status: undefined,
      }),
      // Case with cancelled investigation status
      createCaseImportRow({
        external_id: "external-id-2",
        district: fakeCounty.district.name,
        lsir_score: LSIR_SCORE.toString(),
        report_type: FULL_PSI_REPORT_TYPE,
        investigation_status: "Cancelled",
      }),
    ]);

    const dbCases = await testPrismaClient.case.findMany({});

    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
        isCancelled: false,
      }),
      expect.objectContaining({
        externalId: "external-id-2",
        isCancelled: true,
      }),
    ]);
  });

  test("should not overwrite report type if the user has set it", async () => {
    await importFile(CASES_FILE_NAME, [
      // Existing case
      createCaseImportRow({
        county: faker.location.county(),
        lsir_score: LSIR_SCORE.toString(),
      }),
    ]);

    const dbCases = await testPrismaClient.case.findMany({});

    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
        reportType: ReportType.FullPSI,
      }),
    ]);
  });
  test("should keep the existing case id when re-importing a case", async () => {
    await importFile(CASES_FILE_NAME, [createCaseImportRow()]);

    const dbCase = await findCase();
    expect(dbCase?.id).toEqual(fakeCase.id);
  });

  test("should unlink staff and clients that aren't in the database", async () => {
    await importFile(CASES_FILE_NAME, [
      createCaseImportRow({
        staff_id: "unknown-staff-ext-id",
        client_id: "unknown-client-ext-id",
      }),
    ]);

    const dbCase = await findCase();
    expect(dbCase).toEqual(
      expect.objectContaining({ staffId: null, clientId: null }),
    );
  });

  test("should keep the due date, LSI-R level, and report type when they are missing from the import", async () => {
    const before = await findCase();
    expect(before).toEqual(
      expect.objectContaining({
        dueDate: fakeCase.dueDate,
        lsirLevel: fakeCase.lsirLevel,
        reportType: fakeCase.reportType,
      }),
    );

    await importFile(CASES_FILE_NAME, [createCaseImportRow()]);

    // Re-importing a case with only the required fields changes nothing.
    expect(await findCase()).toEqual(before);
  });

  test("should keep the last row when the same case appears twice", async () => {
    await importFile(CASES_FILE_NAME, [
      createCaseImportRow({ lsir_score: "11" }),
      createCaseImportRow({ lsir_score: "12" }),
    ]);

    expect((await findCase())?.lsirScore).toEqual(12);
  });

  test("should store a date-only due date as that day", async () => {
    await importFile(CASES_FILE_NAME, [
      createCaseImportRow({ due_date: "2026-03-15" }),
    ]);

    expect((await findCase())?.dueDate).toEqual(
      new Date("2026-03-15T00:00:00.000Z"),
    );
  });

  test("should reuse an existing county regardless of capitalization", async () => {
    await importFile(CASES_FILE_NAME, [
      createCaseImportRow({ county: fakeCounty.name.toUpperCase() }),
    ]);

    const counties = await testPrismaClient.county.findMany();
    expect(counties).toHaveLength(1);

    const dbCase = await findCase();
    expect(dbCase?.countyId).toEqual(counties[0].id);
  });
});
