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
import { getImportHandler } from "~@sentencing/import/handler";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import {
  TEST_CASES_FILE_NAME,
  TEST_STATE_CODE,
} from "~@sentencing/import/test/setup/constants";
import {
  fakeCase,
  fakeClient,
  fakeCounty,
  fakeStaff,
} from "~@sentencing/import/test/setup/seed";
import { ReportType, StateCode } from "~@sentencing/prisma/client";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

describe("import case data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should upsert existing cases and add new cases", async () => {
    dataProviderSingleton.setData(TEST_CASES_FILE_NAME, [
      // Existing case
      {
        external_id: fakeCase.externalId,
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: faker.location.county(),
        // Set the LSIR score to a new value
        lsir_score: (1000).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
      // New case
      {
        external_id: "new-case-ext-id",
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: faker.location.county(),
        lsir_score: faker.number.int({ max: 100 }).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CASES_FILE_NAME]);

    // Check that the new case was created
    const dbCases = await testPrismaClient.case.findMany({});

    // The old case should have been updated and the new one should have been inserted
    expect(dbCases).toEqual([
      expect.objectContaining({
        externalId: fakeCase.externalId,
        lsirScore: 1000,
        // Make sure report type is converted to the enum
        reportType: ReportType.FullPSI,
        isCountyLocked: true,
      }),
      expect.objectContaining({ externalId: "new-case-ext-id" }),
    ]);
  });

  test("should not override lsirScore if provided data is undefined", async () => {
    dataProviderSingleton.setData(TEST_CASES_FILE_NAME, [
      // Existing case with no lsirScore
      {
        external_id: fakeCase.externalId,
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: faker.location.county(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CASES_FILE_NAME]);

    // Check that the new case was created
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
    dataProviderSingleton.setData(TEST_CASES_FILE_NAME, [
      // Existing case
      {
        external_id: fakeCase.externalId,
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: faker.location.county(),
        lsir_score: (1000).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
      // New case with nonexistent staff and client
      {
        external_id: "new-case-ext-id",
        state_code: StateCode.US_ID,
        staff_id: "non-existent-staff-id",
        client_id: "non-existent-client-id",
        due_date: faker.date.future(),
        county: faker.location.county(),
        lsir_score: faker.number.int({ max: 100 }).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CASES_FILE_NAME]);

    // Check that the new case was created
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
    dataProviderSingleton.setData(TEST_CASES_FILE_NAME, [
      // Existing case
      {
        external_id: fakeCase.externalId,
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: faker.location.county(),
        lsir_score: (1000).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
      // New case
      {
        external_id: "new-case-ext-id",
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: faker.location.county(),
        lsir_score: faker.number.int({ max: 100 }).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CASES_FILE_NAME]);

    // Check that the new case was created
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
    dataProviderSingleton.setData(TEST_CASES_FILE_NAME, [
      // Existing case
      {
        external_id: fakeCase.externalId,
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: faker.location.county(),
        // Set the LSIR score to a new value
        lsir_score: (1000).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
      // New case
      {
        external_id: "new-case-ext-id",
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: faker.location.county(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CASES_FILE_NAME]);

    // Check that the new case was created
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
    dataProviderSingleton.setData(TEST_CASES_FILE_NAME, [
      // Existing case
      {
        external_id: fakeCase.externalId,
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: faker.location.county(),
        lsir_score: (1000).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CASES_FILE_NAME]);

    // Check that the new case was created
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
    dataProviderSingleton.setData(TEST_CASES_FILE_NAME, [
      // Existing case
      {
        external_id: fakeCase.externalId,
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: faker.location.county(),
        lsir_score: (1000).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
      // New case
      {
        external_id: "new-case-ext-id",
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: faker.location.county(),
        lsir_level: faker.number.int().toString(),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CASES_FILE_NAME]);

    // Check that the new case was created
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
    dataProviderSingleton.setData(TEST_CASES_FILE_NAME, [
      // Existing case
      {
        external_id: fakeCase.externalId,
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: faker.location.county(),
        lsir_score: (1000).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CASES_FILE_NAME]);

    // Check that the new case was created
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
    dataProviderSingleton.setData(TEST_CASES_FILE_NAME, [
      // Existing case
      {
        external_id: fakeCase.externalId,
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: faker.location.county(),
        lsir_score: (1000).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
      // New case
      {
        external_id: "new-case-ext-id",
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: undefined,
        lsir_level: faker.number.int().toString(),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CASES_FILE_NAME]);

    // Check that the new case was created
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
    dataProviderSingleton.setData(TEST_CASES_FILE_NAME, [
      // Existing case
      {
        external_id: fakeCase.externalId,
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        county: fakeCounty.name,
        district: faker.location.city(),
        lsir_score: (1000).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CASES_FILE_NAME]);

    // Check that the new case was created
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
    dataProviderSingleton.setData(TEST_CASES_FILE_NAME, [
      // Existing case
      {
        external_id: fakeCase.externalId,
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        district: fakeCounty.district.name,
        lsir_score: (1000).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
      },
    ]);

    await testPrismaClient.case.update({
      where: { externalId: fakeCase.externalId },
      data: { countyId: null },
    });

    await importHandler.import(TEST_STATE_CODE, [CASES_FILE_NAME]);

    // Check that the new case was created
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
    dataProviderSingleton.setData(TEST_CASES_FILE_NAME, [
      // Case without investigation status
      {
        external_id: fakeCase.externalId,
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        district: fakeCounty.district.name,
        lsir_score: (1000).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
        investigation_status: undefined,
      },
      // Case with cancelled investigation status
      {
        external_id: "external-id-2",
        state_code: StateCode.US_ID,
        staff_id: fakeStaff.externalId,
        client_id: fakeClient.externalId,
        due_date: faker.date.future(),
        district: fakeCounty.district.name,
        lsir_score: (1000).toString(),
        lsir_level: faker.number.int().toString(),
        report_type: "PSI Assigned Full",
        investigation_status: "Cancelled",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CASES_FILE_NAME]);

    // Check that the new case was created
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
});
