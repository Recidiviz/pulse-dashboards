import { faker } from "@faker-js/faker";
import {
  CaseRecommendation,
  CaseStatus,
  Charge,
  Plea,
  StateCode,
  SubstanceUseDiagnosis,
  VeteranStatus,
} from "@prisma/client";

import { prismaClient } from "~sentencing-server/prisma";
import {
  CaseCreateInput,
  ClientCreateInput,
  StaffCreateInput,
} from "~sentencing-server/test/setup/types";

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
  gender: faker.person.gender(),
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
  lsirScore: faker.number.int({ max: 100 }),
  lsirLevel: faker.number.int().toString(),
  reportType: faker.string.alpha(),
  primaryCharge: faker.helpers.enumValue(Charge),
  secondaryCharges: [],
  veteranStatus: faker.helpers.enumValue(VeteranStatus),
  previouslyIncarceratedOrUnderSupervision: faker.datatype.boolean(),
  hasPreviousFelonyConviction: faker.datatype.boolean(),
  hasPreviousViolentOffenseConviction: faker.datatype.boolean(),
  hasPreviousSexOffenseConviction: faker.datatype.boolean(),
  previousTreatmentCourt: null,
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
} satisfies CaseCreateInput;

export async function seed() {
  console.log("Seeding database");

  // Staff
  await prismaClient.case.deleteMany({});
  await prismaClient.staff.deleteMany({});
  await prismaClient.client.deleteMany({});

  // Seed Data
  await prismaClient.staff.create({ data: fakeStaff });
  await prismaClient.client.create({ data: fakeClient });
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
}
