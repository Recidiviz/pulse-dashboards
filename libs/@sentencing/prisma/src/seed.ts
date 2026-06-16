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
/* eslint-disable no-await-in-loop */
import * as readline from "node:readline";

import { faker } from "@faker-js/faker";

import {
  AsamLevelOfCareRecommendationCriterion,
  AssessmentType,
  CaseStatus,
  ChargeClassificationSubtype,
  ChargeClassificationType,
  DiagnosedSubstanceUseDisorderCriterion,
  DomainRiskLevel,
  Gender,
  Offense,
  Plea,
  PriorCriminalHistoryCriterion,
  Prisma,
  ReportType,
  StateCode,
  SubstanceUseDiagnosis,
  TreatmentProgramCategory,
} from "~@sentencing/prisma/client";
import { getPrismaClientForStateCode } from "~@sentencing/prisma/utils";
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
      officeAddress: faker.location.streetAddress(),
      officePhoneNumber: faker.phone.number(),
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
  offenses: Offense[],
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
  moOffenses: Offense[],
) {
  /* Add 5 SAR clients and reports with charges */
  const clients: { externalId: string }[] = [];

  // Create 5 clients for Missouri
  for (let i = 0; i < 5; i++) {
    const externalId = faker.string.uuid();
    const gender = faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE]);
    const sex = gender === Gender.MALE ? "male" : "female";

    const numDOCHistories = faker.number.int({ min: 0, max: 7 });
    const DOCHistories = Array.from({ length: numDOCHistories }, () => ({
      programCategory: faker.helpers.enumValue(TreatmentProgramCategory),
      programName: faker.word.words({ count: { min: 1, max: 3 } }),
      completedOn: faker.date.past(),
    }));

    await prisma.client.create({
      data: {
        externalId,
        pseudonymizedId: faker.string.alphanumeric({ length: 15 }),
        fullName: faker.person.fullName({ sex }),
        stateCode: StateCode.US_MO,
        gender,
        birthDate: faker.date.birthdate(),
        raceOrEthnicity: faker.helpers
          .shuffle([
            "WHITE",
            "BLACK",
            "ASIAN",
            "AMERICAN_INDIAN_ALASKAN_NATIVE",
          ])
          .slice(0, faker.number.int({ min: 1, max: 3 })),
        DOCTreatmentHistories: {
          create: DOCHistories,
        },
      },
      select: { externalId: true },
    });

    clients.push({ externalId });
  }

  // Create SAR reports for each client
  for (let i = 0; i < 5; i++) {
    const clientId = clients[i].externalId;

    // Create the SAR with imported data including ORAS assessment
    const sar = await prisma.sentencingAssessmentReport.create({
      data: {
        externalId: faker.string.uuid(),
        client: {
          connect: { externalId: clientId },
        },
        staff: {
          connect: { pseudonymizedId: staff.pseudonymizedId },
        },
        status: CaseStatus.NotYetStarted,
        dateRequested: faker.date.recent(),
        dueDate: faker.date.future(),
        courtDate: faker.datatype.boolean() ? faker.date.future() : null,
        completionDate: faker.datatype.boolean()
          ? faker.date.past()
          : undefined,
        address: faker.location.streetAddress(),
        // ORAS Assessment data — domain scores and overall max vary by tool type
        // Max scores derived from production data
        ...(() => {
          const assessmentType = faker.helpers.arrayElement([
            AssessmentType.ORAS_CST,
            AssessmentType.ORAS_SRT,
            AssessmentType.ORAS_PIT,
            AssessmentType.ORAS_RT,
          ]);

          const rand = (max: number) => faker.number.int({ min: 0, max });

          const randLevel = () =>
            faker.helpers.arrayElement([
              DomainRiskLevel.LOW,
              DomainRiskLevel.MODERATE,
              DomainRiskLevel.HIGH,
            ]);

          const domainScores = {
            ORAS_CST: {
              criminalHistoryLevel: rand(8),
              educationLevelScore: rand(6),
              familySocialSupportLevel: rand(5),
              neighborhoodLevel: rand(3),
              substanceAbuseLevel: rand(6),
              peerAssociatesLevel: rand(8),
              criminalBehaviorLevel: rand(13),
              responsivityLevel: null,
              criminalHistoryRiskLevel: randLevel(),
              educationRiskLevel: randLevel(),
              familySocialSupportRiskLevel: randLevel(),
              neighborhoodRiskLevel: randLevel(),
              substanceAbuseRiskLevel: randLevel(),
              peerAssociatesRiskLevel: randLevel(),
              criminalBehaviorRiskLevel: randLevel(),
            },
            ORAS_SRT: {
              criminalHistoryLevel: rand(12),
              educationLevelScore: rand(9),
              familySocialSupportLevel: null,
              neighborhoodLevel: null,
              substanceAbuseLevel: rand(4),
              peerAssociatesLevel: null,
              criminalBehaviorLevel: rand(19),
              responsivityLevel: null,
              criminalHistoryRiskLevel: randLevel(),
              educationRiskLevel: randLevel(),
              familySocialSupportRiskLevel: null,
              neighborhoodRiskLevel: null,
              substanceAbuseRiskLevel: randLevel(),
              peerAssociatesRiskLevel: null,
              criminalBehaviorRiskLevel: randLevel(),
            },
            ORAS_PIT: {
              criminalHistoryLevel: rand(10),
              educationLevelScore: rand(7),
              familySocialSupportLevel: rand(6),
              neighborhoodLevel: null,
              substanceAbuseLevel: rand(5),
              peerAssociatesLevel: null,
              criminalBehaviorLevel: rand(11),
              responsivityLevel: null,
              criminalHistoryRiskLevel: randLevel(),
              educationRiskLevel: randLevel(),
              familySocialSupportRiskLevel: randLevel(),
              neighborhoodRiskLevel: null,
              substanceAbuseRiskLevel: randLevel(),
              peerAssociatesRiskLevel: null,
              criminalBehaviorRiskLevel: randLevel(),
            },
            ORAS_RT: {
              criminalHistoryLevel: rand(12),
              educationLevelScore: rand(4),
              familySocialSupportLevel: null,
              neighborhoodLevel: null,
              substanceAbuseLevel: null,
              peerAssociatesLevel: null,
              criminalBehaviorLevel: rand(11),
              responsivityLevel: null,
              criminalHistoryRiskLevel: randLevel(),
              educationRiskLevel: randLevel(),
              familySocialSupportRiskLevel: null,
              neighborhoodRiskLevel: null,
              substanceAbuseRiskLevel: null,
              peerAssociatesRiskLevel: null,
              criminalBehaviorRiskLevel: randLevel(),
            },
          }[assessmentType];

          const assessmentScore = Object.values(domainScores).reduce<number>(
            (sum, v) => sum + (typeof v === "number" ? v : 0),
            0,
          );

          return { assessmentType, assessmentScore, ...domainScores };
        })(),
        assessmentDate: faker.date.recent(),
        assessmentAdministeredBy: faker.person.fullName(),
        ORASLastUpdatedAt: faker.date.recent(),
      },
    });

    // Add 1-3 charges per SAR with only imported fields: offense name, felony class, cause number, judge name, division, county, moCode
    const numCharges = faker.number.int({ min: 1, max: 3 });
    // To avoid duplicate offenses in a single SAR, shuffle and slice offenses
    const shuffledOffenses = faker.helpers.shuffle(moOffenses);
    for (let j = 0; j < numCharges; j++) {
      const classificationType = faker.helpers.enumValue(
        ChargeClassificationType,
      );
      const classificationSubtype = faker.helpers.enumValue(
        ChargeClassificationSubtype,
      );
      await prisma.charge.create({
        data: {
          sentencingAssessmentReport: {
            connect: { id: sar.id },
          },
          chargeExternalId: faker.string.uuid(),
          offense: shuffledOffenses[j].name,
          // Only imported fields - the rest will be filled in by users
          causeNum: `${faker.string.numeric(2)}-CR-${faker.string.numeric(5)}`,
          classificationType,
          classificationSubtype,
          judgeNames: Array.from(
            { length: faker.number.int({ min: 1, max: 3 }) },
            () =>
              `${faker.person.lastName().toUpperCase()}, ${faker.person.firstName().toUpperCase()}`,
          ),
          division: faker.string.numeric(4),
          county: faker.location.county(),
          moCode: `${faker.string.numeric(3)}${faker.string.numeric(3)}`,
        },
      });
    }

    await prisma.sentencingAssessmentReport.update({
      where: { id: sar.id },
      data: { mostSevereOffenseName: shuffledOffenses[0].name },
    });
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

// MO SAR disposition buckets match the sentence types used by case_insights_record for US_MO.
// Must stay in sync with CANONICAL_DISPOSITION_SLOTS in sentencing-client.
const MO_DISPOSITION_DATA = (malePercentages: number[]) => [
  {
    recommendationType: "Incarceration",
    sentenceLengthBucketStart: 1,
    sentenceLengthBucketEnd: 2,
    percentage: malePercentages[0],
  },
  {
    recommendationType: "Incarceration",
    sentenceLengthBucketStart: 3,
    sentenceLengthBucketEnd: 5,
    percentage: malePercentages[1],
  },
  {
    recommendationType: "Incarceration",
    sentenceLengthBucketStart: 6,
    sentenceLengthBucketEnd: -1,
    percentage: malePercentages[2],
  },
  {
    recommendationType: "Probation",
    sentenceLengthBucketStart: 0,
    sentenceLengthBucketEnd: -1,
    percentage: malePercentages[3],
  },
  {
    recommendationType: "Treatment_in_prison",
    sentenceLengthBucketStart: 0,
    sentenceLengthBucketEnd: -1,
    percentage: malePercentages[4],
  },
  {
    recommendationType: "Suspended",
    sentenceLengthBucketStart: 0,
    sentenceLengthBucketEnd: -1,
    percentage: malePercentages[5],
  },
];

async function createOffenses(stateCode: StateCode, names: string[]) {
  await prisma.offense.createMany({
    data: names.map((name) => ({
      stateCode,
      name,
      frequency: faker.number.int(100),
      isViolentOffense: faker.datatype.boolean(),
      isSexOffense: faker.datatype.boolean(),
    })),
    skipDuplicates: true,
  });
  return prisma.offense.findMany({ where: { stateCode } });
}

async function addOffenses() {
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

  const psiOffenses = await createOffenses(StateCode.US_ID, offenseNames);
  // MO offense names must be globally unique (Offense.name @@unique)
  const moOffenses = await createOffenses(
    StateCode.US_MO,
    offenseNames.map((n) => `${n} (MO)`),
  );

  // Create Mandatory Minimums and PSI insights for each PSI offense
  for (const offense of psiOffenses) {
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

    // Create one insight per bucket (0=Low, 1=Moderate, 2=High, 3=Very High) for each gender
    for (const bucket of [0, 1, 2, 3]) {
      const bucketData = {
        assessmentScoreBucketStart: bucket,
        assessmentScoreBucketEnd: bucket,
        rollupStateCode: StateCode.US_ID,
        rollupRecidivismNumRecords: 0,
      };

      await prisma.insight.create({
        data: {
          stateCode: StateCode.US_ID,
          gender: Gender.MALE,
          offenseId: offense.id,
          ...bucketData,
          dispositionNumRecords: 100,
          dispositionData: {
            create: [
              {
                recommendationType: "Probation",
                sentenceLengthBucketStart: 0,
                sentenceLengthBucketEnd: -1,
                percentage: 0.05,
              },
              {
                recommendationType: "Court Ordered Treatment",
                sentenceLengthBucketStart: 0,
                sentenceLengthBucketEnd: -1,
                percentage: 0.11,
              },
              {
                recommendationType: null,
                sentenceLengthBucketStart: 0,
                sentenceLengthBucketEnd: 1,
                percentage: 0.18,
              },
              {
                recommendationType: null,
                sentenceLengthBucketStart: 1,
                sentenceLengthBucketEnd: 2,
                percentage: 0.51,
              },
              {
                recommendationType: null,
                sentenceLengthBucketStart: 3,
                sentenceLengthBucketEnd: 5,
                percentage: 0.15,
              },
            ],
          },
        },
      });

      await prisma.insight.create({
        data: {
          stateCode: StateCode.US_ID,
          gender: Gender.FEMALE,
          offenseId: offense.id,
          ...bucketData,
          dispositionNumRecords: 80,
          dispositionData: {
            create: [
              {
                recommendationType: "Probation",
                sentenceLengthBucketStart: 0,
                sentenceLengthBucketEnd: -1,
                percentage: 0.08,
              },
              {
                recommendationType: "Court Ordered Treatment",
                sentenceLengthBucketStart: 0,
                sentenceLengthBucketEnd: -1,
                percentage: 0.14,
              },
              {
                recommendationType: null,
                sentenceLengthBucketStart: 0,
                sentenceLengthBucketEnd: 1,
                percentage: 0.22,
              },
              {
                recommendationType: null,
                sentenceLengthBucketStart: 1,
                sentenceLengthBucketEnd: 2,
                percentage: 0.42,
              },
              {
                recommendationType: null,
                sentenceLengthBucketStart: 3,
                sentenceLengthBucketEnd: 5,
                percentage: 0.14,
              },
            ],
          },
        },
      });
    }
  }

  // Create MO (SAR) insights for each MO offense
  for (const offense of moOffenses) {
    for (const bucket of [0, 1, 2, 3]) {
      const moBucketData = {
        assessmentScoreBucketStart: bucket,
        assessmentScoreBucketEnd: bucket,
        rollupStateCode: StateCode.US_MO,
        rollupRecidivismNumRecords: faker.number.int({ min: 100, max: 2000 }),
      };

      await prisma.insight.create({
        data: {
          stateCode: StateCode.US_MO,
          gender: Gender.MALE,
          offenseId: offense.id,
          ...moBucketData,
          dispositionNumRecords: faker.number.int({ min: 100, max: 1000 }),
          dispositionData: {
            create: MO_DISPOSITION_DATA([0.02, 0.12, 0, 0.65, 0.07, 0.139]),
          },
          avgSentenceLengthYears: faker.number.float({
            min: 2,
            max: 15,
            fractionDigits: 1,
          }),
          avgPctServed: faker.number.float({
            min: 15,
            max: 80,
            fractionDigits: 1,
          }),
          timeServedNumRecords: faker.number.int({ min: 5, max: 500 }),
        },
      });

      await prisma.insight.create({
        data: {
          stateCode: StateCode.US_MO,
          gender: Gender.FEMALE,
          offenseId: offense.id,
          ...moBucketData,
          dispositionNumRecords: faker.number.int({ min: 50, max: 800 }),
          dispositionData: {
            create: MO_DISPOSITION_DATA([0.02, 0.1, 0.06, 0.62, 0.06, 0.14]),
          },
          avgSentenceLengthYears: faker.number.float({
            min: 2,
            max: 15,
            fractionDigits: 1,
          }),
          avgPctServed: faker.number.float({
            min: 15,
            max: 80,
            fractionDigits: 1,
          }),
          timeServedNumRecords: faker.number.int({ min: 5, max: 500 }),
        },
      });
    }
  }

  return { psiOffenses, moOffenses };
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
  await prisma.sentencingAssessmentReport.deleteMany({});
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

  // Assign a district to the staff member
  const staffDistrict = faker.helpers.arrayElement(districts);
  await prisma.staff.update({
    where: { externalId: staff.externalId },
    data: { districtId: staffDistrict.id },
  });

  console.log("Adding Offenses...");
  const { psiOffenses, moOffenses } = await addOffenses();

  console.log("Adding PSI Clients and Cases...");
  await addPSIClientsAndCases(countyByName, staff, psiOffenses);

  console.log("Adding SAR Clients and Reports...");
  await addSARClientsAndReports(staff, moOffenses);

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
