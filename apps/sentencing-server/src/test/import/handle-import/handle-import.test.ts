import { faker } from "@faker-js/faker";
import { Gender, StateCode } from "@prisma/client";
import { MockStorage } from "mock-gcs";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { prismaClient } from "~sentencing-server/prisma";
import { testAndGetSentryReport } from "~sentencing-server/test/import/common/utils";
import { caseBody } from "~sentencing-server/test/import/handle-import/constants";
import {
  arrayToJsonLines,
  callHandleImportCaseData,
  callHandleImportClientData,
  callHandleImportInsightData,
  callHandleImportOffenseData,
  callHandleImportOpportunityData,
  callHandleImportStaffData,
  createFakeRecidivismSeriesForImport,
} from "~sentencing-server/test/import/handle-import/utils";
import { testServer } from "~sentencing-server/test/setup";
import {
  fakeCase,
  fakeCasePrismaInput,
  fakeClient,
  fakeOffense,
  fakeOpportunity,
  fakeStaff,
} from "~sentencing-server/test/setup/seed";

const TEST_BUCKET_ID = "bucket-id";

const mockStorageSingleton = new MockStorage();
let getPayloadImp = vi.fn();

vi.mock("@google-cloud/storage", () => ({
  Storage: vi.fn().mockImplementation(() => {
    return mockStorageSingleton;
  }),
}));

vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn().mockImplementation(() => {
    return {
      verifyIdToken: vi.fn().mockResolvedValue({
        getPayload: getPayloadImp,
      }),
    };
  }),
}));

beforeEach(() => {
  getPayloadImp = vi.fn().mockReturnValue({
    email_verified: true,
    email: "test-task@fake.com",
  });
});

describe("handle_import", () => {
  describe("auth", () => {
    test("should throw error if there is no token", async () => {
      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: caseBody,
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });

      const sentryReport = await testAndGetSentryReport();
      expect(sentryReport.error?.message).toEqual(
        "No bearer token was provided",
      );
    });

    test("should throw error if there is no token payload", async () => {
      getPayloadImp = vi.fn().mockReturnValue(undefined);

      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: caseBody,
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });

      const sentryReport = await testAndGetSentryReport();
      expect(sentryReport.error?.message).toEqual(
        "error verifying auth token for handle_import: Error: Email not verified",
      );
    });

    test("should throw error if email is not verified", async () => {
      getPayloadImp = vi.fn().mockReturnValue({
        email_verified: false,
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: caseBody,
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });

      const sentryReport = await testAndGetSentryReport();
      expect(sentryReport.error?.message).toEqual(
        "error verifying auth token for handle_import: Error: Email not verified",
      );
    });

    test("should throw error if there is no email", async () => {
      getPayloadImp = vi.fn().mockReturnValue({
        email_verified: true,
        email: undefined,
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: caseBody,
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });

      const sentryReport = await testAndGetSentryReport();
      expect(sentryReport.error?.message).toEqual(
        "error verifying auth token for handle_import: Error: Email not verified",
      );
    });

    test("should throw error if email doesn't match expected", async () => {
      getPayloadImp = vi.fn().mockReturnValue({
        email_verified: true,
        email: "not-the-right-email@gmail.com",
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: caseBody,
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });

      const sentryReport = await testAndGetSentryReport();
      expect(sentryReport.error?.message).toEqual(
        "error verifying auth token for handle_import: Error: Invalid email address",
      );
    });

    test("should throw error if file type is invalid", async () => {
      getPayloadImp = vi.fn().mockReturnValue({
        email_verified: true,
        email: "test-task@fake.com",
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: {
          bucketId: "bucket-id",
          objectId: "US_ID/not-a-valid-file.json",
        },
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });

      const sentryReport = await testAndGetSentryReport();
      expect(sentryReport.error?.message).toEqual(
        "Invalid object ID: Error: Invalid object id: US_ID/not-a-valid-file.json",
      );
    });

    test("should work if email is correct", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_case_record.json")
        .save(
          arrayToJsonLines([
            // New case
            {
              external_id: "new-case-ext-id",
              state_code: StateCode.US_ID,
              staff_id: fakeStaff.externalId,
              client_id: fakeClient.externalId,
              due_date: faker.date.future(),
              completion_date: faker.date.future(),
              sentence_date: faker.date.past(),
              assigned_date: faker.date.past(),
              county: faker.location.county(),
              lsir_score: faker.number.int({ max: 100 }).toString(),
              lsir_level: faker.number.int().toString(),
              report_type: faker.string.alpha(),
            },
          ]),
        );

      getPayloadImp = vi.fn().mockReturnValue({
        email_verified: true,
        email: "test-task@fake.com",
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: caseBody,
        headers: { authorization: `Bearer token` },
      });

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbCases = await prismaClient.case.findMany({});

      // There should only be one case in the database - the new one should have been created
      // and the old one should have been deleted
      expect(dbCases).toHaveLength(1);

      const newCase = dbCases[0];
      expect(newCase).toEqual(
        expect.objectContaining({
          externalId: "new-case-ext-id",
          // The new one should have also been linked to the existing client and cases
          clientId: fakeClient.externalId,
          staffId: fakeStaff.externalId,
        }),
      );
    });
  });

  test("should return 500 if there is an issue with data import", async () => {
    await mockStorageSingleton
      .bucket(TEST_BUCKET_ID)
      .file("US_ID/sentencing_charge_record.json")
      .save(
        arrayToJsonLines([
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
        ]),
      );

    const response = await callHandleImportOffenseData(testServer);

    expect(response.statusCode).toBe(500);

    const sentryReport = await testAndGetSentryReport();
    expect(sentryReport.error?.message).toContain(
      "Error importing object US_ID/sentencing_charge_record.json from bucket bucket-id:",
    );
  });

  describe("import case data", () => {
    test("should import new case data and delete old data", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_case_record.json")
        .save(
          arrayToJsonLines([
            // New case
            {
              external_id: "new-case-ext-id",
              state_code: StateCode.US_ID,
              staff_id: fakeStaff.externalId,
              client_id: fakeClient.externalId,
              due_date: faker.date.future(),
              completion_date: faker.date.future(),
              sentence_date: faker.date.past(),
              assigned_date: faker.date.past(),
              county: faker.location.county(),
              lsir_score: faker.number.int({ max: 100 }).toString(),
              lsir_level: faker.number.int().toString(),
              report_type: faker.string.alpha(),
            },
          ]),
        );

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbCases = await prismaClient.case.findMany({});

      // There should only be one case in the database - the new one should have been created
      // and the old one should have been deleted
      expect(dbCases).toHaveLength(1);

      const newCase = dbCases[0];
      expect(newCase).toEqual(
        expect.objectContaining({
          externalId: "new-case-ext-id",
          // The new one should have also been linked to the existing client and cases
          clientId: fakeClient.externalId,
          staffId: fakeStaff.externalId,
        }),
      );
    });

    test("should upsert existing cases", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_case_record.json")
        .save(
          arrayToJsonLines([
            // Existing case
            {
              external_id: fakeCase.externalId,
              state_code: StateCode.US_ID,
              staff_id: fakeStaff.externalId,
              client_id: fakeClient.externalId,
              due_date: faker.date.future(),
              completion_date: faker.date.future(),
              sentence_date: faker.date.past(),
              assigned_date: faker.date.past(),
              county: faker.location.county(),
              // Set the LSIR score to a new value
              lsir_score: (1000).toString(),
              lsir_level: faker.number.int().toString(),
              report_type: faker.string.alpha(),
            },
            // New case
            {
              external_id: "new-case-ext-id",
              state_code: StateCode.US_ID,
              staff_id: fakeStaff.externalId,
              client_id: fakeClient.externalId,
              due_date: faker.date.future(),
              completion_date: faker.date.future(),
              sentence_date: faker.date.past(),
              assigned_date: faker.date.past(),
              county: faker.location.county(),
              lsir_score: faker.number.int({ max: 100 }).toString(),
              lsir_level: faker.number.int().toString(),
              report_type: faker.string.alpha(),
            },
          ]),
        );

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbCases = await prismaClient.case.findMany({});

      // The old case should have been updated and the new one should have been inserted
      expect(dbCases).toEqual([
        expect.objectContaining({
          externalId: fakeCase.externalId,
          lsirScore: 1000,
        }),
        expect.objectContaining({ externalId: "new-case-ext-id" }),
      ]);
    });

    test("should not override lsirScore if provided data is undefined", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_case_record.json")
        .save(
          arrayToJsonLines([
            // Existing case with no lsirScore
            {
              external_id: fakeCase.externalId,
              state_code: StateCode.US_ID,
              staff_id: fakeStaff.externalId,
              client_id: fakeClient.externalId,
              due_date: faker.date.future(),
              completion_date: faker.date.future(),
              sentence_date: faker.date.past(),
              assigned_date: faker.date.past(),
              county: faker.location.county(),
              lsir_level: faker.number.int().toString(),
              report_type: faker.string.alpha(),
            },
          ]),
        );

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbCases = await prismaClient.case.findMany({});

      // The old case should have been updated but the lsirScore should not have been overridden
      expect(dbCases).toEqual([
        expect.objectContaining({
          externalId: fakeCase.externalId,
          lsirScore: fakeCase.lsirScore,
        }),
      ]);
    });

    test("should allow new cases to be uploaded even if their staff or client doesn't exist yet", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_case_record.json")
        .save(
          arrayToJsonLines([
            // New case with nonexistent staff and client
            {
              external_id: "new-case-ext-id",
              state_code: StateCode.US_ID,
              staff_id: "non-existent-staff-id",
              client_id: "non-existent-client-id",
              due_date: faker.date.future(),
              completion_date: faker.date.future(),
              sentence_date: faker.date.past(),
              assigned_date: faker.date.past(),
              county: faker.location.county(),
              lsir_score: faker.number.int({ max: 100 }).toString(),
              lsir_level: faker.number.int().toString(),
              report_type: faker.string.alpha(),
            },
          ]),
        );

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbCases = await prismaClient.case.findMany({});

      // There should only be one case in the database - the new one should have been created
      // and the old one should have been deleted
      expect(dbCases).toHaveLength(1);

      const newCase = dbCases[0];
      expect(newCase).toEqual(
        expect.objectContaining({
          externalId: "new-case-ext-id",
          // The new one should have been allowed to have been uploaded with no client or case
          clientId: null,
          staffId: null,
        }),
      );
    });

    test("should set lsirScoreLocked if lsir score is provided", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_case_record.json")
        .save(
          arrayToJsonLines([
            // New case
            {
              external_id: "new-case-ext-id",
              state_code: StateCode.US_ID,
              staff_id: fakeStaff.externalId,
              client_id: fakeClient.externalId,
              due_date: faker.date.future(),
              completion_date: faker.date.future(),
              sentence_date: faker.date.past(),
              assigned_date: faker.date.past(),
              county: faker.location.county(),
              lsir_score: faker.number.int({ max: 100 }).toString(),
              lsir_level: faker.number.int().toString(),
              report_type: faker.string.alpha(),
            },
          ]),
        );

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbCases = await prismaClient.case.findMany({});

      // There should only be one case in the database - the new one should have been created
      // and the old one should have been deleted
      expect(dbCases).toHaveLength(1);

      const newCase = dbCases[0];
      expect(newCase).toEqual(
        expect.objectContaining({
          externalId: "new-case-ext-id",
          // The new one should have also been linked to the existing client and cases
          clientId: fakeClient.externalId,
          staffId: fakeStaff.externalId,
          isLsirScoreLocked: true,
        }),
      );
    });

    test("should not set lsirScoreLocked if lsir score is not provided", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_case_record.json")
        .save(
          arrayToJsonLines([
            // New case
            {
              external_id: "new-case-ext-id",
              state_code: StateCode.US_ID,
              staff_id: fakeStaff.externalId,
              client_id: fakeClient.externalId,
              due_date: faker.date.future(),
              completion_date: faker.date.future(),
              sentence_date: faker.date.past(),
              assigned_date: faker.date.past(),
              county: faker.location.county(),
              lsir_level: faker.number.int().toString(),
              report_type: faker.string.alpha(),
            },
          ]),
        );

      const response = await callHandleImportCaseData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbCases = await prismaClient.case.findMany({});

      // There should only be one case in the database - the new one should have been created
      // and the old one should have been deleted
      expect(dbCases).toHaveLength(1);

      const newCase = dbCases[0];
      expect(newCase).toEqual(
        expect.objectContaining({
          externalId: "new-case-ext-id",
          // The new one should have also been linked to the existing client and cases
          clientId: fakeClient.externalId,
          staffId: fakeStaff.externalId,
          isLsirScoreLocked: false,
        }),
      );
    });
  });

  describe("import client data", () => {
    test("should import new client data and delete old data", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_client_record.json")
        .save(
          arrayToJsonLines([
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
          ]),
        );

      // Create a new case to link to the new client
      await prismaClient.case.create({
        data: {
          ...fakeCasePrismaInput,
          externalId: "new-case-ext-id",
          id: "new-case-id",
        },
      });

      const response = await callHandleImportClientData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbClients = await prismaClient.client.findMany({
        include: {
          Cases: true,
        },
      });

      // There should only be one client in the database - the new one should have been created
      // and the old one should have been deleted
      expect(dbClients).toHaveLength(1);

      const newClient = dbClients[0];
      expect(newClient).toEqual(
        expect.objectContaining({
          externalId: "new-client-ext-id",
          pseudonymizedId: "new-client-pid",
          // The name should be collapsed into a single field
          fullName: "Given Middle Last Sr.",
          // The case should have been linked as well
          Cases: [
            expect.objectContaining({
              externalId: "new-case-ext-id",
            }),
          ],
        }),
      );
    });

    test("should upsert existing clients", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_client_record.json")
        .save(
          arrayToJsonLines([
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
              birth_date: faker.date.birthdate(),
            },
          ]),
        );

      const response = await callHandleImportClientData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbClients = await prismaClient.client.findMany({});

      // There should only be two clients in the database - the new one and the updated existing one
      expect(dbClients).toHaveLength(2);

      expect(dbClients).toEqual([
        expect.objectContaining({
          externalId: "new-client-ext-id",
        }),
        expect.objectContaining({
          externalId: "client-ext-1",
          county: "my fake county",
        }),
      ]);
    });
  });

  describe("import staff data", () => {
    test("should import new staff data and delete old data", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_staff_record.json")
        .save(
          arrayToJsonLines([
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
          ]),
        );

      // Create a new case to link to the new client
      await prismaClient.case.create({
        data: {
          ...fakeCasePrismaInput,
          externalId: "new-case-ext-id",
          id: "new-case-id",
        },
      });

      const response = await callHandleImportStaffData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbStaff = await prismaClient.staff.findMany({
        include: {
          Cases: true,
        },
      });

      // There should only be one staff in the database - the new one should have been created
      // and the old one should have been deleted
      expect(dbStaff).toHaveLength(1);

      const newStaff = dbStaff[0];
      expect(newStaff).toEqual(
        expect.objectContaining({
          externalId: "new-staff-ext-id",
          pseudonymizedId: "new-staff-pid",
          // The name should be collapsed into a single field
          fullName: "Given Middle Last Sr.",
          // The case should have been linked as well
          Cases: [
            expect.objectContaining({
              externalId: "new-case-ext-id",
            }),
          ],
        }),
      );
    });

    test("should upsert existing staff", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_staff_record.json")
        .save(
          arrayToJsonLines([
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
          ]),
        );

      const response = await callHandleImportStaffData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new case was created
      const dbStaff = await prismaClient.staff.findMany({});

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
    test("should import new opportunity and delete old data", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_community_opportunity_record.json")
        .save(
          arrayToJsonLines([
            // New opportunity
            {
              OpportunityName: "new-opportunity-name",
              Description: "new-opportunity-description",
              ProviderName: "provider-name",
              CleanedProviderPhoneNumber: "9256400137",
              ProviderWebsite: "fake.com",
              ProviderAddress: "123 Main Street",
              CapacityTotal: 10,
              CapacityAvailable: 5,
              eighteenOrOlderCriterion: false,
              developmentalDisabilityDiagnosisCriterion: false,
              minorCriterion: false,
              noCurrentOrPriorSexOffenseCriterion: false,
              noCurrentOrPriorViolentOffenseCriterion: false,
              noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
              entryOfGuiltyPleaCriterion: false,
              veteranStatusCriterion: false,
            },
          ]),
        );

      const response = await callHandleImportOpportunityData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new opportunity was created
      const dbOpportunities = await prismaClient.opportunity.findMany({});

      // There should only be one opportunity in the database - the new one should have been created
      // and the old one should have been deleted
      expect(dbOpportunities).toHaveLength(1);

      const newOpportunity = dbOpportunities[0];
      expect(newOpportunity).toEqual(
        expect.objectContaining({
          opportunityName: "new-opportunity-name",
          description: "new-opportunity-description",
        }),
      );
    });

    test("should upsert existing opportunity", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_community_opportunity_record.json")
        .save(
          arrayToJsonLines([
            // existing opportunity
            {
              OpportunityName: fakeOpportunity.opportunityName,
              Description: fakeOpportunity.description,
              ProviderName: "provider-name",
              CleanedProviderPhoneNumber: fakeOpportunity.providerPhoneNumber,
              ProviderWebsite: "fake.com",
              ProviderAddress: "123 Main Street",
              CapacityTotal: 10,
              CapacityAvailable: 5,
              eighteenOrOlderCriterion: false,
              developmentalDisabilityDiagnosisCriterion: false,
              minorCriterion: false,
              noCurrentOrPriorSexOffenseCriterion: false,
              noCurrentOrPriorViolentOffenseCriterion: false,
              noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
              entryOfGuiltyPleaCriterion: false,
              veteranStatusCriterion: false,
            },
            // New opportunity
            {
              OpportunityName: "new-opportunity-name",
              Description: "new-opportunity-description",
              ProviderName: "provider-name",
              CleanedProviderPhoneNumber: "1234567890",
              ProviderWebsite: "fake.com",
              ProviderAddress: "123 Main Street",
              CapacityTotal: 10,
              CapacityAvailable: 5,
              eighteenOrOlderCriterion: false,
              developmentalDisabilityDiagnosisCriterion: false,
              minorCriterion: false,
              noCurrentOrPriorSexOffenseCriterion: false,
              noCurrentOrPriorViolentOffenseCriterion: false,
              noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
              entryOfGuiltyPleaCriterion: false,
              veteranStatusCriterion: false,
            },
          ]),
        );

      const response = await callHandleImportOpportunityData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new opportunity was created
      const dbOpportunities = await prismaClient.opportunity.findMany({});

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
      // Create two new opportunities, one with the same name but with the provider phone number changed, and another one with vice versa
      // These two should be deleted after import since they don't match the composite id of the existing opportunity
      await prismaClient.opportunity.createMany({
        data: [
          {
            opportunityName: fakeOpportunity.opportunityName,
            description: "new-opportunity-description-1",
            providerName: "new-provider-name-1",
            providerPhoneNumber: "1234567890",
            providerWebsite: faker.internet.url(),
            providerAddress: faker.location.streetAddress(),
            totalCapacity: faker.number.int({ max: 100 }),
            availableCapacity: faker.number.int({ max: 100 }),
            eighteenOrOlderCriterion: false,
            developmentalDisabilityDiagnosisCriterion: false,
            minorCriterion: false,
            noCurrentOrPriorSexOffenseCriterion: false,
            noCurrentOrPriorViolentOffenseCriterion: false,
            noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
            entryOfGuiltyPleaCriterion: false,
            veteranStatusCriterion: false,
          },
          {
            opportunityName: "new-opportunity-name",
            description: "new-opportunity-description-2",
            providerName: "new-provider-name-2",
            providerPhoneNumber: fakeOpportunity.providerPhoneNumber,
            providerWebsite: faker.internet.url(),
            providerAddress: faker.location.streetAddress(),
            totalCapacity: faker.number.int({ max: 100 }),
            availableCapacity: faker.number.int({ max: 100 }),
            eighteenOrOlderCriterion: false,
            developmentalDisabilityDiagnosisCriterion: false,
            minorCriterion: false,
            noCurrentOrPriorSexOffenseCriterion: false,
            noCurrentOrPriorViolentOffenseCriterion: false,
            noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
            entryOfGuiltyPleaCriterion: false,
            veteranStatusCriterion: false,
          },
        ],
      });

      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_community_opportunity_record.json")
        .save(
          arrayToJsonLines([
            // original existing opportunity
            {
              OpportunityName: fakeOpportunity.opportunityName,
              Description: fakeOpportunity.description,
              ProviderName: "provider-name",
              CleanedProviderPhoneNumber: fakeOpportunity.providerPhoneNumber,
              ProviderWebsite: "fake.com",
              ProviderAddress: "123 Main Street",
              CapacityTotal: 10,
              CapacityAvailable: 5,
              eighteenOrOlderCriterion: false,
              developmentalDisabilityDiagnosisCriterion: false,
              minorCriterion: false,
              noCurrentOrPriorSexOffenseCriterion: false,
              noCurrentOrPriorViolentOffenseCriterion: false,
              noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
              entryOfGuiltyPleaCriterion: false,
              veteranStatusCriterion: false,
            },
          ]),
        );

      const response = await callHandleImportOpportunityData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new opportunity was created
      const dbOpportunities = await prismaClient.opportunity.findMany({});

      // There should only be one opportunity in the database - the new one should have been created
      // and the old one should have been deleted
      expect(dbOpportunities).toHaveLength(1);

      const newOpportunity = dbOpportunities[0];
      expect(newOpportunity).toEqual(
        expect.objectContaining({
          opportunityName: "opportunity-name",
          providerPhoneNumber: fakeOpportunity.providerPhoneNumber,
        }),
      );
    });
  });

  describe("import insight data", () => {
    test("should import new insights and delete old data", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/case_insights_record.json")
        .save(
          arrayToJsonLines([
            // New insight
            {
              state_code: StateCode.US_ID,
              // We use MALE because the existing insight uses FEMALE, so there is no chance of a collision
              gender: "MALE",
              assessment_score_bucket_start: faker.number.int({ max: 100 }),
              assessment_score_bucket_end: faker.number.int({ max: 100 }),
              most_severe_description: fakeOffense.name,
              recidivism_rollup: faker.string.alpha(),
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
          ]),
        );

      const response = await callHandleImportInsightData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new Insight was created
      const dbInsights = await prismaClient.insight.findMany({
        include: {
          recidivismSeries: {
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
          recidivismSeries: expect.arrayContaining([
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
          dispositionData: expect.arrayContaining([
            // There should be one of each type of disposition
            expect.objectContaining({ recommendationType: "Probation" }),
            expect.objectContaining({ recommendationType: "Rider" }),
            expect.objectContaining({ recommendationType: "Term" }),
          ]),
        }),
      );
    });
  });

  describe("import offense data", () => {
    test("should import new offenses", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_charge_record.json")
        .save(
          arrayToJsonLines([
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
          ]),
        );

      const response = await callHandleImportOffenseData(testServer);

      expect(response.statusCode).toBe(200);

      // Check that the new offense was created
      const dbOffenses = await prismaClient.offense.findMany();

      // There should only be two offenses in the database - the old one should have been preserved and the new one created
      expect(dbOffenses).toHaveLength(2);

      expect(dbOffenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: fakeOffense.name }),
          expect.objectContaining({ name: "new-offense" }),
        ]),
      );
    });

    test("should capture exception if existing offense is missing", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("US_ID/sentencing_charge_record.json")
        .save(
          // Data with old offense missing
          arrayToJsonLines([
            // New offense
            {
              state_code: StateCode.US_ID,
              charge: "new-offense",
            },
          ]),
        );

      const response = await callHandleImportOffenseData(testServer);

      expect(response.statusCode).toBe(200);

      const sentryReport = await testAndGetSentryReport();
      expect(sentryReport.error?.message).toBe(
        "Error when importing offenses! These offenses exist in the database but are missing from the data import: offense-name",
      );
    });
  });
});
