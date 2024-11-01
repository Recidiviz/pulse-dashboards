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

import { CaseRecommendation, Gender, Prisma } from "@prisma/client";
import { captureException } from "@sentry/node";
import _ from "lodash";
import z from "zod";

import { EXTERNAL_REPORT_TYPE_TO_INTERNAL_REPORT_TYPE } from "~sentencing-server/import/handle-import/constants";
import {
  caseImportSchema,
  clientImportSchema,
  insightImportSchema,
  offenseImportSchema,
  opportunityImportSchema,
  recidivismSeriesSchema,
  staffImportSchema,
} from "~sentencing-server/import/handle-import/models";
import { getPrismaClientForStateCode } from "~sentencing-server/prisma";

export async function transformAndLoadClientData(
  stateCode: string,
  data: AsyncGenerator<unknown>,
) {
  const prismaClient = getPrismaClientForStateCode(stateCode);

  const existingCases = await prismaClient.case.findMany({
    select: { externalId: true },
  });

  const clientIds: string[] = [];

  // Load new client data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const datum of data) {
    const clientData = clientImportSchema.parse(datum);

    // Just get the cases which are already in the database (if a case hasn't been uploaded yet, it will be linked to this client during the case upload process)
    const existingCasesForClient = existingCases.filter(({ externalId }) =>
      clientData.case_ids.includes(externalId),
    );

    const hasKnownGender =
      clientData.gender !== Gender.INTERNAL_UNKNOWN &&
      clientData.gender !== Gender.EXTERNAL_UNKNOWN;

    const newClient = {
      externalId: clientData.external_id,
      pseudonymizedId: clientData.pseudonymized_id,
      stateCode: clientData.state_code,
      fullName: clientData.full_name,
      county: clientData.county ?? "UNKNOWN",
      birthDate: clientData.birth_date,
      isGenderLocked: hasKnownGender,
      district: clientData.district,
      cases: {
        connect: existingCasesForClient,
      },
    };

    clientIds.push(newClient.externalId);

    // Load data
    await prismaClient.client.upsert({
      where: {
        externalId: newClient.externalId,
      },
      create: {
        ...newClient,
        // When creating, always set the gender
        gender: clientData.gender,
      },
      update: {
        ...newClient,
        // When updating, only change the gender if it's defined
        gender: hasKnownGender ? clientData.gender : undefined,
      },
    });
  }

  // Delete all of the old clients that weren't just loaded
  await prismaClient.client.deleteMany({
    where: {
      NOT: {
        externalId: {
          in: clientIds,
        },
      },
    },
  });
}

export async function transformAndLoadStaffData(
  stateCode: string,
  data: AsyncGenerator<unknown>,
) {
  const prismaClient = getPrismaClientForStateCode(stateCode);

  const existingCases = await prismaClient.case.findMany({
    select: { externalId: true },
  });

  const staffIds: string[] = [];

  // Load new staff data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const datum of data) {
    const staffData = staffImportSchema.parse(datum);

    // Just get the cases which are already in the database (if a case hasn't been uploaded yet, it will be linked to this client during the case upload process)
    const existingCasesForStaff = existingCases.filter(({ externalId }) =>
      staffData.case_ids.includes(externalId),
    );

    const newStaff = {
      externalId: staffData.external_id,
      pseudonymizedId: staffData.pseudonymized_id,
      stateCode: staffData.state_code,
      fullName: staffData.full_name,
      email: staffData.email,
      cases: {
        connect: existingCasesForStaff,
      },
    };

    staffIds.push(newStaff.externalId);

    // Load data
    await prismaClient.staff.upsert({
      where: {
        externalId: newStaff.externalId,
      },
      create: newStaff,
      update: newStaff,
    });
  }

  // Delete all of the old staff that weren't just loaded
  await prismaClient.staff.deleteMany({
    where: {
      NOT: {
        externalId: {
          in: staffIds,
        },
      },
    },
  });
}

export async function transformAndLoadCaseData(
  stateCode: string,
  data: AsyncGenerator<unknown>,
) {
  const prismaClient = getPrismaClientForStateCode(stateCode);

  const existingCaseExternalIds = (
    await prismaClient.case.findMany({
      select: { externalId: true },
    })
  ).map(({ externalId }) => externalId);

  const newCaseExternalIds: string[] = [];

  // Load new case data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const datum of data) {
    const caseData = caseImportSchema.parse(datum);

    newCaseExternalIds.push(caseData.external_id);

    const staffExternalIds = (
      await prismaClient.staff.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId);

    const clientExternalIds = (
      await prismaClient.client.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId);

    // Check if the staff and clients exist in the db - if not, we'll link
    // them later
    const staffId = staffExternalIds.find((id) => id === caseData.staff_id);
    const clientId = clientExternalIds.find((id) => id === caseData.client_id);

    const newCase = {
      externalId: caseData.external_id,
      stateCode: caseData.state_code,
      staffId,
      clientId,
      dueDate: caseData.due_date,
      completionDate: caseData.completion_date,
      sentenceDate: caseData.sentence_date,
      assignedDate: caseData.assigned_date,
      county: caseData.county,
      lsirScore: caseData.lsir_score,
      lsirLevel: caseData.lsir_level,
      reportType: caseData.report_type
        ? EXTERNAL_REPORT_TYPE_TO_INTERNAL_REPORT_TYPE[caseData.report_type]
        : null,
      isLsirScoreLocked: caseData.lsir_score !== undefined,
      isReportTypeLocked: caseData.report_type !== undefined,
    };

    // Load data
    await prismaClient.case.upsert({
      where: {
        externalId: newCase.externalId,
      },
      create: newCase,
      update: newCase,
    });
  }

  // Check to make sure there aren't any missing cases in the data import
  const missingCases = existingCaseExternalIds.filter(
    (id) => !newCaseExternalIds.includes(id),
  );

  if (!_.isEmpty(missingCases)) {
    captureException(
      `Error when importing cases! These cases exist in the database but are missing from the data import: ${JSON.stringify(missingCases)}`,
    );
  }
}

export async function transformAndLoadOpportunityData(
  stateCode: string,
  data: AsyncGenerator<unknown>,
) {
  const prismaClient = getPrismaClientForStateCode(stateCode);

  const opportunityNames: string[] = [];
  const providerNames: string[] = [];

  // Load new opportunity data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const datum of data) {
    const opportunityData = opportunityImportSchema.parse(datum);

    const newOpportunity = {
      ..._.pick(opportunityData, [
        "developmentalDisabilityDiagnosisCriterion",
        "noCurrentOrPriorSexOffenseCriterion",
        "noCurrentOrPriorViolentOffenseCriterion",
        "noPendingFelonyChargesInAnotherCountyOrStateCriterion",
        "entryOfGuiltyPleaCriterion",
        "veteranStatusCriterion",
        "priorCriminalHistoryCriterion",
        "diagnosedMentalHealthDiagnosisCriterion",
        "asamLevelOfCareRecommendationCriterion",
        "diagnosedSubstanceUseDisorderCriterion",
        "minLsirScoreCriterion",
        "maxLsirScoreCriterion",
        "minAge",
        "maxAge",
        "district",
        "additionalNotes",
        "genericDescription",
      ]),
      opportunityName: opportunityData.OpportunityName,
      description: opportunityData.Description,
      // We need to use the default provider name if the provider name is empty because prisma
      // doesn't allow for nulls in composite unique fields
      providerName: opportunityData.ProviderName,
      providerPhoneNumber: opportunityData.CleanedProviderPhoneNumber,
      providerWebsite: opportunityData.ProviderWebsite,
      providerAddress: opportunityData.ProviderAddress,
      totalCapacity: opportunityData.CapacityTotal,
      availableCapacity: opportunityData.CapacityAvailable,
      needsAddressed: opportunityData.NeedsAddressed,
      genders: opportunityData.genders ?? [],
      lastUpdatedAt: opportunityData.lastUpdatedDate,
    };

    opportunityNames.push(opportunityData.OpportunityName);
    providerNames.push(opportunityData.ProviderName);

    // Load data
    await prismaClient.opportunity.upsert({
      where: {
        opportunityName_providerName: {
          opportunityName: newOpportunity.opportunityName,
          providerName: newOpportunity.providerName,
        },
      },
      create: newOpportunity,
      update: newOpportunity,
    });
  }

  // Delete all of the old opportunities that weren't just loaded
  await prismaClient.opportunity.deleteMany({
    where: {
      NOT: {
        AND: [
          {
            opportunityName: {
              in: opportunityNames,
            },
          },
          {
            providerName: {
              in: providerNames,
            },
          },
        ],
      },
    },
  });
}

function transformRecidivismSeries(
  recommendationType: CaseRecommendation,
  dataPoints?: z.infer<typeof recidivismSeriesSchema>,
): Prisma.RecidivismSeriesCreateWithoutInsightInput | undefined {
  if (dataPoints === undefined) {
    return undefined;
  }

  return {
    recommendationType,
    dataPoints: {
      createMany: {
        data: dataPoints.map((s) => ({
          cohortMonths: s.cohort_months,
          eventRate: s.event_rate,
          lowerCI: s.lower_ci,
          upperCI: s.upper_ci,
        })),
      },
    },
  };
}

function transformAllRecidivismSeries(
  data: z.infer<typeof insightImportSchema>,
) {
  const {
    recidivism_probation_series,
    recidivism_rider_series,
    recidivism_term_series,
  } = data;

  return [
    transformRecidivismSeries("Probation", recidivism_probation_series),
    transformRecidivismSeries("Rider", recidivism_rider_series),
    transformRecidivismSeries("Term", recidivism_term_series),
  ].filter(
    (v): v is Prisma.RecidivismSeriesCreateWithoutInsightInput =>
      v !== undefined,
  ) satisfies Prisma.RecidivismSeriesCreateWithoutInsightInput[];
}

function transformDispositions(data: z.infer<typeof insightImportSchema>) {
  return [
    {
      recommendationType: "Probation",
      percentage: data.disposition_probation_pc,
    },
    {
      recommendationType: "Rider",
      percentage: data.disposition_rider_pc,
    },
    {
      recommendationType: "Term",
      percentage: data.disposition_term_pc,
    },
  ] satisfies Prisma.DispositionCreateManyInsightInput[];
}

export async function transformAndLoadInsightData(
  stateCode: string,
  data: AsyncGenerator<unknown>,
) {
  const prismaClient = getPrismaClientForStateCode(stateCode);

  // Insights aren't linked to any other models and don't have any frontend-mutable attributes, so we can just delete all of them and re-add them
  await prismaClient.insight.deleteMany();

  // Load new insight data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const datum of data) {
    const insightData = insightImportSchema.parse(datum);

    const newInsight = {
      stateCode: insightData.state_code,
      gender: insightData.gender,
      // Create the offense if it doesn't already exist in the db
      offense: {
        connectOrCreate: {
          where: {
            name: insightData.most_severe_description,
          },
          create: {
            stateCode: insightData.state_code,
            name: insightData.most_severe_description,
          },
        },
      },
      assessmentScoreBucketStart: insightData.assessment_score_bucket_start,
      assessmentScoreBucketEnd: insightData.assessment_score_bucket_end,
      rollupStateCode: insightData.recidivism_rollup.state_code,
      rollupGender: insightData.recidivism_rollup.gender,
      rollupAssessmentScoreBucketStart:
        insightData.recidivism_rollup.assessment_score_bucket_start,
      rollupAssessmentScoreBucketEnd:
        insightData.recidivism_rollup.assessment_score_bucket_end,
      // Create the offense if it doesn't already exist in the db
      rollupOffense: {
        connectOrCreate: insightData.recidivism_rollup.most_severe_description
          ? {
              where: {
                name: insightData.recidivism_rollup.most_severe_description,
              },
              create: {
                stateCode: insightData.state_code,
                name: insightData.recidivism_rollup.most_severe_description,
              },
            }
          : undefined,
      },
      rollupNcicCategory:
        insightData.recidivism_rollup.most_severe_ncic_category_uniform,
      rollupCombinedOffenseCategory:
        insightData.recidivism_rollup.combined_offense_category,
      rollupViolentOffense: insightData.recidivism_rollup.violent_offense,
      rollupRecidivismNumRecords: insightData.recidivism_num_records,
      rollupRecidivismSeries: {
        create: transformAllRecidivismSeries(insightData),
      },
      dispositionNumRecords: insightData.disposition_num_records,
      dispositionData: {
        create: transformDispositions(insightData),
      },
    } satisfies Prisma.InsightCreateInput;

    await prismaClient.insight.create({
      data: newInsight,
    });
  }
}

export async function transformAndLoadOffenseData(
  stateCode: string,
  data: AsyncGenerator<unknown>,
) {
  const prismaClient = getPrismaClientForStateCode(stateCode);

  const offenses = [];

  for await (const datum of data) {
    const offenseData = offenseImportSchema.parse(datum);

    offenses.push({
      stateCode: offenseData.state_code,
      name: offenseData.charge,
      // If the data doesn't specify the value, make sure to set it to be explicitly
      // null (passing an undefined value to Prisma will just leave the field as is)
      isSexOffense:
        offenseData.is_sex_offense === undefined
          ? null
          : offenseData.is_sex_offense,
      isViolentOffense:
        offenseData.is_violent === undefined ? null : offenseData.is_violent,
    });
  }

  const missingExistingOffenses = await prismaClient.offense.findMany({
    where: {
      NOT: {
        name: {
          in: offenses.map((offenseData) => offenseData.name),
        },
      },
    },
  });

  // If there are any offenses in the database that aren't in the data import, log an error, but don't fail the task or it will be retried
  if (missingExistingOffenses.length > 0) {
    captureException(
      `Error when importing offenses! These offenses exist in the database but are missing from the data import: ${missingExistingOffenses.map((offense) => offense.name).join(", ")}`,
    );
    return;
  }

  for (const offense of offenses) {
    // Load data
    await prismaClient.offense.upsert({
      where: {
        name: offense.name,
      },
      create: offense,
      update: offense,
    });
  }
}
