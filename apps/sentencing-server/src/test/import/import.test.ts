import { faker } from "@faker-js/faker";
import { StateCode } from "@prisma/client";
import { MockStorage } from "mock-gcs";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { prismaClient } from "~sentencing-server/prisma";
import { casePayloadMessage } from "~sentencing-server/test/import/constants";
import {
  arrayToJsonLines,
  callImportCaseData,
  callImportClientData,
  callImportOpportunityData,
  callImportStaffData,
} from "~sentencing-server/test/import/utils";
import { testServer } from "~sentencing-server/test/setup";
import {
  fakeCase,
  fakeClient,
  fakeOpportunity,
  fakeStaff,
} from "~sentencing-server/test/setup/seed";

const TEST_BUCKET_ID = "bucket-id";

const mockStorageSingleton = new MockStorage();
let getPayloadImp = vi.fn().mockReturnValue({
  email_verified: true,
  email: "test-csn@fake.com",
});

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
    email: "test-csn@fake.com",
  });
});

describe("import", () => {
  describe("auth", () => {
    test("should throw error if there is no token", async () => {
      const response = await testServer.inject({
        method: "POST",
        url: "/trigger_import",
        payload: { message: casePayloadMessage },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    });

    test("should throw error if there is no payload", async () => {
      getPayloadImp = vi.fn().mockReturnValue(undefined);

      const response = await testServer.inject({
        method: "POST",
        url: "/trigger_import",
        payload: { message: casePayloadMessage },
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    });

    test("should throw error if email is not verified", async () => {
      getPayloadImp = vi.fn().mockReturnValue({
        email_verified: false,
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/trigger_import",
        payload: { message: casePayloadMessage },
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    });

    test("should throw error if there is no email", async () => {
      getPayloadImp = vi.fn().mockReturnValue({
        email_verified: true,
        email: undefined,
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/trigger_import",
        payload: { message: casePayloadMessage },
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    });

    test("should throw error if email doesn't match expected", async () => {
      getPayloadImp = vi.fn().mockReturnValue({
        email_verified: true,
        email: "not-the-right-email@gmail.com",
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/trigger_import",
        payload: { message: casePayloadMessage },
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    });

    test("should work if email is correct", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("ID/sentencing_case_record.json")
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
              county_name: faker.location.county(),
              lsir_score: faker.number.int({ max: 100 }).toString(),
              lsir_level: faker.number.int().toString(),
              report_type: faker.string.alpha(),
            },
          ]),
        );

      getPayloadImp = vi.fn().mockReturnValue({
        email_verified: true,
        email: "test-csn@fake.com",
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/trigger_import",
        payload: { message: casePayloadMessage },
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

  describe("import case data", () => {
    test("should import new case data and delete old data", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("ID/sentencing_case_record.json")
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
              county_name: faker.location.county(),
              lsir_score: faker.number.int({ max: 100 }).toString(),
              lsir_level: faker.number.int().toString(),
              report_type: faker.string.alpha(),
            },
          ]),
        );

      const response = await callImportCaseData(testServer);

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
        .file("ID/sentencing_case_record.json")
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
              county_name: faker.location.county(),
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
              county_name: faker.location.county(),
              lsir_score: faker.number.int({ max: 100 }).toString(),
              lsir_level: faker.number.int().toString(),
              report_type: faker.string.alpha(),
            },
          ]),
        );

      const response = await callImportCaseData(testServer);

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

    test("should allow new cases to be uploaded even if their staff or client doesn't exist yet", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("ID/sentencing_case_record.json")
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
              county_name: faker.location.county(),
              lsir_score: faker.number.int({ max: 100 }).toString(),
              lsir_level: faker.number.int().toString(),
              report_type: faker.string.alpha(),
            },
          ]),
        );

      const response = await callImportCaseData(testServer);

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
  });

  describe("import client data", () => {
    test("should import new client data and delete old data", async () => {
      await mockStorageSingleton
        .bucket(TEST_BUCKET_ID)
        .file("ID/sentencing_client_record.json")
        .save(
          arrayToJsonLines([
            // New client
            {
              external_id: "new-client-ext-id",
              pseudonymized_id: "new-client-pid",
              caseIds: JSON.stringify(["new-case-ext-id"]),
              state_code: StateCode.US_ID,
              full_name: JSON.stringify({
                given_names: "Given",
                middle_names: "Middle",
                surname: "Last",
                name_suffix: "Sr.",
              }),
              gender: faker.person.gender(),
              county: faker.location.county(),
              birth_date: faker.date.birthdate(),
            },
          ]),
        );

      // Create a new case to link to the new client
      await prismaClient.case.create({
        data: { ...fakeCase, externalId: "new-case-ext-id", id: "new-case-id" },
      });

      const response = await callImportClientData(testServer);

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
        .file("ID/sentencing_client_record.json")
        .save(
          arrayToJsonLines([
            // New client
            {
              external_id: "new-client-ext-id",
              pseudonymized_id: "new-client-pid",
              caseIds: JSON.stringify([]),
              state_code: StateCode.US_ID,
              full_name: JSON.stringify({
                given_names: faker.person.firstName(),
                middle_names: faker.person.firstName(),
                surname: faker.person.lastName(),
                name_suffix: faker.person.suffix(),
              }),
              gender: faker.person.gender(),
              county: faker.location.county(),
              birth_date: faker.date.birthdate(),
            },
            // existing client
            {
              external_id: fakeClient.externalId,
              pseudonymized_id: fakeClient.pseudonymizedId,
              caseIds: JSON.stringify([fakeCase.externalId]),
              state_code: StateCode.US_ID,
              full_name: JSON.stringify({
                given_names: faker.person.firstName(),
                middle_names: faker.person.firstName(),
                surname: faker.person.lastName(),
                name_suffix: faker.person.suffix(),
              }),
              gender: faker.person.gender(),
              // Set a new county
              county: "my fake county",
              birth_date: faker.date.birthdate(),
            },
          ]),
        );

      const response = await callImportClientData(testServer);

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
        .file("ID/sentencing_staff_record.json")
        .save(
          arrayToJsonLines([
            // New staff
            {
              external_id: "new-staff-ext-id",
              pseudonymized_id: "new-staff-pid",
              caseIds: JSON.stringify(["new-case-ext-id"]),
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
        data: { ...fakeCase, externalId: "new-case-ext-id", id: "new-case-id" },
      });

      const response = await callImportStaffData(testServer);

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
        .file("ID/sentencing_staff_record.json")
        .save(
          arrayToJsonLines([
            // new staff
            {
              external_id: "new-staff-ext-id",
              pseudonymized_id: "new-staff-pid",
              caseIds: JSON.stringify(["new-case-ext-id"]),
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
              caseIds: JSON.stringify([fakeCase.externalId]),
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

      const response = await callImportStaffData(testServer);

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
        .file("ID/sentencing_community_opportunity_record.json")
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

      const response = await callImportOpportunityData(testServer);

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
        .file("ID/sentencing_community_opportunity_record.json")
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

      const response = await callImportOpportunityData(testServer);

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
        .file("ID/sentencing_community_opportunity_record.json")
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

      const response = await callImportOpportunityData(testServer);

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
});
