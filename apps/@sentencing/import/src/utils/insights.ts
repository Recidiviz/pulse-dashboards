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

import z from "zod";

import { insightImportSchema } from "~@sentencing/import/models";
import { Prisma, PrismaClient } from "~@sentencing/prisma/client";

type TransformedRecidivismSeries = {
  recommendationType: string | undefined;
  // Match the schema defaults so the values are identical to what is stored
  // after the DB round-trip, enabling reliable key-based correlation.
  sentenceLengthBucketStart: number;
  sentenceLengthBucketEnd: number;
  dataPoints: Prisma.RecidvismSeriesDataPointCreateManyRecidivismSeriesInput[];
};

// Schema defaults for sentenceLengthBucketStart / sentenceLengthBucketEnd.
// 0 to -1 represents an unbounded range (0 to infinity), used when no
// sentence-length bucket is specified (e.g. flat types like Probation/Rider).
const BUCKET_START_DEFAULT = 0;
const BUCKET_END_DEFAULT = -1;

function transformRecidivismSeries(
  rawRecidivismSeries: z.infer<typeof insightImportSchema>["recidivism_series"],
): TransformedRecidivismSeries[] {
  return rawRecidivismSeries
    .map((series) => {
      if (series.data_points === undefined) {
        return undefined;
      }

      return {
        recommendationType: series.sentence_type,
        sentenceLengthBucketStart:
          series.sentence_length_bucket_start ?? BUCKET_START_DEFAULT,
        sentenceLengthBucketEnd:
          series.sentence_length_bucket_end ?? BUCKET_END_DEFAULT,
        dataPoints: series.data_points.map((s) => ({
          cohortMonths: s.cohort_months,
          eventRate: s.event_rate,
          lowerCI: s.lower_ci,
          upperCI: s.upper_ci,
        })),
      };
    })
    .filter((v) => v !== undefined);
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

  // Load new insight data.
  // We do this in a for loop instead of Promise.all to avoid a prisma pool connection error.
  for await (const insightData of data) {
    // Look up the offense by name — offenses are imported before insights,
    // so they should already exist. If not, skip this insight with a warning.
    const offense = await prismaClient.offense.findUnique({
      where: {
        stateCode: insightData.state_code,
        name: insightData.most_severe_description,
      },
    });

    if (!offense) {
      console.warn(
        `Skipping insight: no matching offense found for "${insightData.most_severe_description}" (state: ${insightData.state_code})`,
      );
      continue;
    }

    // Since the data has been validated, delete the existing insight and insert the new one
    // so that all stale recidivism and disposition records are deleted via cascade.
    await prismaClient.insight
      .delete({
        where: {
          gender_offenseId_assessmentScoreBucketStart_assessmentScoreBucketEnd:
            {
              gender: insightData.gender,
              offenseId: offense.id,
              assessmentScoreBucketStart:
                insightData.assessment_score_bucket_start,
              assessmentScoreBucketEnd: insightData.assessment_score_bucket_end,
            },
        },
      })
      .catch(() => {
        // Catch any errors — it's possible the insight doesn't exist yet.
      });

    // Create the insight without nested data. Prisma wraps nested creates (e.g. createMany
    // inside create) in an implicit interactive transaction, which times out for large datasets
    // like ND. By separating the creates, each operation is its own small transaction.
    const createdInsight = await prismaClient.insight.create({
      data: {
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
        rollupOffenseName:
          insightData.recidivism_rollup.most_severe_description,
        rollupNcicCategory:
          insightData.recidivism_rollup.most_severe_ncic_category_uniform,
        rollupCombinedOffenseCategory:
          insightData.recidivism_rollup.combined_offense_category,
        rollupViolentOffense:
          insightData.recidivism_rollup.any_is_violent_uniform,
        rollupRecidivismNumRecords: insightData.recidivism_num_records,
        // If this is missing, assume it is zero
        dispositionNumRecords: insightData.disposition_num_records ?? 0,
      },
    });

    // Create dispositions separately using createMany (no nesting, no implicit transaction).
    await prismaClient.disposition.createMany({
      data: transformDispositions(insightData.dispositions).map((d) => ({
        ...d,
        insightId: createdInsight.id,
      })),
    });

    // Use createManyAndReturn to bulk-insert all series in one query and get back
    // their IDs, then bulk-insert all data points in one more query. This avoids
    // the 2-round-trips-per-series pattern that caused connection termination on
    // large datasets like ND.
    const recidivismSeries = transformRecidivismSeries(
      insightData.recidivism_series,
    );

    const createdSeries =
      await prismaClient.recidivismSeries.createManyAndReturn({
        data: recidivismSeries.map((series) => ({
          recommendationType: series.recommendationType,
          sentenceLengthBucketStart: series.sentenceLengthBucketStart,
          sentenceLengthBucketEnd: series.sentenceLengthBucketEnd,
          insightId: createdInsight.id,
        })),
      });

    // createManyAndReturn does not guarantee return order, so match each
    // created series back to its input by composite natural key rather than
    // by index position. Both sides are always numbers after transformRecidivismSeries
    // normalizes missing bucket values to their schema defaults.
    const seriesKey = (s: {
      recommendationType: string | null | undefined;
      sentenceLengthBucketStart: number;
      sentenceLengthBucketEnd: number;
    }) =>
      `${s.recommendationType ?? null}|${s.sentenceLengthBucketStart}|${s.sentenceLengthBucketEnd}`;

    const seriesIdByKey = new Map(
      createdSeries.map((s) => [seriesKey(s), s.id]),
    );

    await prismaClient.recidvismSeriesDataPoint.createMany({
      data: recidivismSeries.flatMap((series) => {
        const seriesId = seriesIdByKey.get(seriesKey(series));
        if (!seriesId) {
          console.warn(
            `Skipping data points: no created series found for key "${seriesKey(series)}"`,
          );
          return [];
        }
        return series.dataPoints.map((dp) => ({
          ...dp,
          recidivismSeriesId: seriesId,
        }));
      }),
    });

    newInsights.push(createdInsight);
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
