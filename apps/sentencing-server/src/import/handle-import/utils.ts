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

import { Gender, Prisma } from "@prisma/sentencing-server/client";
import { captureException } from "@sentry/node";
import _ from "lodash";
import z from "zod";

import { PLACEHOLDER_SIGNIFIER } from "~@sentencing-server/prisma";
import { getPrismaClientForStateCode } from "~@sentencing-server/prisma";
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

// Function definition pulled from https://zod.dev/?id=writing-generic-functions
function parseData<T extends z.ZodTypeAny>(
  datum: unknown,
  schema: T,
  errors: string[],
) {
  try {
    // See https://zod.dev/?id=inferring-the-inferred-type for why we need to cast to z.infer<T>
    return schema.parse(datum) as z.infer<T>;
  } catch (e) {
    errors.push(
      `\nError parsing data:\nData: ${JSON.stringify(datum, null, 2)}\nError: ${e}`,
    );
  }
  return undefined;
}

export async function transformAndLoadClientData(
  stateCode: string,
  data: AsyncGenerator<unknown>,
) {
  const prismaClient = getPrismaClientForStateCode(stateCode);
  const errors: string[] = [];

  const existingCases = await prismaClient.case.findMany({
    select: { externalId: true },
  });

  // Load new client data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const datum of data) {
    const clientData = parseData(datum, clientImportSchema, errors);
    if (!clientData) {
      continue;
    }

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

  if (errors.length > 0) {
    throw errors.join("\n");
  }
}

export async function transformAndLoadStaffData(
  stateCode: string,
  data: AsyncGenerator<unknown>,
) {
  const prismaClient = getPrismaClientForStateCode(stateCode);
  const errors: string[] = [];

  const existingCases = await prismaClient.case.findMany({
    select: { externalId: true },
  });

  // Load new staff data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const datum of data) {
    const staffData = parseData(datum, staffImportSchema, errors);
    if (!staffData) {
      continue;
    }

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

    // Load data
    await prismaClient.staff.upsert({
      where: {
        externalId: newStaff.externalId,
      },
      create: newStaff,
      update: newStaff,
    });
  }

  if (errors.length > 0) {
    throw errors.join("\n");
  }
}

export async function transformAndLoadCaseData(
  stateCode: string,
  data: AsyncGenerator<unknown>,
) {
  const prismaClient = getPrismaClientForStateCode(stateCode);
  const errors: string[] = [];

  // Load new case data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const datum of data) {
    const caseData = parseData(datum, caseImportSchema, errors);
    if (!caseData) {
      continue;
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
      county: caseData.county,
      district: caseData.district,
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

  if (errors.length > 0) {
    throw errors.join("\n");
  }
}

export async function transformAndLoadOpportunityData(
  stateCode: string,
  data: AsyncGenerator<unknown>,
) {
  const prismaClient = getPrismaClientForStateCode(stateCode);
  const errors: string[] = [];

  const newOpportunities = [];

  // Load new opportunity data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const datum of data) {
    const opportunityData = parseData(datum, opportunityImportSchema, errors);
    if (!opportunityData) {
      continue;
    }

    // If the status is explicitly inactive, set it to inactive, otherwise set it true
    const active = opportunityData.status === "Inactive" ? false : true;

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
        "counties",
      ]),
      opportunityName: opportunityData.OpportunityName,
      description: opportunityData.Description,
      // We need to use the default provider name if the provider name is empty because prisma
      // doesn't allow for nulls in composite unique fields
      providerName: opportunityData.ProviderName,
      providerPhoneNumber: opportunityData.CleanedProviderPhoneNumber,
      providerWebsite: opportunityData.ProviderWebsite,
      providerAddress: opportunityData.ProviderAddress,
      needsAddressed: opportunityData.NeedsAddressed,
      genders: opportunityData.genders ?? [],
      lastUpdatedAt: opportunityData.lastUpdatedDate,
      active,
    };

    // Load data
    const newCreatedOpportunity = await prismaClient.opportunity.upsert({
      where: {
        opportunityName_providerName: {
          opportunityName: newOpportunity.opportunityName,
          providerName: newOpportunity.providerName,
        },
      },
      create: newOpportunity,
      update: newOpportunity,
    });

    newOpportunities.push(newCreatedOpportunity);
  }

  if (errors.length > 0) {
    throw errors.join("\n");
  }

  // Delete all of the old opportunities that weren't just loaded if we haven't hit any errors
  await prismaClient.opportunity.deleteMany({
    where: {
      NOT: {
        id: {
          in: newOpportunities.map((opportunity) => opportunity.id),
        },
      },
    },
  });
}

function transformRecidivismSeries(
  recommendationType: string,
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
  const dispositions: Prisma.DispositionCreateManyInsightInput[] = [];

  if (data.disposition_probation_pc) {
    dispositions.push({
      recommendationType: "Probation",
      percentage: data.disposition_probation_pc,
    });
  }
  if (data.disposition_rider_pc) {
    dispositions.push({
      recommendationType: "Rider",
      percentage: data.disposition_rider_pc,
    });
  }
  if (data.disposition_term_pc) {
    dispositions.push({
      recommendationType: "Term",
      percentage: data.disposition_term_pc,
    });
  }

  return dispositions;
}

export async function transformAndLoadInsightData(
  stateCode: string,
  data: AsyncGenerator<unknown>,
) {
  const prismaClient = getPrismaClientForStateCode(stateCode);
  const errors: string[] = [];

  const newInsights = [];

  // Load new insight data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const datum of data) {
    const insightData = parseData(datum, insightImportSchema, errors);
    if (!insightData) {
      continue;
    }

    // Create the offense if it doesn't already exist in the db
    const offense = await prismaClient.offense.upsert({
      where: {
        stateCode: insightData.state_code,
        name: insightData.most_severe_description,
      },
      create: {
        stateCode: insightData.state_code,
        name: insightData.most_severe_description,
      },
      update: {},
    });

    const newInsight = {
      stateCode: insightData.state_code,
      gender: insightData.gender,
      offense: {
        connect: {
          id: offense.id,
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
      rollupViolentOffense:
        insightData.recidivism_rollup.any_is_violent_uniform,
      rollupRecidivismNumRecords: insightData.recidivism_num_records,
      rollupRecidivismSeries: {
        create: transformAllRecidivismSeries(insightData),
      },
      // If this missing, assume it is zero
      dispositionNumRecords: insightData.disposition_num_records ?? 0,
      dispositionData: {
        create: transformDispositions(insightData),
      },
    } satisfies Prisma.InsightCreateInput;

    // Since the data has been validated, delete the existing insight and insert the new one so that all of stale recidivism and disposition records are deleted
    await prismaClient.insight
      .delete({
        where: {
          gender_offenseId_assessmentScoreBucketStart_assessmentScoreBucketEnd:
            {
              gender: newInsight.gender,
              offenseId: newInsight.offense.connect.id,
              assessmentScoreBucketStart: newInsight.assessmentScoreBucketStart,
              assessmentScoreBucketEnd: newInsight.assessmentScoreBucketEnd,
            },
        },
      })
      .catch(() => {
        // Catch an errors - it's possible that the insight doesn't exist in the database yet, so we don't want to throw an error if that's the case
      });

    const newCreatedInsight = await prismaClient.insight.create({
      data: newInsight,
    });

    newInsights.push(newCreatedInsight);
  }

  if (errors.length > 0) {
    throw errors.join("\n");
  }

  // Delete all of the old insights that weren't just loaded if we haven't hit any errors
  await prismaClient.insight.deleteMany({
    where: {
      NOT: {
        id: {
          in: newInsights.map((insight) => insight.id),
        },
      },
    },
  });
}

export async function transformAndLoadOffenseData(
  stateCode: string,
  data: AsyncGenerator<unknown>,
) {
  const prismaClient = getPrismaClientForStateCode(stateCode);
  const errors: string[] = [];

  const newOffenseNames = [];

  for await (const datum of data) {
    const offenseData = parseData(datum, offenseImportSchema, errors);
    if (!offenseData) {
      continue;
    }

    const newOffense = {
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
      frequency: offenseData.frequency,
    };

    newOffenseNames.push(newOffense.name);

    // Load data
    await prismaClient.offense.upsert({
      where: {
        name: newOffense.name,
      },
      create: newOffense,
      update: newOffense,
    });
  }

  if (errors.length > 0) {
    throw errors.join("\n");
  }

  const missingExistingOffenses = await prismaClient.offense.findMany({
    where: {
      NOT: [
        {
          name: {
            in: newOffenseNames,
          },
        },
        {
          name: {
            contains: PLACEHOLDER_SIGNIFIER,
          },
        },
      ],
    },
  });
  // If there are any non-placeholder offenses in the database that aren't in the data import, log an error
  if (missingExistingOffenses.length > 0) {
    captureException(
      `Error when importing offenses! These offenses exist in the database but are missing from the data import: ${missingExistingOffenses.map((offense) => offense.name).join(", ")}`,
    );
  }
}
