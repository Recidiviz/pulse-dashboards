// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { timeServedImportSchema } from "~@sentencing/import/models";
import { PrismaClient } from "~@sentencing/prisma/client";

// Only import rows where the 95% confidence interval is within this threshold.
// Rows with wider CIs have too few elapsed sentences to be statistically reliable.
const MAX_CI95 = 15;

const ASSESSMENT_LEVEL_TO_BUCKET: Record<string, number> = {
  LOW: 0,
  // LOW_MEDIUM falls within MO's raw MEDIUM score range
  LOW_MEDIUM: 1,
  MEDIUM: 1,
  HIGH: 2,
  VERY_HIGH: 3,
  // null assessment_level (no ORAS score on file) maps to bucket -1
  null: -1,
};

export async function transformAndLoadTimeServedData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof timeServedImportSchema>>,
) {
  // Cache offense lookups to avoid redundant DB calls
  const offenseIdCache = new Map<string, string | null>();

  for await (const row of data) {
    if (row.ci95 == null || row.ci95 > MAX_CI95) continue;

    // Map assessment_level to the bucket values used in the insight model.
    const bucket = ASSESSMENT_LEVEL_TO_BUCKET[row.assessment_level ?? "null"];
    if (bucket === undefined) {
      console.warn(
        `Skipping time served row: unmappable assessment_level "${row.assessment_level}" for offense "${row.most_severe_description}"`,
      );
      continue;
    }

    const cacheKey = `${row.state_code}|${row.most_severe_description}`;
    if (!offenseIdCache.has(cacheKey)) {
      const offense = await prismaClient.offense.findUnique({
        where: { stateCode: row.state_code, name: row.most_severe_description },
      });
      if (!offense) {
        console.warn(
          `Skipping time served row: no matching offense found for "${row.most_severe_description}" (state: ${row.state_code})`,
        );
      }
      offenseIdCache.set(cacheKey, offense?.id ?? null);
    }

    const offenseId = offenseIdCache.get(cacheKey);
    if (!offenseId) continue;

    // Upsert the matching insight with time served data. If no insight exists
    // for this cohort yet, create a minimal one with the time served fields.
    await prismaClient.insight.upsert({
      where: {
        gender_offenseId_assessmentScoreBucketStart_assessmentScoreBucketEnd: {
          gender: row.sex,
          offenseId,
          assessmentScoreBucketStart: bucket,
          assessmentScoreBucketEnd: bucket,
        },
      },
      update: {
        avgSentenceLengthYears: row.avg_sentence_length_yrs,
        avgPctServed: row.avg_pct_served,
        timeServedNumRecords: row.n_elapsed,
      },
      create: {
        stateCode: row.state_code,
        gender: row.sex,
        offense: { connect: { id: offenseId } },
        assessmentScoreBucketStart: bucket,
        assessmentScoreBucketEnd: bucket,
        rollupStateCode: row.state_code,
        rollupRecidivismNumRecords: 0,
        dispositionNumRecords: 0,
        avgSentenceLengthYears: row.avg_sentence_length_yrs,
        avgPctServed: row.avg_pct_served,
        timeServedNumRecords: row.n_elapsed,
      },
    });
  }
}
