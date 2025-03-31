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
import {
  AsamLevelOfCareRecommendationCriterion,
  DiagnosedMentalHealthDiagnosisCriterion,
  Gender,
  PriorCriminalHistoryCriterion,
} from "@prisma/sentencing-server/client";
import { describe, expect, test } from "vitest";

import { OPPORTUNITIES_FILE_NAME } from "~@sentencing/import/constants";
import { getImportHandler } from "~@sentencing/import/handler";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import {
  TEST_OPPORTUNITIES_FILE_NAME,
  TEST_STATE_CODE,
} from "~@sentencing/import/test/setup/constants";
import { fakeOpportunity } from "~@sentencing/import/test/setup/seed";
import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~@sentencing-server/prisma";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

const lastUpdatedDate = new Date(1, 1, 1);

let importHandler: ReturnType<typeof getImportHandler>;

describe("import opportunity data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should import new opportunity and delete old data", async () => {
    dataProviderSingleton.setData(TEST_OPPORTUNITIES_FILE_NAME, [
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
        counties: ["county1", "county2"],
        status: "Active",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [OPPORTUNITIES_FILE_NAME]);

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
        counties: ["county1", "county2"],
        active: true,
      }),
    );
  });

  test("should upsert existing opportunity", async () => {
    dataProviderSingleton.setData(TEST_OPPORTUNITIES_FILE_NAME, [
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
        counties: ["county1", "county2"],
        status: "Active",
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
        counties: ["county1", "county2"],
        status: "Active",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [OPPORTUNITIES_FILE_NAME]);

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
          counties: ["county1", "county2"],
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
          counties: ["county1", "county2"],
        },
      ],
    });

    dataProviderSingleton.setData(TEST_OPPORTUNITIES_FILE_NAME, [
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
        counties: ["county1", "county2"],
        status: "Active",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [OPPORTUNITIES_FILE_NAME]);

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
