import { faker } from "@faker-js/faker";
import {
  Charge,
  Client,
  Plea,
  PrismaClient,
  Staff,
  StateCode,
  SubstanceUseDiagnosis,
  VeteranStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Staff
  await prisma.case.deleteMany({}); // use with caution.
  await prisma.staff.deleteMany({}); // use with caution.
  await prisma.client.deleteMany({}); // use with caution.

  const numberOfStaff = 10;

  const staff: Staff[] = [];

  for (let i = 0; i < numberOfStaff; i++) {
    staff.push({
      id: faker.string.uuid(),
      givenNames: faker.person.firstName(),
      surname: faker.person.lastName(),
      email: faker.internet.email(),
      externalId: faker.string.uuid(),
      middleNames: null,
      nameSuffix: null,
      stateCode: StateCode.ID,
    });
  }

  await prisma.staff.createMany({ data: staff });

  // Clients
  const numberOfClients = 10;

  const clients: Client[] = [];

  for (let i = 0; i < numberOfClients; i++) {
    clients.push({
      id: faker.string.uuid(),
      givenNames: faker.person.firstName(),
      surname: faker.person.lastName(),
      externalId: faker.string.uuid(),
      middleNames: null,
      nameSuffix: null,
      stateCode: StateCode.ID,
      gender: faker.person.gender(),
      county: faker.location.county(),
      birthDate: faker.date.birthdate(),
    });
  }

  await prisma.client.createMany({ data: clients });

  // Cases
  const numberOfCases = 10;

  for (let i = 0; i < numberOfCases; i++) {
    await prisma.case.create({
      data: {
        externalId: faker.string.uuid(),
        Client: {
          connect: {
            id: clients[faker.number.int({ max: clients.length - 1 })].id,
          },
        },
        Staff: {
          connect: {
            id: staff[faker.number.int({ max: staff.length - 1 })].id,
          },
        },
        stateCode: StateCode.ID,
        dueDate: faker.date.future(),
        completionDate: faker.date.future(),
        sentenceDate: faker.date.past(),
        assignedDate: faker.date.past(),
        county: faker.location.county(),
        lsirScore: faker.number.int().toString(),
        lsirLevel: faker.number.int().toString(),
        reportType: faker.string.alpha(),
        primaryCharge: faker.helpers.enumValue(Charge),
        secondaryCharges: [],
        veteranStatus: faker.helpers.enumValue(VeteranStatus),
        previouslyIncarcerated: faker.datatype.boolean(),
        previouslyUnderSupervision: faker.datatype.boolean(),
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
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
