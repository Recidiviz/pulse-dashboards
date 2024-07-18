import { faker } from "@faker-js/faker";
import {
  CaseRecommendation,
  CaseStatus,
  Charge,
  Gender,
  Plea,
  StateCode,
  SubstanceUseDiagnosis,
} from "@prisma/client";

import { prismaClient } from "~sentencing-server/prisma";
import {
  CaseCreateInput,
  ClientCreateInput,
  DispositionCreateManyInsightInput,
  InsightCreateInput,
  OpportunityCreateInput,
  RecidivismSeriesCreateWithoutInsightInput,
  StaffCreateInput,
} from "~sentencing-server/test/setup/types";
import { createFakeRecidivismSeriesForPrisma } from "~sentencing-server/test/setup/utils";

const FAKE_INSIGHT_ASSESMENT_SCORE_BUCKET_START = 0;
const FAKE_INSIGHT_ASSESMENT_SCORE_BUCKET_END = 20;
// Make sure fake case LSIR score falls within the range of the fake insight
const FAKE_CASE_LSIR_SCORE = 10;
const FAKE_CASE_PRIMARY_CHARGE = Charge.Felony;
const FAKE_CLIENT_GENDER = Gender.FEMALE;

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
  reportType: faker.string.alpha(),
  primaryCharge: FAKE_CASE_PRIMARY_CHARGE,
  secondaryCharges: [],
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
  currentOnboardingTopic: "OffenseLsirScore",
} satisfies CaseCreateInput;

export const fakeOpportunity = {
  opportunityName: "opportunity-name",
  description: "opportunity-description",
  providerName: "provider-name",
  providerPhoneNumber: faker.phone.number(),
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
} satisfies OpportunityCreateInput;

export const fakeRecidivismSeries =
  createFakeRecidivismSeriesForPrisma() satisfies RecidivismSeriesCreateWithoutInsightInput[];

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
  offense: FAKE_CASE_PRIMARY_CHARGE,
  recidivismRollupOffense: faker.string.alpha(),
  recidivismNumRecords: faker.number.int({ max: 100 }),
  recidivismSeries: {
    // Can't use createMany because of nested writes
    create: fakeRecidivismSeries,
  },
  dispositionNumRecords: faker.number.int({ max: 100 }),
  dispositionData: {
    createMany: {
      data: fakeDispositions,
    },
  },
} satisfies InsightCreateInput;

export async function seed() {
  // Seed Data
  await prismaClient.staff.create({ data: fakeStaff });
  await prismaClient.client.create({ data: fakeClient });
  await prismaClient.opportunity.create({ data: fakeOpportunity });
  await prismaClient.case.create({
    data: {
      ...fakeCase,
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
  await prismaClient.insight.create({ data: fakeInsight });
}
