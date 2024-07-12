import { faker } from "@faker-js/faker";
import {
  CaseStatus,
  Charge,
  Plea,
  Prisma,
  PrismaClient,
  StateCode,
  SubstanceUseDiagnosis,
} from "@prisma/client";

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
            externalId:
              clients[faker.number.int({ max: clients.length - 1 })].externalId,
          },
        },
        Staff: {
          connect: {
            externalId:
              staff[faker.number.int({ max: staff.length - 1 })].externalId,
          },
        },
        stateCode: StateCode.US_ID,
        dueDate: faker.date.future(),
        completionDate: faker.date.future(),
        sentenceDate: faker.date.past(),
        assignedDate: faker.date.past(),
        county: faker.location.county(),
        lsirScore: faker.number.int(100),
        lsirLevel: faker.number.int().toString(),
        reportType: faker.string.alpha(),
        primaryCharge: faker.helpers.enumValue(Charge),
        secondaryCharges: [],
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
      totalCapacity: faker.number.int({ max: 100 }),
      availableCapacity: faker.number.int({ max: 100 }),
      eighteenOrOlderCriterion: faker.datatype.boolean(),
      developmentalDisabilityDiagnosisCriterion: faker.datatype.boolean(),
      minorCriterion: faker.datatype.boolean(),
      noCurrentOrPriorSexOffenseCriterion: faker.datatype.boolean(),
      noCurrentOrPriorViolentOffenseCriterion: faker.datatype.boolean(),
      noPendingFelonyChargesInAnotherCountyOrStateCriterion:
        faker.datatype.boolean(),
      entryOfGuiltyPleaCriterion: faker.datatype.boolean(),
      veteranStatusCriterion: faker.datatype.boolean(),
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
