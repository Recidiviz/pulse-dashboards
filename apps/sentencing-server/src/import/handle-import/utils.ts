import { CaseRecommendation, Prisma } from "@prisma/client";
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
import { prismaClient } from "~sentencing-server/prisma";

export async function transformAndLoadClientData(data: unknown) {
  const parsedData = clientImportSchema.parse(data);

  const existingCases = await prismaClient.case.findMany({
    select: { externalId: true },
  });

  // Transform the provided data
  const cleanedData = parsedData.map((clientData) => {
    // Just get the cases which are already in the database (if a case hasn't been uploaded yet, it will be linked to this client during the case upload process)
    const existingCasesForClient = existingCases.filter(({ externalId }) =>
      clientData.case_ids.includes(externalId),
    );

    return {
      externalId: clientData.external_id,
      pseudonymizedId: clientData.pseudonymized_id,
      stateCode: clientData.state_code,
      fullName: clientData.full_name,
      gender: clientData.gender,
      county: clientData.county ?? "UNKNOWN",
      birthDate: clientData.birth_date,
      Cases: {
        connect: existingCasesForClient,
      },
    };
  });

  // Load new client data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for (const newClient of cleanedData) {
    await prismaClient.client.upsert({
      where: {
        externalId: newClient.externalId,
      },
      create: newClient,
      update: newClient,
    });
  }

  // Delete all of the old clients that weren't just loaded
  await prismaClient.client.deleteMany({
    where: {
      NOT: {
        externalId: {
          in: cleanedData.map((client) => client.externalId),
        },
      },
    },
  });
}

export async function transformAndLoadStaffData(data: unknown) {
  const parsedData = staffImportSchema.parse(data);

  const existingCases = await prismaClient.case.findMany({
    select: { externalId: true },
  });

  const cleanedData = parsedData.map((staffData) => {
    // Just get the cases which are already in the database (if a case hasn't been uploaded yet, it will be linked to this client during the case upload process)
    const existingCasesForStaff = existingCases.filter(({ externalId }) =>
      staffData.case_ids.includes(externalId),
    );

    return {
      externalId: staffData.external_id,
      pseudonymizedId: staffData.pseudonymized_id,
      stateCode: staffData.state_code,
      fullName: staffData.full_name,
      email: staffData.email,
      Cases: {
        connect: existingCasesForStaff,
      },
    };
  });

  // Load new staff data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for (const newStaff of cleanedData) {
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
          in: cleanedData.map((staff) => staff.externalId),
        },
      },
    },
  });
}

export async function transformAndLoadCaseData(data: unknown) {
  const parsedData = caseImportSchema.parse(data);

  const existingCaseExternalIds = (
    await prismaClient.case.findMany({
      select: { externalId: true },
    })
  ).map(({ externalId }) => externalId);

  const newCaseExternalIds = parsedData.map(({ external_id }) => external_id);

  const missingCases = existingCaseExternalIds.filter(
    (id) => !newCaseExternalIds.includes(id),
  );

  if (!_.isEmpty(missingCases)) {
    throw new Error(
      `Error when importing cases! These cases exist in the database but are missing from the data import: ${JSON.stringify(missingCases)}`,
    );
  }

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

  const cleanedData = await Promise.all(
    parsedData.map(async (caseData) => {
      // Check if the staff and clients exist in the db - if not, we'll link
      // them later
      const staffId = staffExternalIds.find((id) => id === caseData.staff_id);
      const clientId = clientExternalIds.find(
        (id) => id === caseData.client_id,
      );

      return {
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
        reportType:
          EXTERNAL_REPORT_TYPE_TO_INTERNAL_REPORT_TYPE[caseData.report_type],
        isLsirScoreLocked: caseData.lsir_score !== undefined,
      };
    }),
  );

  // Load new case data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for (const newCase of cleanedData) {
    await prismaClient.case.upsert({
      where: {
        externalId: newCase.externalId,
      },
      create: newCase,
      update: newCase,
    });
  }
}

export async function transformAndLoadOpportunityData(data: unknown) {
  const parsedData = opportunityImportSchema.parse(data);

  const cleanedData = parsedData.map((opportunityData) => {
    return {
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
    };
  });

  // Load new opportunity data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for (const newOpportunity of cleanedData) {
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
              in: _.map(cleanedData, "opportunityName"),
            },
          },
          {
            providerName: {
              in: _.map(cleanedData, "providerName"),
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
  data: z.infer<typeof insightImportSchema>[number],
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

function transformDispositions(
  data: z.infer<typeof insightImportSchema>[number],
) {
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

export async function transformAndLoadInsightData(data: unknown) {
  const parsedData = insightImportSchema.parse(data);

  const cleanedData = parsedData.map((insightData) => {
    return {
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
    };
  }) satisfies Prisma.InsightCreateInput[];

  // Insights aren't linked to any other models and don't have any frontend-mutable attributes, so we can just delete all of them and re-add them
  await prismaClient.insight.deleteMany();

  for (const newInsight of cleanedData) {
    await prismaClient.insight.create({
      data: newInsight,
    });
  }
}

export async function transformAndLoadOffenseData(data: unknown) {
  const parsedData = offenseImportSchema.parse(data);

  const cleanedData = parsedData.map((offenseData) => {
    return {
      stateCode: offenseData.state_code,
      name: offenseData.charge,
    };
  });

  const missingExistingOffenses = await prismaClient.offense.findMany({
    where: {
      NOT: {
        name: {
          in: cleanedData.map((offenseData) => offenseData.name),
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

  await prismaClient.offense.createMany({
    // If an offense already exists, skip it because its just a name and there's no other data to update
    skipDuplicates: true,
    data: cleanedData,
  });
}
