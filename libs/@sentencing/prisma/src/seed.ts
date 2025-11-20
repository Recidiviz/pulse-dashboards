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

/* Disabling these rules for the entire file since this is a seed script*/
/* eslint-disable no-await-in-loop, no-restricted-imports */
import * as readline from "node:readline";

import { faker } from "@faker-js/faker";

import { getPrismaClientForStateCode } from "~@sentencing/prisma/utils";

import {
  AsamLevelOfCareRecommendationCriterion,
  CaseStatus,
  DiagnosedSubstanceUseDisorderCriterion,
  Division,
  FelonyClass,
  Gender,
  Plea,
  PriorCriminalHistoryCriterion,
  Prisma,
  ReportType,
  StateCode,
  SubstanceUseDiagnosis
} from "./client/client";
interface Auth0TokenResponse {
  access_token: string;
  scope: string;
  expires_in: number;
  token_type: string;
}
interface Auth0UserResponse {
  user_id: string;
  email: string;
  name: string;
  app_metadata: {
    pseudonymizedId: string;
  };
}
const AUTH0_DOMAIN = process.env["AUTH0_MANAGEMENT_API_DOMAIN"];

const prisma = getPrismaClientForStateCode();

import { stdin as input, stdout as output } from "node:process";

async function addLocalUserAsStaff(
  email: string,
  pseudonymizedId: string,
  fullName: string,
): Promise<Prisma.StaffCreateInput> {
  /* Create a staff user corresponding to the local dev user */
  return await prisma.staff.create({
    data: {
      externalId: pseudonymizedId,
      pseudonymizedId: pseudonymizedId,
      fullName: fullName,
      email: email,
      stateCode: StateCode.US_ID,
      hasLoggedIn: true,
    },
  });
}

async function addDistricts(): Promise<Prisma.DistrictCreateInput[]> {
  const districtsData: Prisma.DistrictCreateInput[] = [];
  // Create 5 unique district names
  for (let i = 1; i <= 5; i++) {
    districtsData.push({
      stateCode: StateCode.US_ID,
      name: `District ${i}`,
    });
  }

  await prisma.district.createMany({
    data: districtsData,
    skipDuplicates: true,
  });

  return await prisma.district.findMany({
    where: { name: { in: districtsData.map((d) => d.name) } },
  });
}

async function addCounties(
  districts: Prisma.DistrictCreateInput[],
): Promise<Map<string, string>> {
  /* Add 10 counties to the database and return a map of county name to county ID */
  const countyNames = Array.from({ length: 10 }, () => faker.location.county());
  const countyData = countyNames.map((countyName) => {
    const randomDistrict = faker.helpers.arrayElement(districts);
    return {
      name: countyName,
      stateCode: StateCode.US_ID,
      districtId: randomDistrict.id,
    };
  });

  await prisma.county.createMany({
    data: countyData,
    skipDuplicates: true,
  });

  const countyRows = await prisma.county.findMany({
    where: { name: { in: countyNames } },
    select: { id: true, name: true },
  });

  type CountyRow = { id: string; name: string };
  return new Map(countyRows.map((c: CountyRow) => [c.name, c.id]));
}

async function addPSIClientsAndCases(
  countyByName: Map<string, string>,
  staff: Prisma.StaffCreateInput,
  offenses: Prisma.OffenseCreateInput[],
) {
  /* Add and link 10 clients and PSI cases to local user */
  const clients: { externalId: string }[] = [];
  for (let i = 0; i < 10; i++) {
    const externalId = faker.string.uuid();
    const countyName = faker.helpers.arrayElement(
      Array.from(countyByName.keys()),
    );
    const countyId = countyByName.get(countyName);
    const gender = faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE]);
    const sex = gender === Gender.MALE ? "male" : "female";
    await prisma.client.create({
      data: {
        externalId,
        pseudonymizedId: faker.string.alphanumeric({ length: 15 }),
        fullName: faker.person.fullName({ sex: sex }),
        stateCode: StateCode.US_ID,
        gender: faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE]),
        birthDate: faker.date.birthdate(),
        county: { connect: { id: countyId } },
      },
      select: { externalId: true },
    });

    clients.push({ externalId });
  }

  // Cases
  for (let i = 0; i < 10; i++) {
    const clientId = clients[i].externalId;
    const countyName = faker.helpers.arrayElement(
      Array.from(countyByName.keys()),
    );
    const countyId = countyByName.get(countyName);
    const lsirScore = faker.number.int({ min: 0, max: 54 });
    await prisma.case.create({
      data: {
        externalId: faker.string.uuid(),
        client: {
          connect: {
            externalId: clientId,
          },
        },
        staff: {
          connect: {
            pseudonymizedId: staff.pseudonymizedId,
          },
        },
        offense: {
          connect: {
            name: faker.helpers.arrayElement(offenses).name,
          },
        },
        stateCode: StateCode.US_ID,
        dueDate: faker.date.future(),
        county: { connect: { id: countyId } },
        lsirScore: lsirScore,
        lsirLevel: lsirScore.toString(),
        reportType: faker.helpers.enumValue(ReportType),
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
        status: CaseStatus.NotYetStarted,
      },
    });
  }
}

async function addSARClientsAndReports(
  staff: Prisma.StaffCreateInput,
  offenses: Prisma.OffenseCreateInput[],
) {
  /* Add 5 SAR clients and reports with charges */
  const clients: { externalId: string }[] = [];

  // Create 5 clients for Missouri
  for (let i = 0; i < 5; i++) {
    const externalId = faker.string.uuid();
    const gender = faker.helpers.arrayElement([
      Gender.MALE,
      Gender.FEMALE,
      Gender.NON_BINARY,
    ]);
    const sex = gender === Gender.MALE ? "male" : "female";

    await prisma.client.create({
      data: {
        externalId,
        pseudonymizedId: faker.string.alphanumeric({ length: 15 }),
        fullName: faker.person.fullName({ sex }),
        stateCode: StateCode.US_MO,
        gender,
        birthDate: faker.date.birthdate(),
      },
      select: { externalId: true },
    });

    clients.push({ externalId });
  }

  // Create SAR reports for each client
  for (let i = 0; i < 5; i++) {
    const clientId = clients[i].externalId;

    // Create the SAR with minimal imported data
    const sar = await prisma.sentencingAssessmentReport.create({
      data: {
        externalId: faker.string.uuid(),
        client: {
          connect: { externalId: clientId },
        },
        staff: {
          connect: { pseudonymizedId: staff.pseudonymizedId },
        },
        status: faker.helpers.enumValue(CaseStatus),
        requestingJudgeName: faker.person.fullName(),
        dateRequested: faker.date.recent(),
        dateDueToCourt: faker.date.future(),
        dueDate: faker.date.future(),
        division: faker.helpers.enumValue(Division),
        address: faker.location.streetAddress(),
      },
    });

    // Add 1-3 charges per SAR with only imported fields: offense name, felony class, cause number
    const numCharges = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < numCharges; j++) {
      await prisma.charge.create({
        data: {
          sentencingAssessmentReport: {
            connect: { id: sar.id },
          },
          offense: {
            connect: { name: faker.helpers.arrayElement(offenses).name },
          },
          // Only imported fields - the rest will be filled in by users
          causeNum: `${faker.string.numeric(2)}-CR-${faker.string.numeric(5)}`,
          felonyClass: faker.helpers.enumValue(FelonyClass),
        },
      });
    }
  }
}

async function addOpportunities() {
  /* Add 10 Opportunities */
  const opportunities: Prisma.OpportunityCreateInput[] = [];

  for (let i = 0; i < 10; i++) {
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

async function addOffenses(): Promise<Prisma.OffenseCreateInput[]> {
  const offenseData: Prisma.OffenseCreateInput[] = [];

  // Create Offenses
  const offenseNames = [
    "ASSAULT",
    "BURGLARY",
    "ROBBERY",
    "THEFT",
    "FRAUD",
    "DRUG POSSESSION",
    "DUI",
    "HOMICIDE",
    "ARSON",
    "VANDALISM",
  ];
  for (let i = 0; i < offenseNames.length; i++) {
    offenseData.push({
      stateCode: StateCode.US_ID,
      name: offenseNames[i],
      frequency: faker.number.int(100),
      isViolentOffense: faker.datatype.boolean(),
      isSexOffense: faker.datatype.boolean(),
    });
  }

  await prisma.offense.createMany({
    data: offenseData,
    skipDuplicates: true,
  });

  const offenses = await prisma.offense.findMany();

  // Create Mandatory Minimums and Insights for each Offense
  for (const offense of offenses) {
    await prisma.mandatoryMinimum.create({
      data: {
        minimumSentenceLength: faker.number.int({ min: 1, max: 120 }),
        maximumSentenceLength: faker.number.int({ min: 121, max: 240 }),
        statuteLink: faker.internet.url(),
        statuteNumber: faker.string.alpha({ length: { min: 3, max: 10 } }),
        sentenceType: faker.lorem.word(),
        offenseId: offense.id,
      },
    });

    const bucketData = {
      assessmentScoreBucketStart: 0,
      assessmentScoreBucketEnd: 54,
      rollupStateCode: StateCode.US_ID,
      rollupRecidivismNumRecords: 0,
      dispositionNumRecords: 0,
    };

    // 1. Create Insight for MALE
    await prisma.insight.create({
      data: {
        stateCode: StateCode.US_ID,
        gender: Gender.MALE,
        offenseId: offense.id,
        ...bucketData,
      },
    });

    // 2. Create Insight for FEMALE
    await prisma.insight.create({
      data: {
        stateCode: StateCode.US_ID,
        gender: Gender.FEMALE,
        offenseId: offense.id,
        ...bucketData,
      },
    });
  }
  return offenses;
}

async function getManagementAPIToken(): Promise<string> {
  const auth0Audience = `https://${AUTH0_DOMAIN}/api/v2/`;
  const auth0ClientSecret = process.env["AUTH0_CLIENT_SECRET"];
  const clientId = process.env["AUTH0_CLIENT_ID"];
  const tokenUrl = `https://${AUTH0_DOMAIN}/oauth/token`;
  const tokenRequestBody = {
    client_id: clientId,
    client_secret: auth0ClientSecret,
    audience: auth0Audience,
    grant_type: "client_credentials",
  };

  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tokenRequestBody),
  });

  if (!tokenResponse.ok) {
    throw new Error(
      `Failed to obtain Auth0 Management API token: ${await tokenResponse.text()}`,
    );
  }

  const tokenData = await tokenResponse.json();
  return (tokenData as Auth0TokenResponse).access_token;
}

async function getAuth0UserData(
  email: string,
  managementAPIToken: string,
): Promise<Auth0UserResponse> {
  const apiUrl = `https://${AUTH0_DOMAIN}/api/v2/users-by-email?email=${encodeURIComponent(email)}`;
  const requestOptions = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${managementAPIToken}`,
      "Content-Type": "application/json",
    },
  };
  try {
    const response = await fetch(apiUrl, requestOptions);

    if (!response.ok) {
      throw new Error(
        `Auth0 API request failed with status ${response.status}: ${await response.text()}`,
      );
    }

    const result = await response.json();

    // Auth0 /api/v2/users returns an array of users matching the query.
    // We expect an array containing one user object.
    if (Array.isArray(result) && result.length === 1) {
      const user = result[0];
      // if no pseudonymizedId, we cannot proceed
      if (!user.app_metadata?.pseudonymizedId) {
        throw new Error(
          `User ${email} does not have a pseudonymizedId in app_metadata. Please set it and try again.`,
        );
      }
      return user as Auth0UserResponse;
    } else {
      throw new Error(
        `Expected one user for email ${email}, but got ${Array(result).length}`,
      );
    }
  } catch (error) {
    throw new Error(
      `An error occurred during the API call to the Management API: ${error}`,
    );
  }
}
async function main() {
  // Prompt user for email
  const rl = readline.createInterface({ input, output });
  const email = await new Promise<string>((resolve) => {
    rl.question("Please enter your Recidiviz Email: ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });

  /**
   Fetch user metadata via the Auth0 Client Credentials Flow. The Client Credentials Flow is used for
   machine-to-machine authentication (i.e we first get a token for the Management API, then use that token to fetch user data)
   Documentation: https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-credentials-flow
  */
  console.log("Fetching user information from Auth0...");
  const managementAPIToken = await getManagementAPIToken();
  const user = await getAuth0UserData(email, managementAPIToken);
  const fullName = user.name;
  const pseudonymizedId = user.app_metadata?.pseudonymizedId;

  console.log("Removing existing data...");
  await prisma.case.deleteMany({});
  await prisma.opportunity.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.mandatoryMinimum.deleteMany({});
  await prisma.insight.deleteMany({});
  await prisma.offense.deleteMany({});
  await prisma.county.deleteMany({});
  await prisma.district.deleteMany({});

  console.log("Adding Opportunities...");
  await addOpportunities();

  console.log("Adding Staff..");
  const staff = await addLocalUserAsStaff(email, pseudonymizedId, fullName);

  console.log("Adding Counties...");
  const districts = await addDistricts();
  const countyByName = await addCounties(districts);

  console.log("Adding Offenses...");
  const offenses = await addOffenses();

  console.log("Adding PSI Clients and Cases...");
  await addPSIClientsAndCases(countyByName, staff, offenses);

  console.log("Adding SAR Clients and Reports...");
  await addSARClientsAndReports(staff, offenses);

  // TODO(#10194) Add recidivism data to power visualizations
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
