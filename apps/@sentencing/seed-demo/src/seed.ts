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
  DiagnosedSubstanceUseDisorderCriterion,
  Gender,
  NeedToBeAddressed,
  PriorCriminalHistoryCriterion,
  Prisma,
  PrismaClient,
  ReportType,
  StateCode,
} from "@prisma/sentencing/client";

import { getPrismaClientForStateCode } from "~@sentencing/prisma/utils";

const PRISMA_TABLES = Prisma.dmmf.datamodel.models
  .map((model) => model.name)
  .filter((table) => table);

// Hard code these ids so that we don't need to update our Auth0 profiles each time there is a seeding change.
const STAFF_PSEUDO_IDS = [
  "c3ecfffc-983c-4004-8a13-f17ae31bc37a",
  "6d419cb0-30ba-4bf9-aa06-b41ce6e54fdc",
  "43e7c106-e1e8-4a85-a209-14463b4be4e6",
  "26535117-4912-47e8-b66c-0e0cf7b2660f",
  "e29b8258-40d4-4c78-9af4-374325c15fa3",
  "55908201-0f17-4e91-bd0e-513dd0ea164b",
  "c149f6f9-c543-4037-99e3-eb90ca75d73d",
  "5fba4df3-a085-46d7-b134-cd0a949c69a6",
  "ece1b5bb-0907-44c5-8574-028fb18f1bcc",
  "66157ec4-2dbf-49fe-9a70-46203fad4d77 ",
];

export async function resetDb(prismaClient: PrismaClient) {
  await prismaClient.$transaction(
    PRISMA_TABLES.map((table) =>
      prismaClient.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`),
    ),
  );
}

function randBool() {
  return Math.random() < 0.5;
}

async function main() {
  const prisma = getPrismaClientForStateCode(StateCode.US_ID);

  await resetDb(prisma);

  const staff: Prisma.StaffCreateInput[] = [];

  for (const pseudoId of STAFF_PSEUDO_IDS) {
    staff.push({
      externalId: faker.string.uuid(),
      pseudonymizedId: pseudoId,
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      stateCode: StateCode.US_ID,
    });
  }

  const dbStaff = await prisma.staff.createManyAndReturn({ data: staff });

  // Cases
  const numberOfCasesPerStaff = 5;

  for (const staff of dbStaff) {
    for (let j = 0; j < numberOfCasesPerStaff; j++) {
      // eslint-disable-next-line no-await-in-loop -- this is a seed script
      await prisma.case.create({
        data: {
          externalId: faker.string.uuid(),
          client: {
            create: {
              externalId: faker.string.uuid(),
              pseudonymizedId: faker.string.uuid(),
              fullName: faker.person.fullName(),
              stateCode: StateCode.US_ID,
              gender: faker.helpers.enumValue(Gender),
              birthDate: faker.date.birthdate(),
            },
          },
          staff: {
            connect: {
              externalId: staff.externalId,
            },
          },
          stateCode: StateCode.US_ID,
          dueDate: faker.date.future(),
          reportType: faker.helpers.enumValue(ReportType),
        },
      });
    }
  }

  // Opportunities
  const opportunities: Prisma.OpportunityCreateInput[] = [];

  const opportunityNames = [
    "District 1 Connection & Intervention Station",
    "Family Promise of North Idaho",
    "Brickhouse Recovery PHP",
    "Brickhouse Recovery IOP",
    "Restored Paths (Heritage Health)",
    "Ideal Option",
    "ARG Addiction Treatment Center",
    "TDC Dual Diagnosis Treatment",
    "ICC Medication-Assisted Treatment",
    "Mind Matters  LLC",
    "Dragonfly Recovery Support Services",
    "Bigfoot Counseling, LLC",
    "Phillips Ranch",
    "Rathdrum Counseling",
    "Tamarack Treatment",
    "Rawlings Community Counseling",
    "Amaris Behavioral Health",
    "Good Samaritan Women’s Blue Creek House",
    "Good Samaritan Men's Sunnyside House",
    "Good Samaritan Men's Bonnell House",
    "ID Dept. of Health & Welfare",
    "Idaho Department of Labor",
    "Equus Workforce Solutions",
    "Kootenai Clinic Psychiatry",
    "Narcotics Anonymous",
    "Union Gospel",
    "Alcoholics Anonymous",
    "NAMI Idaho",
    "St. Vincent de Paul North Idaho",
    "Trinity Group Homes",
    "Father Bill’s Kitchen",
    "Benewah County Felony Drug Court",
    "Bonner County Felony Drug Court",
    "Boundary County Felony Drug Court",
    "Kootenai County Felony Drug Court",
    "Kootenai County Mental Health Court",
    "Shoshone County Felony Drug Court",
    "Honest Jobs",
    "Heritage Health",
    "Community Action Partnership",
    "Kanisku Community Health",
    "District 2 Connection & Intervention Station",
    "ChangePoint Mental Health Services",
    "ChangePoint Substance Use Treatment",
    "Riverside Recovery",
    "CHAS",
    "Weeks and Vietri Domestic Violence Class",
    "Weeks and Vietri Counseling",
    "Weeks and Vietri Outpatient Substance Abuse Facility",
    "Weeks and Vietri Outpatient Substance Abuse Groups",
    "Scott Community Care",
    "Latah Recovery Center",
    "First Step for Life Recovery Center ",
    "Camas Professional Counseling",
    "Central Idaho Counseling",
    "ChangePoint Orofino ",
    "A to Z Crisis Center",
    "A to Z Group Respite",
    "A to Z Mental Health Services",
    "UYLC Substance Abuse Recovery",
    "UYLC Free TeleMental Health Services",
    "UYLC Basic Needs Resources",
    "UYLC Development Resources",
    "UYLC Family Resources",
    "Serenity Treatment ",
    "Clearwater County Felony Drug Court",
    "Clearwater County Mental Health Court",
    "Latah County Felony Drug Court",
    "Latah County Mental Health Court",
    "Nez Perce Felony Drug Court",
    "Nez Perce Mental Health Court",
    "District 2 Veterans Court",
    "Honest Jobs",
    "Rural Crisis Center",
    "Lakeside Assisted Living",
    "Rising Sun Sober Living",
    "Oxford Houses",
    "District 3 Connection & Intervention Station",
    "Moonlight Mountain Inpatient Treatment",
    "Moonlight Mountain Outpatient Treatment",
    "Ascent Behavioral Health Services",
    "Caldwell Recovery Center Outpatient Treatment",
    "Trivium Life Services SUD Treatment",
    "Trivium Life Services Domestic Violence Treatment",
    "Peak Recovery Individual Services",
    "Peak Recovery Group Services",
    "Allegiance Reintegration Support Services",
    "Ideal Option MAT Services",
    "Vocational Rehabilitation Job Assistance ",
    "St Vincent de Paul Reentry Career Development",
    "Terry Reilly Behavioral Health Services",
    "Human Supports of Idaho SUD Treatment",
    "Human Supports of Idaho Counseling",
    "Human Supports of Idaho Case Management",
    "Education Assistance at TRIO",
    "GED Preparation at CWI",
    "Emmett Family Services Outpatient Treatment (Emmett Office)",
    "Emmett Family Services Outpatient Treatment (Payette Office)",
    "Outpatient Substance Abuse Treatment Program",
    "Family Services at Access Behavioral Health",
    "Counseling at Access Behavioral Health",
    "Case Management and Support at Recovery Ways of Idaho",
    "Counseling at Recovery Ways of Idaho ",
    "Allegiance Behavioral Health Counseling",
    "Caldwell Recovery Center Inpatient Treatment",
    "Canyon County Drug Court",
    "Canyon County DUI Court",
    "Canyon County Mental Health Court",
    "Canyon County Veterans Treatment Court",
    "Canyon County Juvenile Drug Court",
    "Gem County Drug Court",
    "Tri-County Felony Drug Court",
    "Honest Jobs",
  ];

  for (const opportunityName of opportunityNames) {
    opportunities.push({
      opportunityName,
      description: faker.commerce.productDescription(),
      providerName: faker.company.name(),
      providerPhoneNumber: faker.phone.number(),
      providerWebsite: faker.internet.url(),
      providerAddress: faker.location.streetAddress(),
      minAge: randBool() ? faker.number.int({ max: 50 }) : null,
      maxAge: randBool() ? faker.number.int({ min: 50, max: 100 }) : null,
      needsAddressed: faker.helpers.uniqueArray(
        // @ts-expect-error ugh
        faker.helpers.enumValue(NeedToBeAddressed),
        faker.number.int({ min: 0, max: 5 }),
      ),
      developmentalDisabilityDiagnosisCriterion: faker.datatype.boolean(),
      noCurrentOrPriorSexOffenseCriterion: faker.datatype.boolean(),
      noCurrentOrPriorViolentOffenseCriterion: faker.datatype.boolean(),
      noPendingFelonyChargesInAnotherCountyOrStateCriterion:
        faker.datatype.boolean(),
      entryOfGuiltyPleaCriterion: faker.datatype.boolean(),
      veteranStatusCriterion: faker.datatype.boolean(),
      priorCriminalHistoryCriterion: randBool()
        ? faker.helpers.enumValue(PriorCriminalHistoryCriterion)
        : null,
      asamLevelOfCareRecommendationCriterion: randBool()
        ? faker.helpers.enumValue(AsamLevelOfCareRecommendationCriterion)
        : null,
      diagnosedSubstanceUseDisorderCriterion: randBool()
        ? faker.helpers.enumValue(DiagnosedSubstanceUseDisorderCriterion)
        : null,
      lastUpdatedAt: faker.date.recent(),
    });
  }

  await prisma.opportunity.createMany({ data: opportunities });

  const numDistricts = 3;
  const districts: Prisma.DistrictCreateInput[] = [];
  for (let i = 0; i < numDistricts; i++) {
    districts.push({
      name: faker.location.county(),
      stateCode: StateCode.US_ID,
    });
  }

  const dbDistricts = await prisma.district.createManyAndReturn({
    data: districts,
  });

  const numCountiesPerDistrict = 3;
  const counties: Prisma.CountyCreateManyInput[] = [];
  for (const district of dbDistricts) {
    for (let i = 0; i < numCountiesPerDistrict; i++) {
      counties.push({
        name: faker.location.county(),
        stateCode: StateCode.US_ID,
        districtId: district.id,
      });
    }
  }

  await prisma.county.createMany({
    data: counties,
  });

  const offenseNames = [
    "CONTROLLED SUBSTANCE-POSSESSION OF",
    "GRAND THEFT",
    "BURGLARY",
    "DRIVING UNDER THE INFLUENCE",
    "ASSAULT-AGGRAVATED",
    "WEAPON-UNLAWFUL POSSESSION OF",
    "ELUDING A POLICE OFFICER",
    "FORGERY",
    "ROBBERY",
  ];
  const offenses: Prisma.OffenseCreateManyInput[] = [];
  for (const offenseName of offenseNames) {
    offenses.push({
      name: offenseName,
      stateCode: StateCode.US_ID,
      frequency: faker.number.int({ min: 1, max: 150 }),
    });
  }

  const dbOffenses = await prisma.offense.createManyAndReturn({
    data: offenses,
  });

  const insights: Prisma.InsightCreateManyInput[] = [];
  for (const offense of dbOffenses) {
    insights.push({
      offenseId: offense.id,
      stateCode: StateCode.US_ID,
      gender: faker.helpers.enumValue(Gender),
      assessmentScoreBucketStart: 0,
      assessmentScoreBucketEnd: -1,
      rollupStateCode: StateCode.US_ID,
      rollupRecidivismNumRecords: faker.number.int({ min: 1, max: 100 }),
      dispositionNumRecords: faker.number.int({ min: 1, max: 100 }),
    });
  }

  await prisma.insight.createMany({
    data: insights,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
