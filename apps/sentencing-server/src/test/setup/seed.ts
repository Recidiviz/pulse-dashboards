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
  CaseRecommendation,
  CaseStatus,
  Gender,
  OnboardingTopic,
  Plea,
  ReportType,
  StateCode,
  SubstanceUseDiagnosis,
} from "@prisma/client";

import { prismaClient } from "~sentencing-server/prisma";
import {
  CaseCreateInput,
  ClientCreateInput,
  DispositionCreateManyInsightInput,
  InsightCreateInput,
  OffenseCreateInput,
  OpportunityCreateInput,
  StaffCreateInput,
} from "~sentencing-server/test/setup/types";
import { createFakeRecidivismSeries } from "~sentencing-server/test/setup/utils";

const FAKE_INSIGHT_ASSESMENT_SCORE_BUCKET_START = 0;
const FAKE_INSIGHT_ASSESMENT_SCORE_BUCKET_END = 20;
// Make sure fake case LSIR score falls within the range of the fake insight
const FAKE_CASE_LSIR_SCORE = 10;
const FAKE_CLIENT_GENDER = Gender.FEMALE;

export const fakeOffense = {
  stateCode: StateCode.US_ID,
  name: "offense-name",
} satisfies OffenseCreateInput;

export const fakeStaff = {
  externalId: "staff-ext-1",
  pseudonymizedId: "staff-pid-1",
  fullName: faker.person.fullName(),
  email: faker.internet.email(),
  stateCode: StateCode.US_ID,
  hasLoggedIn: faker.datatype.boolean(),
} satisfies StaffCreateInput;

export const fakeClient = {
  externalId: "client-ext-1",
  pseudonymizedId: "client-pid-1",
  fullName: faker.person.fullName(),
  stateCode: StateCode.US_ID,
  gender: FAKE_CLIENT_GENDER,
  county: faker.location.county(),
  birthDate: faker.date.birthdate(),
} satisfies ClientCreateInput;

export const fakeOpportunity = {
  opportunityName: "opportunity-name",
  description: "opportunity-description",
  providerName: "provider-name",
  providerPhoneNumber: "800-212-3942",
  providerWebsite: faker.internet.url(),
  providerAddress: faker.location.streetAddress(),
  totalCapacity: faker.number.int({ max: 100 }),
  availableCapacity: faker.number.int({ max: 100 }),
  developmentalDisabilityDiagnosisCriterion: false,
  noCurrentOrPriorSexOffenseCriterion: false,
  noCurrentOrPriorViolentOffenseCriterion: false,
  noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
  entryOfGuiltyPleaCriterion: false,
  veteranStatusCriterion: false,
} satisfies OpportunityCreateInput;

export const fakeOpportunity2 = {
  opportunityName: "opportunity-name-2",
  description: "opportunity-description-2",
  providerName: "provider-name-2",
  providerPhoneNumber: "800-212-1111",
  providerWebsite: faker.internet.url(),
  providerAddress: faker.location.streetAddress(),
  totalCapacity: faker.number.int({ max: 100 }),
  availableCapacity: faker.number.int({ max: 100 }),
  developmentalDisabilityDiagnosisCriterion: false,
  noCurrentOrPriorSexOffenseCriterion: false,
  noCurrentOrPriorViolentOffenseCriterion: false,
  noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
  entryOfGuiltyPleaCriterion: false,
  veteranStatusCriterion: false,
} satisfies OpportunityCreateInput;

export const fakeCase = {
  externalId: "case-ext-1",
  id: "case-1",
  stateCode: StateCode.US_ID,
  dueDate: faker.date.future(),
  completionDate: faker.date.future(),
  sentenceDate: faker.date.past(),
  assignedDate: faker.date.past(),
  county: faker.location.county(),
  lsirScore: FAKE_CASE_LSIR_SCORE,
  lsirLevel: faker.number.int().toString(),
  reportType: ReportType.FullPSI,
  offense: fakeOffense.name,
  isVeteran: faker.datatype.boolean(),
  previouslyIncarceratedOrUnderSupervision: faker.datatype.boolean(),
  hasPreviousFelonyConviction: faker.datatype.boolean(),
  hasPreviousViolentOffenseConviction: faker.datatype.boolean(),
  hasPreviousSexOffenseConviction: faker.datatype.boolean(),
  previousTreatmentCourt: null,
  hasPreviousTreatmentCourt: null,
  substanceUseDisorderDiagnosis: faker.helpers.enumValue(SubstanceUseDiagnosis),
  hasOpenChildProtectiveServicesCase: faker.datatype.boolean(),
  hasDevelopmentalDisability: faker.datatype.boolean(),
  plea: faker.helpers.enumValue(Plea),
  asamCareRecommendation: null,
  mentalHealthDiagnoses: [],
  otherMentalHealthDiagnosis: null,
  needsToBeAddressed: [],
  otherNeedToBeAddressed: null,
  status: faker.helpers.enumValue(CaseStatus),
  selectedRecommendation: faker.helpers.enumValue(CaseRecommendation),
  isLsirScoreLocked: false,
  currentOnboardingTopic: faker.helpers.enumValue(OnboardingTopic),
  recommendedOpportunities: [
    {
      opportunityName: fakeOpportunity.opportunityName,
      providerName: fakeOpportunity.providerName,
    },
    {
      opportunityName: fakeOpportunity2.opportunityName,
      providerName: fakeOpportunity2.providerName,
    },
  ],
};

export const fakeCasePrismaInput = {
  ...fakeCase,
  recommendedOpportunities: {
    connect: fakeCase.recommendedOpportunities.map((opportunity) => ({
      opportunityName_providerName: opportunity,
    })),
  },
  offense: {
    connect: {
      name: fakeOffense.name,
    },
  },
} satisfies CaseCreateInput;

export const fakeRecidivismSeries = createFakeRecidivismSeries();

export const fakeDispositions = [
  {
    recommendationType: "Probation",
    percentage: faker.number.float(),
  },
  {
    recommendationType: "Rider",
    percentage: faker.number.float(),
  },
  {
    recommendationType: "Term",
    percentage: faker.number.float(),
  },
] satisfies DispositionCreateManyInsightInput[];

export const fakeInsight = {
  stateCode: StateCode.US_ID,
  gender: FAKE_CLIENT_GENDER,
  assessmentScoreBucketStart: FAKE_INSIGHT_ASSESMENT_SCORE_BUCKET_START,
  assessmentScoreBucketEnd: FAKE_INSIGHT_ASSESMENT_SCORE_BUCKET_END,
  offense: fakeOffense.name,
  rollupStateCode: StateCode.US_ID,
  rollupGender: FAKE_CLIENT_GENDER,
  rollupOffense: fakeOffense.name,
  rollupRecidivismNumRecords: faker.number.int({ max: 100 }),
  rollupRecidivismSeries: fakeRecidivismSeries,
  dispositionNumRecords: faker.number.int({ max: 100 }),
  dispositionData: fakeDispositions,
};

export const fakeInsightPrismaInput = {
  ...fakeInsight,
  offense: {
    connect: {
      stateCode: fakeOffense.stateCode,
      name: fakeInsight.offense,
    },
  },
  rollupOffense: {
    connect: {
      stateCode: fakeInsight.stateCode,
      name: fakeInsight.rollupOffense,
    },
  },
  rollupRecidivismSeries: {
    // Can't use createMany because of nested writes
    create: fakeRecidivismSeries.map((series) => ({
      recommendationType: series.recommendationType as CaseRecommendation,
      dataPoints: {
        createMany: {
          data: series.dataPoints,
        },
      },
    })),
  },
  dispositionData: {
    createMany: {
      data: fakeDispositions,
    },
  },
} satisfies InsightCreateInput;

export let fakeInsightId: string;

export async function seed() {
  // Seed Data
  await prismaClient.offense.create({ data: fakeOffense });
  await prismaClient.staff.create({ data: fakeStaff });
  await prismaClient.client.create({ data: fakeClient });
  await prismaClient.opportunity.createMany({
    data: [fakeOpportunity, fakeOpportunity2],
  });
  await prismaClient.case.create({
    data: {
      ...fakeCasePrismaInput,
      Client: {
        connect: {
          externalId: fakeClient.externalId,
        },
      },
      Staff: {
        connect: {
          externalId: fakeStaff.externalId,
        },
      },
    },
  });
  fakeInsightId = (
    await prismaClient.insight.create({
      data: fakeInsightPrismaInput,
    })
  ).id;
}
