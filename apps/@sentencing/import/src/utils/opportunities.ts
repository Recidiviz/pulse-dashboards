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

import { PrismaClient } from "@prisma/sentencing-server/client";
import _ from "lodash";
import { z } from "zod";

import { opportunityImportSchema } from "~@sentencing/import/models";

export async function transformAndLoadOpportunityData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof opportunityImportSchema>>,
) {
  const newOpportunities = [];

  // Load new opportunity data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const opportunityData of data) {
    // If the status is explicitly inactive, set it to inactive, otherwise set it true
    const active = opportunityData.status === "Inactive" ? false : true;

    const newOpportunity = {
      ..._.pick(opportunityData, [
        "developmentalDisabilityDiagnosisCriterion",
        "noCurrentOrPriorSexOffenseCriterion",
        "noCurrentOrPriorViolentOffenseCriterion",
        "noPendingFelonyChargesInAnotherCountyOrStateCriterion",
        "entryOfGuiltyPleaCriterion",
        "veteranStatusCriterion",
        "priorCriminalHistoryCriterion",
        "diagnosedMentalHealthDiagnosisCriterion",
        "asamLevelOfCareRecommendationCriterion",
        "diagnosedSubstanceUseDisorderCriterion",
        "minLsirScoreCriterion",
        "maxLsirScoreCriterion",
        "minAge",
        "maxAge",
        "district",
        "additionalNotes",
        "genericDescription",
        "counties",
      ]),
      opportunityName: opportunityData.OpportunityName,
      description: opportunityData.Description,
      // We need to use the default provider name if the provider name is empty because prisma
      // doesn't allow for nulls in composite unique fields
      providerName: opportunityData.ProviderName,
      providerPhoneNumber: opportunityData.CleanedProviderPhoneNumber,
      providerWebsite: opportunityData.ProviderWebsite,
      providerAddress: opportunityData.ProviderAddress,
      needsAddressed: opportunityData.NeedsAddressed,
      genders: opportunityData.genders ?? [],
      lastUpdatedAt: opportunityData.lastUpdatedDate,
      active,
    };

    // Load data
    const newCreatedOpportunity = await prismaClient.opportunity.upsert({
      where: {
        opportunityName_providerName: {
          opportunityName: newOpportunity.opportunityName,
          providerName: newOpportunity.providerName,
        },
      },
      create: newOpportunity,
      update: newOpportunity,
    });

    newOpportunities.push(newCreatedOpportunity);
  }

  // Delete all of the old opportunities that weren't just loaded if we haven't hit any errors
  await prismaClient.opportunity.deleteMany({
    where: {
      NOT: {
        id: {
          in: newOpportunities.map((opportunity) => opportunity.id),
        },
      },
    },
  });
}
