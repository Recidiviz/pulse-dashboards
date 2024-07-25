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

  const cleanedData = await Promise.all(
    parsedData.map(async (caseData) => {
      // Check if the staff and clients exist in the db - if not, we'll link
      // them later
      const staffId = (
        await prismaClient.staff.findUnique({
          where: { externalId: caseData.staff_id },
          select: { externalId: true },
        })
      )?.externalId;
      const clientId = (
        await prismaClient.client.findUnique({
          where: { externalId: caseData.client_id },
          select: { externalId: true },
        })
      )?.externalId;

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

  // Delete all of the old cases that weren't just loaded
  await prismaClient.case.deleteMany({
    where: {
      NOT: {
        externalId: {
          in: cleanedData.map((caseData) => caseData.externalId),
        },
      },
    },
  });
}

export async function transformAndLoadOpportunityData(data: unknown) {
  const parsedData = opportunityImportSchema.parse(data);

  const cleanedData = parsedData.map((opportunityData) => {
    return {
      ..._.pick(opportunityData, [
        "eighteenOrOlderCriterion",
        "developmentalDisabilityDiagnosisCriterion",
        "minorCriterion",
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
      ]),
      opportunityName: opportunityData.OpportunityName,
      description: opportunityData.Description,
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
        opportunityName_providerPhoneNumber: _.pick(newOpportunity, [
          "opportunityName",
          "providerPhoneNumber",
        ]),
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
            providerPhoneNumber: {
              in: _.map(cleanedData, "providerPhoneNumber"),
            },
          },
        ],
      },
    },
  });
}

function transformRecidivismSeries(
  recommendationType: CaseRecommendation,
  dataPoints: z.infer<typeof recidivismSeriesSchema>,
) {
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
  ] satisfies Prisma.RecidivismSeriesCreateWithoutInsightInput[];
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
      Offense: {
        connect: {
          name: insightData.most_severe_description,
        },
      },
      assessmentScoreBucketStart: insightData.assessment_score_bucket_start,
      assessmentScoreBucketEnd: insightData.assessment_score_bucket_end,
      recidivismRollupOffense: insightData.recidivism_rollup,
      recidivismNumRecords: insightData.recidivism_num_records,
      recidivismSeries: {
        create: transformAllRecidivismSeries(insightData),
      },
      dispositionNumRecords: insightData.disposition_num_records,
      dispositionData: {
        create: transformDispositions(insightData),
      },
    };
  });

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
