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
import {
  chunkForStatement,
  inBatches,
} from "~@sentencing/import/utils/batching";
import { Prisma, PrismaClient, StateCode } from "~@sentencing/prisma/client";

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

// Minimum cohort sample size required to show sentence distributions. Cohorts
// with fewer than this many records don't have a large enough sample to show
// reliable distributions, so we drop the disposition data at import time and
// zero out dispositionNumRecords. The frontend renders its "insufficient data"
// empty state whenever dispositionNumRecords is falsy. See OBT-36602.
const MIN_DISPOSITION_RECORDS = 10;

// The minimum sample size restriction currently only applies to US_MO. Whether
// to extend it to other states (e.g. ID, ND) is still being scoped (OBT-36603).
const STATES_WITH_DISPOSITION_MINIMUM: StateCode[] = [StateCode.US_MO];

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

// Insights per batch. Smaller than the shared default because each insight
// carries dozens of child rows.
const INSIGHT_BATCH_SIZE = 500;

type InsightImportRow = z.infer<typeof insightImportSchema>;

type InsightData = {
  data: Prisma.InsightCreateManyInput;
  dispositions: Prisma.DispositionCreateManyInsightInput[];
  recidivismSeries: TransformedRecidivismSeries[];
};

// Matches the Insight @@unique constraint.
const insightKey = (insight: {
  gender: string;
  offenseName: string;
  assessmentScoreBucketStart: number;
  assessmentScoreBucketEnd: number;
}) =>
  `${insight.gender}|${insight.offenseName}|${insight.assessmentScoreBucketStart}|${insight.assessmentScoreBucketEnd}`;

// Matches the RecidivismSeries @@unique constraint. The bucket values are
// always numbers, since transformRecidivismSeries fills in the schema defaults.
const seriesKey = (
  insightId: string,
  series: {
    recommendationType: string | null | undefined;
    sentenceLengthBucketStart: number;
    sentenceLengthBucketEnd: number;
  },
) =>
  `${insightId}|${series.recommendationType ?? null}|${series.sentenceLengthBucketStart}|${series.sentenceLengthBucketEnd}`;

function toInsightData(
  row: InsightImportRow,
  offenseId: string | undefined,
): InsightData {
  // Only show sentence distributions for cohorts with a large enough sample.
  // When a restricted state's cohort falls below the threshold, drop the
  // disposition data and report zero records so the frontend shows its empty
  // state instead. States without the restriction always keep their data.
  const dispositionNumRecords = row.disposition_num_records ?? 0;
  const hasSufficientDispositionData =
    !STATES_WITH_DISPOSITION_MINIMUM.includes(row.state_code) ||
    dispositionNumRecords >= MIN_DISPOSITION_RECORDS;

  return {
    data: {
      stateCode: row.state_code,
      gender: row.gender,
      offenseName: row.most_severe_description,
      offenseId,
      assessmentScoreBucketStart: row.assessment_score_bucket_start,
      assessmentScoreBucketEnd: row.assessment_score_bucket_end,
      rollupStateCode: row.recidivism_rollup.state_code,
      rollupGender: row.recidivism_rollup.gender,
      rollupAssessmentScoreBucketStart:
        row.recidivism_rollup.assessment_score_bucket_start,
      rollupAssessmentScoreBucketEnd:
        row.recidivism_rollup.assessment_score_bucket_end,
      rollupOffenseName: row.recidivism_rollup.most_severe_description,
      rollupNcicCategory:
        row.recidivism_rollup.most_severe_ncic_category_uniform,
      rollupCombinedOffenseCategory:
        row.recidivism_rollup.combined_offense_category,
      rollupViolentOffense: row.recidivism_rollup.any_is_violent_uniform,
      rollupRecidivismNumRecords: row.recidivism_num_records,
      // Below the minimum sample size, report zero records so the sentence
      // distribution is not shown.
      dispositionNumRecords: hasSufficientDispositionData
        ? dispositionNumRecords
        : 0,
      // Time served fields (avgSentenceLengthYears, avgPctServed, timeServedNumRecords)
      // are populated separately by the time served import — not by the insights import.
    },
    // Below-threshold cohorts store no distribution data at all.
    dispositions: hasSufficientDispositionData
      ? transformDispositions(row.dispositions)
      : [],
    recidivismSeries: transformRecidivismSeries(row.recidivism_series),
  };
}

/**
 * Writes one batch of insights and their child rows, with bulk writes per table
 * chunked to stay under the statement limits in batching.ts.
 */
async function loadInsightBatch(
  prismaClient: PrismaClient,
  batch: Map<string, InsightData>,
) {
  const insights = [...batch.values()];

  // Delete any existing insights for the same gender, offense, and assessment
  // score bucket so that their stale recidivism and disposition records are
  // deleted via cascade.
  await prismaClient.insight.deleteMany({
    where: {
      OR: insights.map(({ data }) => ({
        gender: data.gender,
        offenseName: data.offenseName,
        assessmentScoreBucketStart: data.assessmentScoreBucketStart,
        assessmentScoreBucketEnd: data.assessmentScoreBucketEnd,
      })),
    },
  });

  const createdInsights = await prismaClient.insight.createManyAndReturn({
    data: insights.map(({ data }) => data),
    select: {
      id: true,
      gender: true,
      offenseName: true,
      assessmentScoreBucketStart: true,
      assessmentScoreBucketEnd: true,
    },
  });
  // createManyAndReturn does not guarantee return order, so created rows are
  // matched back to their input by gender, offense, and assessment score bucket
  // rather than by index position.
  const loaded = createdInsights.flatMap((insight) => {
    const match = batch.get(insightKey(insight));
    return match ? [{ ...match, insightId: insight.id }] : [];
  });

  const dispositions = loaded.flatMap(({ dispositions, insightId }) =>
    dispositions.map((d) => ({ ...d, insightId })),
  );
  for (const chunk of chunkForStatement(dispositions, 6)) {
    // eslint-disable-next-line no-await-in-loop -- one statement at a time keeps load on the database low
    await prismaClient.disposition.createMany({ data: chunk });
  }

  const seriesToCreate = loaded.flatMap(({ recidivismSeries, insightId }) =>
    recidivismSeries.map((series) => ({
      recommendationType: series.recommendationType,
      sentenceLengthBucketStart: series.sentenceLengthBucketStart,
      sentenceLengthBucketEnd: series.sentenceLengthBucketEnd,
      insightId,
    })),
  );
  const createdSeries = [];
  for (const chunk of chunkForStatement(seriesToCreate, 5)) {
    createdSeries.push(
      // eslint-disable-next-line no-await-in-loop -- one statement at a time keeps load on the database low
      ...(await prismaClient.recidivismSeries.createManyAndReturn({
        data: chunk,
      })),
    );
  }
  const seriesIdByKey = new Map(
    createdSeries.map((s) => [seriesKey(s.insightId, s), s.id]),
  );

  const dataPoints = loaded.flatMap(({ recidivismSeries, insightId }) =>
    recidivismSeries.flatMap((series) => {
      const recidivismSeriesId = seriesIdByKey.get(
        seriesKey(insightId, series),
      );
      if (!recidivismSeriesId) {
        console.warn(
          `Skipping data points: no created series found for key "${seriesKey(insightId, series)}"`,
        );
        return [];
      }
      return series.dataPoints.map((dp) => ({ ...dp, recidivismSeriesId }));
    }),
  );
  for (const chunk of chunkForStatement(dataPoints, 6)) {
    // eslint-disable-next-line no-await-in-loop -- one statement at a time keeps load on the database low
    await prismaClient.recidvismSeriesDataPoint.createMany({ data: chunk });
  }
}

/** Exported so tests can pass a small batch size. */
export async function loadInsightsInBatches(
  prismaClient: PrismaClient,
  data: AsyncGenerator<InsightImportRow>,
  { linkToOffense }: { linkToOffense: boolean },
  batchSize = INSIGHT_BATCH_SIZE,
) {
  // Every insight that exists before this import is either replaced by a batch
  // below or stale, so all of them are deleted once the import succeeds.
  const existingInsightIds = (
    await prismaClient.insight.findMany({ select: { id: true } })
  ).map(({ id }) => id);

  // PSI imports offenses before insights, so load them all once rather than
  // looking one up per row.
  const offenses = linkToOffense
    ? await prismaClient.offense.findMany({
        select: { id: true, name: true, stateCode: true },
      })
    : [];
  const offenseIdByStateAndName = new Map(
    offenses.map((o) => [`${o.stateCode}|${o.name}`, o.id]),
  );

  for await (const rows of inBatches(data, batchSize)) {
    // Keyed by gender, offense, and assessment score bucket, so a repeated row
    // within a batch replaces the earlier one instead of violating the unique
    // constraint.
    const batch = new Map<string, InsightData>();
    for (const row of rows) {
      // If the offense is missing, skip this insight with a warning.
      const offenseId = offenseIdByStateAndName.get(
        `${row.state_code}|${row.most_severe_description}`,
      );
      if (linkToOffense && !offenseId) {
        console.warn(
          `Skipping insight: no matching offense found for "${row.most_severe_description}" (state: ${row.state_code})`,
        );
        continue;
      }
      const insight = toInsightData(row, offenseId);
      batch.set(insightKey(insight.data), insight);
    }

    if (batch.size > 0) {
      await loadInsightBatch(prismaClient, batch);
    }
  }

  // Delete the old insights now that the new ones loaded without errors. Any a
  // batch already replaced are gone and simply match nothing.
  for (const ids of chunkForStatement(existingInsightIds, 1)) {
    // eslint-disable-next-line no-await-in-loop -- one delete at a time keeps load on the database low
    await prismaClient.insight.deleteMany({ where: { id: { in: ids } } });
  }
}

/** Loads PSI insights, linking each to the Offense with the same name. */
export async function transformAndLoadInsightData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<InsightImportRow>,
) {
  await loadInsightsInBatches(prismaClient, data, { linkToOffense: true });
}

/**
 * Loads SAR insights. SAR doesn't import offenses, so these insights aren't
 * linked to an Offense and are looked up by offense name instead.
 */
export async function transformAndLoadSARInsightData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<InsightImportRow>,
) {
  await loadInsightsInBatches(prismaClient, data, { linkToOffense: false });
}
