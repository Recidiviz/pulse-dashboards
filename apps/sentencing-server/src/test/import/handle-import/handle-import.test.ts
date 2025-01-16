// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import {
  AsamLevelOfCareRecommendationCriterion,
  DiagnosedMentalHealthDiagnosisCriterion,
  Gender,
  PriorCriminalHistoryCriterion,
  ReportType,
  StateCode,
} from "@prisma/client";
import { describe, expect, test } from "vitest";

import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~@sentencing-server/prisma";
import { dataProviderSingleton } from "~fastify-data-import-plugin/testkit";
import { testAndGetSentryReports } from "~sentencing-server/test/common/utils";
import {
  caseBody,
  clientBody,
  insightBody,
  offenseBody,
  opportunityBody,
  staffBody,
} from "~sentencing-server/test/import/handle-import/constants";
import {
  callHandleImport,
  callHandleImportCaseData,
  callHandleImportClientData,
  callHandleImportInsightData,
  callHandleImportOffenseData,
  callHandleImportOpportunityData,
  callHandleImportStaffData,
  createFakeRecidivismSeriesForImport,
} from "~sentencing-server/test/import/handle-import/utils";
import { testPrismaClient, testServer } from "~sentencing-server/test/setup";
import {
  fakeCase,
  fakeClient,
  fakeInsight,
  fakeOffense,
  fakeOpportunity,
  fakeStaff,
} from "~sentencing-server/test/setup/seed";

const lastUpdatedDate = new Date(1, 1, 1);

describe("handle_import", () => {
  describe("import case data", () => {
    test("should throw error if state is not supported", async () => {
      dataProviderSingleton.setData([
        // Old offense
        {
          state_code: StateCode.US_ID,
          charge: fakeOffense.name,
        },
        // New offense with invalid schema
        {
          stateCode: StateCode.US_ID,
          charge: "new-offense",
        },
      ]);

      const response = await callHandleImport(testServer, {
        ...caseBody,
        objectId: "US_ME/sentencing_case_record.json",
      });

      expect(response.statusCode).toBe(400);

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Unsupported bucket + object pair: test-bucket/US_ME/sentencing_case_record.json",
      );
    });

    test("should log any zod errors but insert correct rows", async () => {
      dataProviderSingleton.setData([
        // Existing case (with invalid state code)
        {
          external_id: fakeCase.externalId,
          state_code: "NOT A STATE",
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
          district: faker.location.county(),
          lsir_score: faker.number.int({ max: 100 }).toString(),
          lsir_level: faker.number.int().toString(),
          report_type: "PSI Assigned Full",
        },
      ]);

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(500);

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Error importing object US_ID/sentencing_case_record.json from bucket test-bucket: \nError parsing data:\nData: {",
      );

      const dbCases = await testPrismaClient.case.findMany({});
      // The new case should have been inserted
      expect(dbCases).toEqual([
        expect.objectContaining({ externalId: "case-ext-1" }),
        expect.objectContaining({ externalId: "new-case-ext-id" }),
      ]);
    });

    test("should upsert existing cases and add new cases", async () => {
      dataProviderSingleton.setData([
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

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbCases = await testPrismaClient.case.findMany({});

      // The old case should have been updated and the new one should have been inserted
      expect(dbCases).toEqual([
        expect.objectContaining({
          externalId: fakeCase.externalId,
          lsirScore: 1000,
          // Make sure report type is converted to the enum
          reportType: ReportType.FullPSI,
        }),
        expect.objectContaining({ externalId: "new-case-ext-id" }),
      ]);
    });

    test("should not override lsirScore if provided data is undefined", async () => {
      dataProviderSingleton.setData([
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

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbCases = await testPrismaClient.case.findMany({});

      // The old case should have been updated but the lsirScore should not have been overridden
      expect(dbCases).toEqual([
        expect.objectContaining({
          externalId: fakeCase.externalId,
          lsirScore: fakeCase.lsirScore,
        }),
      ]);
    });

    test("should allow new cases to be uploaded even if their staff or client doesn't exist yet", async () => {
      dataProviderSingleton.setData([
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

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(200);

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
        }),
      ]);
    });

    test("should set lsirScoreLocked if lsir score is provided", async () => {
      dataProviderSingleton.setData([
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

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(200);

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
      dataProviderSingleton.setData([
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

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(200);

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
      dataProviderSingleton.setData([
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

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(200);

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
      dataProviderSingleton.setData([
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

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(200);

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
  });

  describe("import client data", () => {
    test("should throw error if state is not supported", async () => {
      dataProviderSingleton.setData([
        // New client
        {
          external_id: "new-client-ext-id",
          pseudonymized_id: "new-client-pid",
          case_ids: JSON.stringify(["new-case-ext-id"]),
          state_code: StateCode.US_ID,
          full_name: JSON.stringify({
            given_names: "Given",
            middle_names: "Middle",
            surname: "Last",
            name_suffix: "Sr.",
          }),
          gender: faker.helpers.enumValue(Gender),
          county: faker.location.county(),
          birth_date: faker.date.birthdate(),
        },
      ]);

      const response = await callHandleImport(testServer, {
        ...clientBody,
        objectId: "US_ME/sentencing_client_record.json",
      });

      expect(response.statusCode).toBe(400);

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Unsupported bucket + object pair: test-bucket/US_ME/sentencing_client_record.json",
      );
    });

    test("should log any zod errors but insert correct rows", async () => {
      dataProviderSingleton.setData([
        // existing client
        {
          external_id: fakeClient.externalId,
          pseudonymized_id: fakeClient.pseudonymizedId,
          case_ids: JSON.stringify([fakeCase.externalId]),
          state_code: StateCode.US_ID,
          full_name: JSON.stringify({
            given_names: faker.person.firstName(),
            middle_names: faker.person.firstName(),
            surname: faker.person.lastName(),
            name_suffix: faker.person.suffix(),
          }),
          gender: faker.helpers.enumValue(Gender),
          // Set a new county
          county: "my fake county",
          birth_date: faker.date.birthdate(),
        },
        // New client (with invalid gender)
        {
          external_id: "new-client-ext-id",
          pseudonymized_id: "new-client-pid",
          case_ids: JSON.stringify(["new-case-ext-id"]),
          state_code: StateCode.US_ID,
          full_name: JSON.stringify({
            given_names: "Given",
            middle_names: "Middle",
            surname: "Last",
            name_suffix: "Sr.",
          }),
          gender: "NOT A GENDER",
          county: faker.location.county(),
          birth_date: faker.date.birthdate(),
          district: "D1",
        },
      ]);

      const response = await callHandleImportClientData(testServer);

      expect(response.statusCode).toBe(500);

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Error importing object US_ID/sentencing_client_record.json from bucket test-bucket: \nError parsing data:\nData: {",
      );

      const dbClients = await testPrismaClient.client.findMany();
      // The old client should still be included in there with new data
      expect(dbClients).toEqual([
        expect.objectContaining({
          externalId: "client-ext-1",
          county: "my fake county",
        }),
      ]);
    });

    test("should upsert existing clients and insert new ones", async () => {
      dataProviderSingleton.setData([
        // New client
        {
          external_id: "new-client-ext-id",
          pseudonymized_id: "new-client-pid",
          case_ids: JSON.stringify([]),
          state_code: StateCode.US_ID,
          full_name: JSON.stringify({
            given_names: faker.person.firstName(),
            middle_names: faker.person.firstName(),
            surname: faker.person.lastName(),
            name_suffix: faker.person.suffix(),
          }),
          gender: faker.helpers.enumValue(Gender),
          county: faker.location.county(),
          birth_date: faker.date.birthdate(),
        },
        // existing client
        {
          external_id: fakeClient.externalId,
          pseudonymized_id: fakeClient.pseudonymizedId,
          case_ids: JSON.stringify([fakeCase.externalId]),
          state_code: StateCode.US_ID,
          full_name: JSON.stringify({
            given_names: faker.person.firstName(),
            middle_names: faker.person.firstName(),
            surname: faker.person.lastName(),
            name_suffix: faker.person.suffix(),
          }),
          gender: faker.helpers.enumValue(Gender),
          // Set a new county
          county: "my fake county",
          district: "my fake district",
          birth_date: faker.date.birthdate(),
        },
      ]);

      const response = await callHandleImportClientData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbClients = await testPrismaClient.client.findMany({});

      // There should only be two clients in the database - the new one and the updated existing one
      expect(dbClients).toHaveLength(2);

      expect(dbClients).toEqual([
        expect.objectContaining({
          externalId: "new-client-ext-id",
        }),
        expect.objectContaining({
          externalId: "client-ext-1",
          county: "my fake county",
          district: "my fake district",
        }),
      ]);
    });

    test("should set isGenderLocked if known gender is provided", async () => {
      dataProviderSingleton.setData([
        // New client
        {
          external_id: "new-client-ext-id",
          pseudonymized_id: "new-client-pid",
          case_ids: JSON.stringify(["new-case-ext-id"]),
          state_code: StateCode.US_ID,
          full_name: JSON.stringify({
            given_names: "Given",
            middle_names: "Middle",
            surname: "Last",
            name_suffix: "Sr.",
          }),
          gender: Gender.FEMALE,
          county: faker.location.county(),
          birth_date: faker.date.birthdate(),
        },
        // existing client
        {
          external_id: fakeClient.externalId,
          pseudonymized_id: fakeClient.pseudonymizedId,
          case_ids: JSON.stringify([fakeCase.externalId]),
          state_code: StateCode.US_ID,
          full_name: JSON.stringify({
            given_names: faker.person.firstName(),
            middle_names: faker.person.firstName(),
            surname: faker.person.lastName(),
            name_suffix: faker.person.suffix(),
          }),
          gender: faker.helpers.enumValue(Gender),
          // Set a new county
          county: "my fake county",
          birth_date: faker.date.birthdate(),
        },
      ]);

      const response = await callHandleImportClientData(testServer);

      expect(response.statusCode).toBe(200);

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
      dataProviderSingleton.setData([
        // New client
        {
          external_id: "new-client-ext-id",
          pseudonymized_id: "new-client-pid",
          case_ids: JSON.stringify(["new-case-ext-id"]),
          state_code: StateCode.US_ID,
          full_name: JSON.stringify({
            given_names: "Given",
            middle_names: "Middle",
            surname: "Last",
            name_suffix: "Sr.",
          }),
          gender: Gender.INTERNAL_UNKNOWN,
          county: faker.location.county(),
          birth_date: faker.date.birthdate(),
        },
      ]);

      const response = await callHandleImportClientData(testServer);

      expect(response.statusCode).toBe(200);

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
      dataProviderSingleton.setData([
        // New client
        {
          external_id: "new-client-ext-id",
          pseudonymized_id: "new-client-pid",
          case_ids: JSON.stringify(["new-case-ext-id"]),
          state_code: StateCode.US_ID,
          full_name: JSON.stringify({
            given_names: "Given",
            middle_names: "Middle",
            surname: "Last",
            name_suffix: "Sr.",
          }),
          gender: Gender.EXTERNAL_UNKNOWN,
          county: faker.location.county(),
          birth_date: faker.date.birthdate(),
        },
      ]);

      const response = await callHandleImportClientData(testServer);

      expect(response.statusCode).toBe(200);

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
      dataProviderSingleton.setData([
        // existing client
        {
          external_id: fakeClient.externalId,
          pseudonymized_id: fakeClient.pseudonymizedId,
          case_ids: JSON.stringify([fakeCase.externalId]),
          state_code: StateCode.US_ID,
          full_name: JSON.stringify({
            given_names: faker.person.firstName(),
            middle_names: faker.person.firstName(),
            surname: faker.person.lastName(),
            name_suffix: faker.person.suffix(),
          }),
          gender: Gender.EXTERNAL_UNKNOWN,
          county: "my fake county",
          birth_date: faker.date.birthdate(),
        },
      ]);

      const response = await callHandleImportClientData(testServer);

      expect(response.statusCode).toBe(200);

      const dbClients = await testPrismaClient.client.findMany({});

      // The gender should have been kept
      expect(dbClients).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            externalId: fakeClient.externalId,
            gender: fakeClient.gender,
          }),
        ]),
      );
    });
  });

  describe("import staff data", () => {
    test("should throw error if state is not supported", async () => {
      dataProviderSingleton.setData([
        // New staff
        {
          external_id: "new-staff-ext-id",
          pseudonymized_id: "new-staff-pid",
          case_ids: JSON.stringify(["new-case-ext-id"]),
          state_code: StateCode.US_ID,
          full_name: JSON.stringify({
            given_names: "Given",
            middle_names: "Middle",
            surname: "Last",
            name_suffix: "Sr.",
          }),
          email: faker.internet.email(),
        },
      ]);

      const response = await callHandleImport(testServer, {
        ...staffBody,
        objectId: "US_ME/sentencing_staff_record.json",
      });

      expect(response.statusCode).toBe(400);

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Unsupported bucket + object pair: test-bucket/US_ME/sentencing_staff_record.json",
      );
    });

    test("should log any zod errors but insert correct rows", async () => {
      dataProviderSingleton.setData([
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
        // new staff (with invalid state code)
        {
          external_id: "new-staff-ext-id",
          pseudonymized_id: "new-staff-pid",
          case_ids: JSON.stringify(["new-case-ext-id"]),
          state_code: "NOT A STATE CODE",
          full_name: JSON.stringify({
            given_names: faker.person.firstName(),
            middle_names: faker.person.firstName(),
            surname: faker.person.lastName(),
            name_suffix: faker.person.suffix(),
          }),
          email: faker.internet.email(),
        },
      ]);

      const response = await callHandleImportStaffData(testServer);

      expect(response.statusCode).toBe(500);

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Error importing object US_ID/sentencing_staff_record.json from bucket test-bucket: \nError parsing data:\nData: {",
      );

      const dbStaff = await testPrismaClient.staff.findMany();
      // The old client should still be updated
      expect(dbStaff).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            externalId: "staff-ext-1",
            email: "existing_staff@gmail.com",
          }),
        ]),
      );
    });

    test("should import new staff data and upsert existing staff", async () => {
      dataProviderSingleton.setData([
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

      const response = await callHandleImportStaffData(testServer);

      expect(response.statusCode).toBe(200);

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

  describe("import opportunity data", () => {
    test("should throw error if state is not supported", async () => {
      dataProviderSingleton.setData([
        // New opportunity
        {
          OpportunityName: "new-opportunity-name",
          Description: "new-opportunity-description",
          CleanedProviderPhoneNumber: "9256400137",
          ProviderWebsite: "fake.com",
          ProviderAddress: "123 Main Street",
          developmentalDisabilityDiagnosisCriterion: false,
          noCurrentOrPriorSexOffenseCriterion: false,
          noCurrentOrPriorViolentOffenseCriterion: false,
          noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
          entryOfGuiltyPleaCriterion: false,
          veteranStatusCriterion: false,
          NeedsAddressed: [],
          diagnosedMentalHealthDiagnosisCriterion: [],
          priorCriminalHistoryCriterion: PriorCriminalHistoryCriterion.None,
          asamLevelOfCareRecommendationCriterion:
            AsamLevelOfCareRecommendationCriterion.Any,
          diagnosedSubstanceUseDisorderCriterion:
            DiagnosedMentalHealthDiagnosisCriterion.Any,
          minLsirScoreCriterion: 10,
          maxLsirScoreCriterion: 10,
          minAge: 35,
          maxAge: 55,
          district: "D1",
          lastUpdatedDate: lastUpdatedDate,
          additionalNotes: "new-opportunity-notes",
          genders: ["Men"],
          genericDescription: "new-opportunity-generic-description",
        },
      ]);

      const response = await callHandleImport(testServer, {
        ...opportunityBody,
        objectId: "US_ME/sentencing_community_opportunity_record.json",
      });

      expect(response.statusCode).toBe(400);

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Unsupported bucket + object pair: test-bucket/US_ME/sentencing_community_opportunity_record.json",
      );
    });

    test("should log any zod errors but insert correct rows, and not delete any old opportunities", async () => {
      dataProviderSingleton.setData([
        // New opportunity (missing required fields)
        {
          OpportunityName: "new-opportunity-name",
        },
      ]);

      const response = await callHandleImportOpportunityData(testServer);

      expect(response.statusCode).toBe(500);

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Error importing object US_ID/sentencing_community_opportunity_record.json from bucket test-bucket: \nError parsing data:\nData: {",
      );

      const dbOpportunities = await testPrismaClient.opportunity.findMany();
      // The old opportunity should still be in there because there was a data error
      expect(dbOpportunities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            opportunityName: fakeOpportunity.opportunityName,
          }),
        ]),
      );
    });

    test("should import new opportunity and delete old data", async () => {
      dataProviderSingleton.setData([
        // New opportunity
        {
          OpportunityName: "new-opportunity-name",
          Description: "new-opportunity-description",
          CleanedProviderPhoneNumber: "9256400137",
          ProviderWebsite: "fake.com",
          ProviderAddress: "123 Main Street",
          developmentalDisabilityDiagnosisCriterion: false,
          noCurrentOrPriorSexOffenseCriterion: false,
          noCurrentOrPriorViolentOffenseCriterion: false,
          noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
          entryOfGuiltyPleaCriterion: false,
          veteranStatusCriterion: false,
          NeedsAddressed: [],
          diagnosedMentalHealthDiagnosisCriterion: [],
          priorCriminalHistoryCriterion: PriorCriminalHistoryCriterion.None,
          asamLevelOfCareRecommendationCriterion:
            AsamLevelOfCareRecommendationCriterion.Any,
          diagnosedSubstanceUseDisorderCriterion:
            DiagnosedMentalHealthDiagnosisCriterion.Any,
          minLsirScoreCriterion: 10,
          maxLsirScoreCriterion: 10,
          minAge: 35,
          maxAge: 55,
          district: "D1",
          lastUpdatedDate: lastUpdatedDate,
          additionalNotes: "new-opportunity-notes",
          genders: ["Men"],
          genericDescription: "new-opportunity-generic-description",
        },
      ]);

      const response = await callHandleImportOpportunityData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new opportunity was created
      const dbOpportunities = await testPrismaClient.opportunity.findMany({});

      // There should only be one opportunity in the database - the new one should have been created
      // and the old one should have been deleted
      expect(dbOpportunities).toHaveLength(1);

      const newOpportunity = dbOpportunities[0];
      expect(newOpportunity).toEqual(
        expect.objectContaining({
          opportunityName: "new-opportunity-name",
          description: "new-opportunity-description",
          // Since no provider name was provided, it should use the default name
          providerName: OPPORTUNITY_UNKNOWN_PROVIDER_NAME,
          providerPhoneNumber: "9256400137",
          providerWebsite: "fake.com",
          providerAddress: "123 Main Street",
          developmentalDisabilityDiagnosisCriterion: false,
          noCurrentOrPriorSexOffenseCriterion: false,
          noCurrentOrPriorViolentOffenseCriterion: false,
          noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
          entryOfGuiltyPleaCriterion: false,
          veteranStatusCriterion: false,
          needsAddressed: [],
          diagnosedMentalHealthDiagnosisCriterion: [],
          priorCriminalHistoryCriterion: PriorCriminalHistoryCriterion.None,
          asamLevelOfCareRecommendationCriterion:
            AsamLevelOfCareRecommendationCriterion.Any,
          diagnosedSubstanceUseDisorderCriterion:
            DiagnosedMentalHealthDiagnosisCriterion.Any,
          minLsirScoreCriterion: 10,
          maxLsirScoreCriterion: 10,
          minAge: 35,
          maxAge: 55,
          district: "D1",
          lastUpdatedAt: lastUpdatedDate,
          additionalNotes: "new-opportunity-notes",
          genders: [Gender.MALE],
          genericDescription: "new-opportunity-generic-description",
        }),
      );
    });

    test("should upsert existing opportunity", async () => {
      dataProviderSingleton.setData([
        // existing opportunity
        {
          OpportunityName: fakeOpportunity.opportunityName,
          Description: fakeOpportunity.description,
          ProviderName: "provider-name",
          CleanedProviderPhoneNumber: fakeOpportunity.providerPhoneNumber,
          ProviderWebsite: "fake.com",
          ProviderAddress: "123 Main Street",
          developmentalDisabilityDiagnosisCriterion: false,
          noCurrentOrPriorSexOffenseCriterion: false,
          noCurrentOrPriorViolentOffenseCriterion: false,
          noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
          entryOfGuiltyPleaCriterion: false,
          veteranStatusCriterion: false,
          NeedsAddressed: [],
          diagnosedMentalHealthDiagnosisCriterion: [],
          lastUpdatedDate: lastUpdatedDate,
        },
        // New opportunity
        {
          OpportunityName: "new-opportunity-name",
          Description: "new-opportunity-description",
          ProviderName: "provider-name",
          CleanedProviderPhoneNumber: "1234567890",
          ProviderWebsite: "fake.com",
          ProviderAddress: "123 Main Street",
          developmentalDisabilityDiagnosisCriterion: false,
          noCurrentOrPriorSexOffenseCriterion: false,
          noCurrentOrPriorViolentOffenseCriterion: false,
          noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
          entryOfGuiltyPleaCriterion: false,
          veteranStatusCriterion: false,
          NeedsAddressed: [],
          diagnosedMentalHealthDiagnosisCriterion: [],
          lastUpdatedDate: lastUpdatedDate,
        },
      ]);

      const response = await callHandleImportOpportunityData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new opportunity was created
      const dbOpportunities = await testPrismaClient.opportunity.findMany({});

      // There should only be two opportunites in the database - the new one and the updated existing one
      expect(dbOpportunities).toHaveLength(2);

      expect(dbOpportunities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            opportunityName: "opportunity-name",
          }),
          expect.objectContaining({
            opportunityName: "new-opportunity-name",
          }),
        ]),
      );
    });

    test("should only delete opportunities that don't match composite id", async () => {
      // Create two new opportunities, one with the same name but with the provider name changed, and another one with vice versa
      // These two should be deleted after import since they don't match the composite id of the existing opportunity
      await testPrismaClient.opportunity.createMany({
        data: [
          {
            opportunityName: fakeOpportunity.opportunityName,
            description: "new-opportunity-description-1",
            providerName: "new-provider-name-1",
            providerPhoneNumber: "1234567890",
            providerWebsite: faker.internet.url(),
            providerAddress: faker.location.streetAddress(),
            developmentalDisabilityDiagnosisCriterion: false,
            noCurrentOrPriorSexOffenseCriterion: false,
            noCurrentOrPriorViolentOffenseCriterion: false,
            noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
            entryOfGuiltyPleaCriterion: false,
            veteranStatusCriterion: false,
            lastUpdatedAt: lastUpdatedDate,
          },
          {
            opportunityName: "new-opportunity-name",
            description: "new-opportunity-description-2",
            providerName: fakeOpportunity.providerName,
            providerPhoneNumber: "1234567890",
            providerWebsite: faker.internet.url(),
            providerAddress: faker.location.streetAddress(),
            developmentalDisabilityDiagnosisCriterion: false,
            noCurrentOrPriorSexOffenseCriterion: false,
            noCurrentOrPriorViolentOffenseCriterion: false,
            noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
            entryOfGuiltyPleaCriterion: false,
            veteranStatusCriterion: false,
            lastUpdatedAt: lastUpdatedDate,
          },
        ],
      });

      dataProviderSingleton.setData([
        // original existing opportunity
        {
          OpportunityName: fakeOpportunity.opportunityName,
          Description: fakeOpportunity.description,
          ProviderName: fakeOpportunity.providerName,
          CleanedProviderPhoneNumber: fakeOpportunity.providerPhoneNumber,
          ProviderWebsite: "fake.com",
          ProviderAddress: "123 Main Street",
          developmentalDisabilityDiagnosisCriterion: false,
          noCurrentOrPriorSexOffenseCriterion: false,
          noCurrentOrPriorViolentOffenseCriterion: false,
          noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
          entryOfGuiltyPleaCriterion: false,
          veteranStatusCriterion: false,
          NeedsAddressed: [],
          diagnosedMentalHealthDiagnosisCriterion: [],
          lastUpdatedDate: lastUpdatedDate,
        },
      ]);

      const response = await callHandleImportOpportunityData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new opportunity was created
      const dbOpportunities = await testPrismaClient.opportunity.findMany({});

      // There should only be one opportunity in the database - the new one should have been created
      // and the old one should have been deleted
      expect(dbOpportunities).toHaveLength(1);

      const newOpportunity = dbOpportunities[0];
      expect(newOpportunity).toEqual(
        expect.objectContaining({
          opportunityName: "opportunity-name",
          providerName: fakeOpportunity.providerName,
        }),
      );
    });
  });

  describe("import insight data", () => {
    test("should throw error if state is not supported", async () => {
      dataProviderSingleton.setData([
        // New insight
        {
          state_code: StateCode.US_ID,
          // We use MALE because the existing insight uses FEMALE, so there is no chance of a collision
          gender: Gender.MALE,
          assessment_score_bucket_start: faker.number.int({ max: 100 }),
          assessment_score_bucket_end: faker.number.int({ max: 100 }),
          most_severe_description: fakeOffense.name,
          recidivism_rollup: JSON.stringify({
            state_code: StateCode.US_ID,
            gender: Gender.MALE,
            assessment_score_bucket_start: faker.number.int({ max: 100 }),
            assessment_score_bucket_end: faker.number.int({ max: 100 }),
            most_severe_ncic_category_uniform: faker.string.alpha(),
          }),
          recidivism_num_records: faker.number.int({ max: 100 }),
          recidivism_probation_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          recidivism_rider_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          recidivism_term_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          disposition_num_records: faker.number.int({ max: 100 }),
          disposition_probation_pc: faker.number.float(),
          disposition_rider_pc: faker.number.float(),
          disposition_term_pc: faker.number.float(),
        },
      ]);

      const response = await callHandleImport(testServer, {
        ...insightBody,
        objectId: "US_ME/case_insights_record.json",
      });

      expect(response.statusCode).toBe(400);

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Unsupported bucket + object pair: test-bucket/US_ME/case_insights_record.json",
      );
    });

    test("should log any zod errors but insert correct rows, and not delete any old insights", async () => {
      dataProviderSingleton.setData([
        // Old insight with new data
        {
          state_code: fakeInsight.stateCode,
          // We use MALE because the existing insight uses FEMALE, so there is no chance of a collision
          gender: fakeInsight.gender,
          assessment_score_bucket_start: fakeInsight.assessmentScoreBucketStart,
          assessment_score_bucket_end: fakeInsight.assessmentScoreBucketEnd,
          most_severe_description: fakeOffense.name,
          recidivism_rollup: JSON.stringify({
            state_code: StateCode.US_ID,
            gender: Gender.MALE,
            assessment_score_bucket_start: faker.number.int({ max: 100 }),
            assessment_score_bucket_end: faker.number.int({ max: 100 }),
            most_severe_ncic_category_uniform: faker.string.alpha(),
          }),
          // Update num records
          recidivism_num_records: 78923,
          recidivism_probation_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          recidivism_rider_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          recidivism_term_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          disposition_num_records: faker.number.int({ max: 100 }),
          disposition_probation_pc: faker.number.float(),
          disposition_rider_pc: faker.number.float(),
          disposition_term_pc: faker.number.float(),
        },
        // New insight (with bad rollup data)
        {
          state_code: StateCode.US_ID,
          // We use MALE because the existing insight uses FEMALE, so there is no chance of a collision
          gender: Gender.MALE,
          assessment_score_bucket_start: faker.number.int({ max: 100 }),
          assessment_score_bucket_end: faker.number.int({ max: 100 }),
          most_severe_description: fakeOffense.name,
          recidivism_rollup: "Bad rollup data",
        },
      ]);

      const response = await callHandleImportInsightData(testServer);

      expect(response.statusCode).toBe(500);

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Error importing object US_ID/case_insights_record.json from bucket test-bucket: \nError parsing data:\nData: {",
      );

      const dbInsights = await testPrismaClient.insight.findMany({
        include: {
          offense: {
            select: {
              name: true,
            },
          },
        },
      });
      // The old insight should have been updated
      expect(dbInsights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            gender: fakeInsight.gender,
            assessmentScoreBucketStart: fakeInsight.assessmentScoreBucketStart,
            assessmentScoreBucketEnd: fakeInsight.assessmentScoreBucketEnd,
            offense: expect.objectContaining({
              name: fakeOffense.name,
            }),
            rollupRecidivismNumRecords: 78923,
          }),
        ]),
      );
    });

    test("should import new insights and delete old data", async () => {
      dataProviderSingleton.setData([
        // New insights
        {
          state_code: StateCode.US_ID,
          // We use MALE because the existing insight uses FEMALE, so there is no chance of a collision
          gender: Gender.MALE,
          assessment_score_bucket_start: faker.number.int({ max: 100 }),
          assessment_score_bucket_end: faker.number.int({ max: 100 }),
          most_severe_description: fakeOffense.name,
          recidivism_rollup: JSON.stringify({
            state_code: StateCode.US_ID,
            gender: Gender.MALE,
            assessment_score_bucket_start: faker.number.int({ max: 100 }),
            assessment_score_bucket_end: faker.number.int({ max: 100 }),
            most_severe_ncic_category_uniform: faker.string.alpha(),
          }),
          recidivism_num_records: faker.number.int({ max: 100 }),
          recidivism_probation_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          recidivism_rider_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          recidivism_term_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          disposition_num_records: faker.number.int({ max: 100 }),
          disposition_probation_pc: faker.number.float(),
          disposition_rider_pc: faker.number.float(),
          disposition_term_pc: faker.number.float(),
        },
        {
          state_code: StateCode.US_ID,
          gender: Gender.MALE,
          assessment_score_bucket_start: faker.number.int({ max: 100 }),
          assessment_score_bucket_end: faker.number.int({ max: 100 }),
          most_severe_description: "another-offense",
          recidivism_rollup: JSON.stringify({
            state_code: StateCode.US_ID,
            any_is_violent_uniform: true,
          }),
          recidivism_num_records: faker.number.int({ max: 100 }),
          recidivism_probation_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          recidivism_rider_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          recidivism_term_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          disposition_num_records: faker.number.int({ max: 100 }),
          disposition_probation_pc: faker.number.float(),
          disposition_rider_pc: faker.number.float(),
          disposition_term_pc: faker.number.float(),
        },
      ]);

      const response = await callHandleImportInsightData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new Insights were created
      const dbInsights = await testPrismaClient.insight.findMany({
        include: {
          rollupRecidivismSeries: {
            select: {
              recommendationType: true,
              dataPoints: true,
            },
          },
          dispositionData: true,
        },
      });

      // There should be two insights in the database - just the two new ones
      expect(dbInsights).toHaveLength(2);

      expect(dbInsights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            gender: "MALE",
            rollupStateCode: StateCode.US_ID,
            rollupGender: Gender.MALE,
            rollupAssessmentScoreBucketStart: expect.any(Number),
            rollupAssessmentScoreBucketEnd: expect.any(Number),
            rollupNcicCategory: expect.any(String),
            rollupRecidivismNumRecords: expect.any(Number),
            rollupRecidivismSeries: expect.arrayContaining([
              // There should be two data points for each series
              expect.objectContaining({
                recommendationType: "Probation",
                dataPoints: expect.arrayContaining([
                  expect.objectContaining({}),
                  expect.objectContaining({}),
                ]),
              }),
              expect.objectContaining({
                recommendationType: "Rider",
                dataPoints: expect.arrayContaining([
                  expect.objectContaining({ cohortMonths: expect.any(Number) }),
                  expect.objectContaining({ cohortMonths: expect.any(Number) }),
                ]),
              }),
              expect.objectContaining({
                recommendationType: "Term",
                dataPoints: expect.arrayContaining([
                  expect.objectContaining({ cohortMonths: expect.any(Number) }),
                  expect.objectContaining({ cohortMonths: expect.any(Number) }),
                ]),
              }),
            ]),
            dispositionNumRecords: expect.any(Number),
            dispositionData: expect.arrayContaining([
              // There should be one of each type of disposition
              expect.objectContaining({ recommendationType: "Probation" }),
              expect.objectContaining({ recommendationType: "Rider" }),
              expect.objectContaining({ recommendationType: "Term" }),
            ]),
          }),
          expect.objectContaining({
            gender: "MALE",
            rollupStateCode: StateCode.US_ID,
            rollupViolentOffense: true,
            rollupRecidivismNumRecords: expect.any(Number),
            rollupRecidivismSeries: expect.arrayContaining([
              // There should be two data points for each series
              expect.objectContaining({
                recommendationType: "Probation",
                dataPoints: expect.arrayContaining([
                  expect.objectContaining({}),
                  expect.objectContaining({}),
                ]),
              }),
              expect.objectContaining({
                recommendationType: "Rider",
                dataPoints: expect.arrayContaining([
                  expect.objectContaining({ cohortMonths: expect.any(Number) }),
                  expect.objectContaining({ cohortMonths: expect.any(Number) }),
                ]),
              }),
              expect.objectContaining({
                recommendationType: "Term",
                dataPoints: expect.arrayContaining([
                  expect.objectContaining({ cohortMonths: expect.any(Number) }),
                  expect.objectContaining({ cohortMonths: expect.any(Number) }),
                ]),
              }),
            ]),
            dispositionNumRecords: expect.any(Number),
            dispositionData: expect.arrayContaining([
              // There should be one of each type of disposition
              expect.objectContaining({ recommendationType: "Probation" }),
              expect.objectContaining({ recommendationType: "Rider" }),
              expect.objectContaining({ recommendationType: "Term" }),
            ]),
          }),
        ]),
      );
    });

    test("should handle null dispositions", async () => {
      dataProviderSingleton.setData([
        // New insight
        {
          state_code: StateCode.US_ID,
          // We use MALE because the existing insight uses FEMALE, so there is no chance of a collision
          gender: Gender.MALE,
          assessment_score_bucket_start: faker.number.int({ max: 100 }),
          assessment_score_bucket_end: faker.number.int({ max: 100 }),
          most_severe_description: fakeOffense.name,
          recidivism_rollup: JSON.stringify({
            state_code: StateCode.US_ID,
            gender: Gender.MALE,
            assessment_score_bucket_start: faker.number.int({ max: 100 }),
            assessment_score_bucket_end: faker.number.int({ max: 100 }),
            most_severe_ncic_category_uniform: faker.string.alpha(),
          }),
          recidivism_num_records: faker.number.int({ max: 100 }),
          recidivism_probation_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          recidivism_rider_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          recidivism_term_series: JSON.stringify(
            createFakeRecidivismSeriesForImport(),
          ),
          disposition_num_records: null,
          disposition_probation_pc: null,
          disposition_rider_pc: null,
          disposition_term_pc: null,
        },
      ]);

      const response = await callHandleImportInsightData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new Insight was created
      const dbInsights = await testPrismaClient.insight.findMany({
        include: {
          rollupRecidivismSeries: {
            select: {
              recommendationType: true,
              dataPoints: true,
            },
          },
          dispositionData: true,
        },
      });

      // There should only be one insight in the database - the new one should have been created
      // and the old one should have been deleted
      expect(dbInsights).toHaveLength(1);

      const newInsight = dbInsights[0];
      expect(newInsight).toEqual(
        expect.objectContaining({
          gender: "MALE",
          rollupStateCode: StateCode.US_ID,
          rollupGender: Gender.MALE,
          rollupAssessmentScoreBucketStart: expect.any(Number),
          rollupAssessmentScoreBucketEnd: expect.any(Number),
          rollupNcicCategory: expect.any(String),
          rollupRecidivismNumRecords: expect.any(Number),
          rollupRecidivismSeries: expect.arrayContaining([
            // There should be two data points for each series
            expect.objectContaining({
              recommendationType: "Probation",
              dataPoints: expect.arrayContaining([
                expect.objectContaining({}),
                expect.objectContaining({}),
              ]),
            }),
            expect.objectContaining({
              recommendationType: "Rider",
              dataPoints: expect.arrayContaining([
                expect.objectContaining({ cohortMonths: expect.any(Number) }),
                expect.objectContaining({ cohortMonths: expect.any(Number) }),
              ]),
            }),
            expect.objectContaining({
              recommendationType: "Term",
              dataPoints: expect.arrayContaining([
                expect.objectContaining({ cohortMonths: expect.any(Number) }),
                expect.objectContaining({ cohortMonths: expect.any(Number) }),
              ]),
            }),
          ]),
          dispositionNumRecords: 0,
          // There shouldn't be any disposition data
          dispositionData: expect.arrayContaining([]),
        }),
      );
    });
  });

  describe("import offense data", () => {
    test("should throw error if state is not supported", async () => {
      dataProviderSingleton.setData([
        // Old offense
        {
          state_code: StateCode.US_ID,
          charge: fakeOffense.name,
        },
        // New offense
        {
          state_code: StateCode.US_ID,
          charge: "new-offense",
        },
      ]);

      const response = await callHandleImport(testServer, {
        ...offenseBody,
        objectId: "US_ME/sentencing_charge_record.json",
      });

      expect(response.statusCode).toBe(400);

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Unsupported bucket + object pair: test-bucket/US_ME/sentencing_charge_record.json",
      );
    });

    test("should log any zod errors but insert correct rows", async () => {
      dataProviderSingleton.setData([
        // Old offense
        {
          state_code: StateCode.US_ID,
          charge: fakeOffense.name,
          is_sex_offense: false,
          frequency: 101,
        },
        // New offense (with bad state code)
        {
          state_code: "NOT A STATE CODE",
          charge: "new-offense",
          is_sex_offense: false,
          frequency: 10,
        },
      ]);

      const response = await callHandleImportOffenseData(testServer);

      expect(response.statusCode).toBe(500);

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Error importing object US_ID/sentencing_charge_record.json from bucket test-bucket: \nError parsing data:\nData: {",
      );

      const dbOffenses = await testPrismaClient.offense.findMany();
      // The old offense should still be in there because there was a data error
      expect(dbOffenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: fakeOffense.name,
            isSexOffense: false,
            // This should be explicitly updated to null
            isViolentOffense: null,
            frequency: 101,
          }),
        ]),
      );
    });

    test("should import new offenses", async () => {
      dataProviderSingleton.setData([
        // Old offense
        {
          state_code: StateCode.US_ID,
          charge: fakeOffense.name,
          is_sex_offense: false,
          frequency: 100,
        },
        // New offense
        {
          state_code: StateCode.US_ID,
          charge: "new-offense",
          is_sex_offense: false,
          frequency: 10,
        },
      ]);

      const response = await callHandleImportOffenseData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new offense was created
      const dbOffenses = await testPrismaClient.offense.findMany();

      // There should only be two offenses in the database - the old one should have been preserved and the new one created
      expect(dbOffenses).toHaveLength(2);

      expect(dbOffenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: fakeOffense.name,
            isSexOffense: false,
            // This should be explicitly updated to null
            isViolentOffense: null,
            frequency: 100,
          }),
          expect.objectContaining({
            name: "new-offense",
            isSexOffense: false,
            isViolentOffense: null,
            frequency: 10,
          }),
        ]),
      );
    });

    test("should capture exception if existing offense is missing", async () => {
      dataProviderSingleton.setData([
        // New offense
        {
          state_code: StateCode.US_ID,
          charge: "new-offense",
          frequency: 10,
        },
      ]);

      const response = await callHandleImportOffenseData(testServer);

      expect(response.statusCode).toBe(200);

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toBe(
        "Error when importing offenses! These offenses exist in the database but are missing from the data import: offense-name",
      );
    });

    test("should not capture exception if missing offense is a placeholder one", async () => {
      await testPrismaClient.offense.create({
        data: {
          stateCode: "US_ID",
          name: "[PLACEHOLDER] Ben's offense",
        },
      });

      // Missing the placeholder offense
      dataProviderSingleton.setData([
        // Old offense
        {
          state_code: StateCode.US_ID,
          charge: fakeOffense.name,
          is_sex_offense: false,
          frequency: 100,
        },
        // New offense
        {
          state_code: StateCode.US_ID,
          charge: "new-offense",
          is_sex_offense: false,
          frequency: 10,
        },
      ]);

      const response = await callHandleImportOffenseData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new offense was created
      const dbOffenses = await testPrismaClient.offense.findMany();

      // There should be three offenses in the database - the real old one, the placeholder old one, and the new one
      expect(dbOffenses).toHaveLength(3);

      expect(dbOffenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: fakeOffense.name,
            isSexOffense: false,
            // This should be explicitly updated to null
            isViolentOffense: null,
            frequency: 100,
          }),
          expect.objectContaining({
            name: "new-offense",
            isSexOffense: false,
            isViolentOffense: null,
            frequency: 10,
          }),
          expect.objectContaining({
            name: "[PLACEHOLDER] Ben's offense",
          }),
        ]),
      );

      // Shouldn't have any errors
      await testAndGetSentryReports(0);
    });
  });
});
