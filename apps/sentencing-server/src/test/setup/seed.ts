import { faker } from "@faker-js/faker";
import {
  Case,
  CaseStatus,
  Charge,
  Client,
  Plea,
  Staff,
  StateCode,
  SubstanceUseDiagnosis,
  VeteranStatus,
} from "@prisma/client";

import { prismaClient } from "~sentencing-server/prisma";

export const fakeStaff: Staff = {
  externalId: "staff-ext-1",
  pseudonymizedId: "staff-pid-1",
  fullName: faker.person.fullName(),
  email: faker.internet.email(),
  stateCode: StateCode.ID,
  hasLoggedIn: faker.datatype.boolean(),
};

export const fakeClient: Client = {
  externalId: "client-ext-1",
  pseudonymizedId: "client-pid-1",
  fullName: faker.person.fullName(),
  stateCode: StateCode.ID,
  gender: faker.person.gender(),
  county: faker.location.county(),
  birthDate: faker.date.birthdate(),
};

export const fakeCase: Omit<Case, "staffId" | "clientId"> = {
  externalId: "case-ext-1",
  id: "case-1",
  stateCode: StateCode.ID,
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
};

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
