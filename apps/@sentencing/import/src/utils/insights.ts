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

import { Prisma, PrismaClient } from "@prisma/sentencing-server/client";
import z from "zod";

import { insightImportSchema } from "~@sentencing/import/models";

function transformRecidivismSeries(
  rawRecidivismSeries: z.infer<typeof insightImportSchema>["recidivism_series"],
) {
  return rawRecidivismSeries
    .map((series) => {
      if (series.data_points === undefined) {
        return undefined;
      }

      return {
        recommendationType: series.sentence_type,
        sentenceLengthBucketStart: series.sentence_length_bucket_start,
        sentenceLengthBucketEnd: series.sentence_length_bucket_end,
        dataPoints: {
          createMany: {
            data: series.data_points.map((s) => ({
              cohortMonths: s.cohort_months,
              eventRate: s.event_rate,
              lowerCI: s.lower_ci,
              upperCI: s.upper_ci,
            })),
          },
        },
      };
    })
    .filter(
      (v) => v !== undefined,
    ) satisfies Prisma.RecidivismSeriesCreateWithoutInsightInput[];
}

function transformDispositions(
  dispositions: z.infer<typeof insightImportSchema>["dispositions"],
) {
  return dispositions.map((v) => ({
    recommendationType: v.sentence_type,
    sentenceLengthBucketStart: v.sentence_length_bucket_start,
    sentenceLengthBucketEnd: v.sentence_length_bucket_end,
    percentage: v.percentage,
  })) satisfies Prisma.DispositionCreateManyInsightInput[];
}

export async function transformAndLoadInsightData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof insightImportSchema>>,
) {
  const newInsights = [];

  // Load new insight data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const insightData of data) {
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
        create: transformRecidivismSeries(insightData.recidivism_series),
      },
      // If this missing, assume it is zero
      dispositionNumRecords: insightData.disposition_num_records ?? 0,
      dispositionData: {
        create: transformDispositions(insightData.dispositions),
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
