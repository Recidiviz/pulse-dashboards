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
  CaseStatus,
  DiagnosedSubstanceUseDisorderCriterion,
  Gender,
  Plea,
  PriorCriminalHistoryCriterion,
  Prisma,
  PrismaClient,
  ReportType,
  StateCode,
  SubstanceUseDiagnosis,
} from "@prisma/sentencing-server/client";

const prisma = new PrismaClient();

async function main() {
  // Staff
  await prisma.case.deleteMany({});
  await prisma.opportunity.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.client.deleteMany({});

  const numberOfStaff = 10;

  const staff: Prisma.StaffCreateInput[] = [];

  for (let i = 0; i < numberOfStaff; i++) {
    staff.push({
      externalId: faker.string.uuid(),
      pseudonymizedId: faker.string.uuid(),
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      stateCode: StateCode.US_ID,
      hasLoggedIn: faker.datatype.boolean(),
    });
  }

  await prisma.staff.createMany({ data: staff });

  // Clients
  const numberOfClients = 10;

  const clients: Prisma.ClientCreateInput[] = [];

  for (let i = 0; i < numberOfClients; i++) {
    clients.push({
      externalId: faker.string.uuid(),
      pseudonymizedId: faker.string.uuid(),
      fullName: faker.person.fullName(),
      stateCode: StateCode.US_ID,
      gender: faker.helpers.enumValue(Gender),
      county: faker.location.county(),
      birthDate: faker.date.birthdate(),
    });
  }

  await prisma.client.createMany({ data: clients });

  // Cases
  const numberOfCases = 10;

  for (let i = 0; i < numberOfCases; i++) {
    // eslint-disable-next-line no-await-in-loop -- this is a seed script
    await prisma.case.create({
      data: {
        externalId: faker.string.uuid(),
        client: {
          connect: {
            externalId:
              clients[faker.number.int({ max: clients.length - 1 })].externalId,
          },
        },
        staff: {
          connect: {
            externalId:
              staff[faker.number.int({ max: staff.length - 1 })].externalId,
          },
        },
        stateCode: StateCode.US_ID,
        dueDate: faker.date.future(),
        county: faker.location.county(),
        lsirScore: faker.number.int(100),
        lsirLevel: faker.number.int().toString(),
        reportType: faker.helpers.enumValue(ReportType),
        offense: {
          create: {
            stateCode: StateCode.US_ID,
            name: faker.string.alpha({ length: { min: 5, max: 100 } }),
            frequency: faker.number.int(100),
          },
        },
        isCurrentOffenseViolent: faker.datatype.boolean(),
        isCurrentOffenseSexual: faker.datatype.boolean(),
        isVeteran: faker.datatype.boolean(),
        previouslyIncarceratedOrUnderSupervision: faker.datatype.boolean(),
        hasPreviousFelonyConviction: faker.datatype.boolean(),
        hasPreviousViolentOffenseConviction: faker.datatype.boolean(),
        hasPreviousSexOffenseConviction: faker.datatype.boolean(),
        previousTreatmentCourt: null,
        substanceUseDisorderDiagnosis: faker.helpers.enumValue(
          SubstanceUseDiagnosis,
        ),
        hasOpenChildProtectiveServicesCase: faker.datatype.boolean(),
        hasDevelopmentalDisability: faker.datatype.boolean(),
        plea: faker.helpers.enumValue(Plea),
        status: faker.helpers.enumValue(CaseStatus),
      },
    });
  }

  // Opportunities
  const numberOfOpportunities = 10;

  const opportunities: Prisma.OpportunityCreateInput[] = [];

  for (let i = 0; i < numberOfOpportunities; i++) {
    opportunities.push({
      opportunityName: faker.company.name(),
      description: faker.commerce.productDescription(),
      providerName: faker.company.name(),
      providerPhoneNumber: faker.phone.number(),
      providerWebsite: faker.internet.url(),
      providerAddress: faker.location.streetAddress(),
      minAge: faker.number.int({ max: 50 }),
      maxAge: faker.number.int({ min: 50, max: 100 }),
      developmentalDisabilityDiagnosisCriterion: faker.datatype.boolean(),
      noCurrentOrPriorSexOffenseCriterion: faker.datatype.boolean(),
      noCurrentOrPriorViolentOffenseCriterion: faker.datatype.boolean(),
      noPendingFelonyChargesInAnotherCountyOrStateCriterion:
        faker.datatype.boolean(),
      entryOfGuiltyPleaCriterion: faker.datatype.boolean(),
      veteranStatusCriterion: faker.datatype.boolean(),
      priorCriminalHistoryCriterion: faker.helpers.enumValue(
        PriorCriminalHistoryCriterion,
      ),
      asamLevelOfCareRecommendationCriterion: faker.helpers.enumValue(
        AsamLevelOfCareRecommendationCriterion,
      ),
      diagnosedSubstanceUseDisorderCriterion: faker.helpers.enumValue(
        DiagnosedSubstanceUseDisorderCriterion,
      ),
      lastUpdatedAt: faker.date.recent(),
    });
  }

  await prisma.opportunity.createMany({ data: opportunities });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
