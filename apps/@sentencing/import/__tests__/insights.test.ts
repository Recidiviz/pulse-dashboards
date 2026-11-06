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

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { INSIGHTS_FILE_NAME } from "~@sentencing/import/constants";
import { getImportHandler } from "~@sentencing/import/handler";
import { insightImportSchema } from "~@sentencing/import/models";
import {
  createFakeDispositionsForImport,
  createFakeRecidivismSeriesForImport,
} from "~@sentencing/import/test/common/utils";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import {
  TEST_INSIGHTS_FILE_NAME,
  TEST_STATE_CODE,
} from "~@sentencing/import/test/setup/constants";
import {
  fakeInsight,
  fakeInsightId,
  fakeOffense,
} from "~@sentencing/import/test/setup/seed";
import {
  importFile,
  ImportRowOverrides,
} from "~@sentencing/import/test/setup/utils";
import { loadInsightsInBatches } from "~@sentencing/import/utils/insights";
import { Gender, StateCode } from "~@sentencing/prisma/client";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

/** Imports one US_MO insight for "mo-offense" through the SAR loaders. */
async function importMOInsight(
  overrides: ImportRowOverrides<typeof insightImportSchema> = {},
) {
  await importFile(
    INSIGHTS_FILE_NAME,
    [
      {
        state_code: StateCode.US_MO,
        gender: Gender.MALE,
        assessment_score_bucket_start: 1,
        assessment_score_bucket_end: 1,
        most_severe_description: "mo-offense",
        recidivism_rollup: JSON.stringify({ state_code: StateCode.US_MO }),
        recidivism_num_records: faker.number.int({ max: 100 }),
        recidivism_series: createFakeRecidivismSeriesForImport([
          { sentence_type: "Probation" },
        ]),
        disposition_num_records: 10,
        dispositions: createFakeDispositionsForImport([
          { sentence_type: "Probation" },
        ]),
        ...overrides,
      },
    ],
    StateCode.US_MO,
  );
}

function createInsightImportRow({
  gender = Gender.MALE,
  assessmentScoreBucketStart,
  assessmentScoreBucketEnd,
  recidivismNumRecords = faker.number.int({ max: 100 }),
  sentenceType = "Probation",
}: {
  gender?: Gender;
  assessmentScoreBucketStart: number;
  assessmentScoreBucketEnd: number;
  recidivismNumRecords?: number;
  sentenceType?: string;
}) {
  return {
    state_code: StateCode.US_ID,
    gender,
    assessment_score_bucket_start: assessmentScoreBucketStart,
    assessment_score_bucket_end: assessmentScoreBucketEnd,
    most_severe_description: fakeOffense.name,
    recidivism_rollup: JSON.stringify({ state_code: StateCode.US_ID }),
    recidivism_num_records: recidivismNumRecords,
    recidivism_series: createFakeRecidivismSeriesForImport([
      { sentence_type: sentenceType },
    ]),
    disposition_num_records: faker.number.int({ max: 100 }),
    dispositions: createFakeDispositionsForImport([
      { sentence_type: sentenceType },
    ]),
  };
}

describe("import insight data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should import new insights and delete old data", async () => {
    // Create the second offense so insights can link to it
    await testPrismaClient.offense.create({
      data: {
        stateCode: StateCode.US_ID,
        name: "another-offense",
      },
    });

    dataProviderSingleton.setData(TEST_INSIGHTS_FILE_NAME, [
      // New insights
      {
        state_code: StateCode.US_ID,
        // We use MALE because the existing insight uses FEMALE, so there is no chance of a collision
        gender: Gender.MALE,
        assessment_score_bucket_start: faker.number.int({ max: 100 }),
        assessment_score_bucket_end: faker.number.int({ max: 100 }),
        most_severe_description: fakeOffense.name,
        recidivism_rollup: JSON.stringify({
          state_code: StateCode.US_ID,
          gender: Gender.MALE,
          assessment_score_bucket_start: faker.number.int({ max: 100 }),
          assessment_score_bucket_end: faker.number.int({ max: 100 }),
          most_severe_ncic_category_uniform: faker.string.alpha(),
        }),
        recidivism_num_records: faker.number.int({ max: 100 }),
        recidivism_series: createFakeRecidivismSeriesForImport([
          {
            sentence_type: "Probation",
          },
        ]),
        disposition_num_records: faker.number.int({ max: 100 }),
        dispositions: createFakeDispositionsForImport([
          {
            sentence_type: "Probation",
          },
        ]),
      },
      {
        state_code: StateCode.US_ID,
        gender: Gender.MALE,
        assessment_score_bucket_start: faker.number.int({ max: 100 }),
        assessment_score_bucket_end: faker.number.int({ max: 100 }),
        most_severe_description: "another-offense",
        recidivism_rollup: JSON.stringify({
          state_code: StateCode.US_ID,
          any_is_violent_uniform: true,
        }),
        recidivism_num_records: faker.number.int({ max: 100 }),
        recidivism_series: createFakeRecidivismSeriesForImport([
          {
            sentence_type: "Probation",
          },
        ]),
        disposition_num_records: faker.number.int({ max: 100 }),
        dispositions: createFakeDispositionsForImport([
          {
            sentence_type: "Probation",
          },
        ]),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [INSIGHTS_FILE_NAME]);

    // Check that the new Insights were created
    const dbInsights = await testPrismaClient.insight.findMany({
      include: {
        rollupRecidivismSeries: {
          select: {
            recommendationType: true,
            dataPoints: true,
          },
        },
        dispositionData: true,
      },
    });

    // There should be two insights in the database - just the two new ones
    expect(dbInsights).toHaveLength(2);

    expect(dbInsights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gender: "MALE",
          rollupStateCode: StateCode.US_ID,
          rollupGender: Gender.MALE,
          rollupAssessmentScoreBucketStart: expect.any(Number),
          rollupAssessmentScoreBucketEnd: expect.any(Number),
          rollupNcicCategory: expect.any(String),
          rollupRecidivismNumRecords: expect.any(Number),
          rollupRecidivismSeries: expect.arrayContaining([
            expect.objectContaining({
              recommendationType: "Probation",
              dataPoints: expect.arrayContaining([
                expect.objectContaining({}),
                expect.objectContaining({}),
              ]),
            }),
          ]),
          dispositionNumRecords: expect.any(Number),
          dispositionData: expect.arrayContaining([
            expect.objectContaining({ recommendationType: "Probation" }),
          ]),
        }),
        expect.objectContaining({
          gender: "MALE",
          rollupStateCode: StateCode.US_ID,
          rollupViolentOffense: true,
          rollupRecidivismNumRecords: expect.any(Number),
          rollupRecidivismSeries: expect.arrayContaining([
            // There should be two data points for each series
            expect.objectContaining({
              recommendationType: "Probation",
              dataPoints: expect.arrayContaining([
                expect.objectContaining({}),
                expect.objectContaining({}),
              ]),
            }),
          ]),
          dispositionNumRecords: expect.any(Number),
          dispositionData: expect.arrayContaining([
            expect.objectContaining({ recommendationType: "Probation" }),
          ]),
        }),
      ]),
    );
  });

  test("should drop US_MO sentence distributions below the minimum sample size", async () => {
    // The minimum sample size restriction currently only applies to US_MO.
    // Fewer than the minimum of 10 records — distributions should be dropped.
    await importMOInsight({ disposition_num_records: 9 });

    const dbInsights = await testPrismaClient.insight.findMany({
      include: { dispositionData: true },
    });

    expect(dbInsights).toHaveLength(1);
    // Records are zeroed out so the frontend renders its empty state, and no
    // disposition rows are stored.
    expect(dbInsights[0].dispositionNumRecords).toBe(0);
    expect(dbInsights[0].dispositionData).toHaveLength(0);
  });

  test("should keep US_MO sentence distributions at exactly the minimum sample size", async () => {
    // The minimum sample size restriction currently only applies to US_MO.
    // Exactly the minimum of 10 records — distributions should be kept.
    await importMOInsight({ disposition_num_records: 10 });

    const dbInsights = await testPrismaClient.insight.findMany({
      include: { dispositionData: true },
    });

    expect(dbInsights).toHaveLength(1);
    expect(dbInsights[0].dispositionNumRecords).toBe(10);
    expect(dbInsights[0].dispositionData).toHaveLength(1);
  });

  test("should keep non-US_MO sentence distributions below the minimum sample size", async () => {
    dataProviderSingleton.setData(TEST_INSIGHTS_FILE_NAME, [
      {
        state_code: StateCode.US_ID,
        gender: Gender.MALE,
        assessment_score_bucket_start: faker.number.int({ max: 100 }),
        assessment_score_bucket_end: faker.number.int({ max: 100 }),
        most_severe_description: fakeOffense.name,
        recidivism_rollup: JSON.stringify({
          state_code: StateCode.US_ID,
        }),
        recidivism_num_records: faker.number.int({ max: 100 }),
        recidivism_series: createFakeRecidivismSeriesForImport([
          { sentence_type: "Probation" },
        ]),
        // Below the threshold, but US_ID is not restricted so data is kept.
        disposition_num_records: 9,
        dispositions: createFakeDispositionsForImport([
          { sentence_type: "Probation" },
        ]),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [INSIGHTS_FILE_NAME]);

    const dbInsights = await testPrismaClient.insight.findMany({
      include: { dispositionData: true },
    });

    expect(dbInsights).toHaveLength(1);
    expect(dbInsights[0].dispositionNumRecords).toBe(9);
    expect(dbInsights[0].dispositionData).toHaveLength(1);
  });

  test("should skip insights with no matching offense", async () => {
    dataProviderSingleton.setData(TEST_INSIGHTS_FILE_NAME, [
      {
        state_code: StateCode.US_ID,
        gender: Gender.MALE,
        assessment_score_bucket_start: faker.number.int({ max: 100 }),
        assessment_score_bucket_end: faker.number.int({ max: 100 }),
        most_severe_description: "nonexistent-offense",
        recidivism_rollup: JSON.stringify({
          state_code: StateCode.US_ID,
        }),
        recidivism_num_records: faker.number.int({ max: 100 }),
        recidivism_series: createFakeRecidivismSeriesForImport([
          { sentence_type: "Probation" },
        ]),
        disposition_num_records: faker.number.int({ max: 100 }),
        dispositions: createFakeDispositionsForImport([
          { sentence_type: "Probation" },
        ]),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [INSIGHTS_FILE_NAME]);

    const dbInsights = await testPrismaClient.insight.findMany();
    // The seeded insight should be deleted and the new one skipped (no matching offense)
    expect(dbInsights).toHaveLength(0);

    // No orphaned offense should have been created
    const offenses = await testPrismaClient.offense.findMany({
      where: { name: "nonexistent-offense" },
    });
    expect(offenses).toHaveLength(0);
  });

  test("should load SAR insights without linking them to an Offense", async () => {
    await importMOInsight();

    const dbInsights = await testPrismaClient.insight.findMany();
    expect(dbInsights).toHaveLength(1);
    expect(dbInsights[0]).toEqual(
      expect.objectContaining({ offenseName: "mo-offense", offenseId: null }),
    );
    expect(
      await testPrismaClient.offense.findUnique({
        where: { name: "mo-offense" },
      }),
    ).toBeNull();
  });

  test("should handle data without sentence lengths", async () => {
    dataProviderSingleton.setData(TEST_INSIGHTS_FILE_NAME, [
      // New insights
      {
        state_code: StateCode.US_ID,
        // We use MALE because the existing insight uses FEMALE, so there is no chance of a collision
        gender: Gender.MALE,
        assessment_score_bucket_start: faker.number.int({ max: 100 }),
        assessment_score_bucket_end: faker.number.int({ max: 100 }),
        most_severe_description: fakeOffense.name,
        recidivism_rollup: JSON.stringify({
          state_code: StateCode.US_ID,
          gender: Gender.MALE,
          assessment_score_bucket_start: faker.number.int({ max: 100 }),
          assessment_score_bucket_end: faker.number.int({ max: 100 }),
          most_severe_ncic_category_uniform: faker.string.alpha(),
        }),
        recidivism_num_records: faker.number.int({ max: 100 }),
        recidivism_series: createFakeRecidivismSeriesForImport([
          {
            sentence_type: "Probation",
          },
          {
            sentence_type: "Term",
          },
          {
            sentence_type: "Rider",
          },
        ]),
        disposition_num_records: faker.number.int({ max: 100 }),
        dispositions: createFakeDispositionsForImport([
          {
            sentence_type: "Probation",
          },
          {
            sentence_type: "Term",
          },
          {
            sentence_type: "Rider",
          },
        ]),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [INSIGHTS_FILE_NAME]);

    // Check that the new Insights were created
    const dbInsights = await testPrismaClient.insight.findMany({
      include: {
        rollupRecidivismSeries: {
          select: {
            recommendationType: true,
            sentenceLengthBucketEnd: true,
            sentenceLengthBucketStart: true,
            dataPoints: true,
          },
        },
        dispositionData: true,
      },
    });

    expect(dbInsights).toHaveLength(1);

    expect(dbInsights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rollupRecidivismSeries: expect.arrayContaining([
            expect.objectContaining({
              recommendationType: "Probation",
              dataPoints: expect.arrayContaining([
                expect.objectContaining({}),
                expect.objectContaining({}),
              ]),
            }),
            expect.objectContaining({
              recommendationType: "Term",
              dataPoints: expect.arrayContaining([
                expect.objectContaining({}),
                expect.objectContaining({}),
              ]),
            }),
            expect.objectContaining({
              recommendationType: "Rider",
              dataPoints: expect.arrayContaining([
                expect.objectContaining({}),
                expect.objectContaining({}),
              ]),
            }),
          ]),
          dispositionData: expect.arrayContaining([
            expect.objectContaining({ recommendationType: "Probation" }),
            expect.objectContaining({ recommendationType: "Term" }),
            expect.objectContaining({ recommendationType: "Rider" }),
          ]),
        }),
      ]),
    );
  });

  test("should handle recidivism series without sentence type", async () => {
    dataProviderSingleton.setData(TEST_INSIGHTS_FILE_NAME, [
      // New insights
      {
        state_code: StateCode.US_ID,
        // We use MALE because the existing insight uses FEMALE, so there is no chance of a collision
        gender: Gender.MALE,
        assessment_score_bucket_start: faker.number.int({ max: 100 }),
        assessment_score_bucket_end: faker.number.int({ max: 100 }),
        most_severe_description: fakeOffense.name,
        recidivism_rollup: JSON.stringify({
          state_code: StateCode.US_ID,
          gender: Gender.MALE,
          assessment_score_bucket_start: faker.number.int({ max: 100 }),
          assessment_score_bucket_end: faker.number.int({ max: 100 }),
          most_severe_ncic_category_uniform: faker.string.alpha(),
        }),
        recidivism_num_records: faker.number.int({ max: 100 }),
        recidivism_series: createFakeRecidivismSeriesForImport([
          {
            sentence_length_bucket_start: 0,
            sentence_length_bucket_end: 1,
          },
          {
            sentence_length_bucket_start: 2,
            sentence_length_bucket_end: 5,
          },
          {
            sentence_length_bucket_start: 20,
            sentence_length_bucket_end: -1,
          },
        ]),
        disposition_num_records: faker.number.int({ max: 100 }),
        dispositions: createFakeDispositionsForImport([
          {
            sentence_length_bucket_start: 0,
            sentence_length_bucket_end: 1,
          },
          {
            sentence_length_bucket_start: 2,
            sentence_length_bucket_end: 5,
          },
          {
            sentence_length_bucket_start: 20,
            sentence_length_bucket_end: -1,
          },
        ]),
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [INSIGHTS_FILE_NAME]);

    // Check that the new Insights were created
    const dbInsights = await testPrismaClient.insight.findMany({
      include: {
        rollupRecidivismSeries: {
          select: {
            recommendationType: true,
            sentenceLengthBucketEnd: true,
            sentenceLengthBucketStart: true,
            dataPoints: true,
          },
        },
        dispositionData: true,
      },
    });

    expect(dbInsights).toHaveLength(1);

    expect(dbInsights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rollupRecidivismSeries: expect.arrayContaining([
            expect.objectContaining({
              sentenceLengthBucketStart: 0,
              sentenceLengthBucketEnd: 1,
              dataPoints: expect.arrayContaining([
                expect.objectContaining({}),
                expect.objectContaining({}),
              ]),
            }),
            expect.objectContaining({
              sentenceLengthBucketStart: 2,
              sentenceLengthBucketEnd: 5,
              dataPoints: expect.arrayContaining([
                expect.objectContaining({}),
                expect.objectContaining({}),
              ]),
            }),
            expect.objectContaining({
              sentenceLengthBucketStart: 20,
              sentenceLengthBucketEnd: -1,
              dataPoints: expect.arrayContaining([
                expect.objectContaining({}),
                expect.objectContaining({}),
              ]),
            }),
          ]),
          dispositionData: expect.arrayContaining([
            expect.objectContaining({
              sentenceLengthBucketStart: 0,
              sentenceLengthBucketEnd: 1,
            }),
            expect.objectContaining({
              sentenceLengthBucketStart: 2,
              sentenceLengthBucketEnd: 5,
            }),
            expect.objectContaining({
              sentenceLengthBucketStart: 20,
              sentenceLengthBucketEnd: -1,
            }),
          ]),
        }),
      ]),
    );
  });

  test("should replace an existing insight with the same gender, offense, and assessment score bucket", async () => {
    dataProviderSingleton.setData(TEST_INSIGHTS_FILE_NAME, [
      createInsightImportRow({
        gender: fakeInsight.gender,
        assessmentScoreBucketStart: fakeInsight.assessmentScoreBucketStart,
        assessmentScoreBucketEnd: fakeInsight.assessmentScoreBucketEnd,
        recidivismNumRecords: 42,
        sentenceType: "Term",
      }),
    ]);

    await importHandler.import(TEST_STATE_CODE, [INSIGHTS_FILE_NAME]);

    const dbInsights = await testPrismaClient.insight.findMany({
      include: { rollupRecidivismSeries: true, dispositionData: true },
    });

    expect(dbInsights).toHaveLength(1);
    expect(dbInsights[0].id).not.toEqual(fakeInsightId);
    expect(dbInsights[0].rollupRecidivismNumRecords).toBe(42);
    expect(dbInsights[0].rollupRecidivismSeries).toEqual([
      expect.objectContaining({ recommendationType: "Term" }),
    ]);
    expect(dbInsights[0].dispositionData).toEqual([
      expect.objectContaining({ recommendationType: "Term" }),
    ]);

    // The old insight's series, data points, and dispositions are gone too
    expect(await testPrismaClient.recidivismSeries.count()).toBe(1);
    expect(await testPrismaClient.recidvismSeriesDataPoint.count()).toBe(2);
    expect(await testPrismaClient.disposition.count()).toBe(1);
  });

  test("should keep the last row when the same insight appears twice in a file", async () => {
    dataProviderSingleton.setData(TEST_INSIGHTS_FILE_NAME, [
      createInsightImportRow({
        assessmentScoreBucketStart: 30,
        assessmentScoreBucketEnd: 40,
        recidivismNumRecords: 1,
        sentenceType: "Probation",
      }),
      createInsightImportRow({
        assessmentScoreBucketStart: 30,
        assessmentScoreBucketEnd: 40,
        recidivismNumRecords: 2,
        sentenceType: "Term",
      }),
    ]);

    await importHandler.import(TEST_STATE_CODE, [INSIGHTS_FILE_NAME]);

    const dbInsights = await testPrismaClient.insight.findMany({
      include: { rollupRecidivismSeries: true, dispositionData: true },
    });

    expect(dbInsights).toHaveLength(1);
    expect(dbInsights[0].rollupRecidivismNumRecords).toBe(2);
    expect(dbInsights[0].rollupRecidivismSeries).toEqual([
      expect.objectContaining({ recommendationType: "Term" }),
    ]);
    expect(dbInsights[0].dispositionData).toEqual([
      expect.objectContaining({ recommendationType: "Term" }),
    ]);
  });

  test("should load every insight across multiple batches", async () => {
    const rows = [0, 1, 2, 3, 4].map((i) =>
      createInsightImportRow({
        assessmentScoreBucketStart: i * 10,
        assessmentScoreBucketEnd: i * 10 + 5,
        recidivismNumRecords: i,
      }),
    );
    // Repeats the first insight in the last batch, so the later row wins
    // even across batches.
    rows.push(
      createInsightImportRow({
        assessmentScoreBucketStart: 0,
        assessmentScoreBucketEnd: 5,
        recidivismNumRecords: 99,
      }),
    );

    async function* toAsyncGenerator() {
      for (const row of rows) yield insightImportSchema.parse(row);
    }

    // A batch size of 2 splits the six rows into three batches
    await loadInsightsInBatches(
      testPrismaClient,
      toAsyncGenerator(),
      { linkToOffense: true },
      2,
    );

    const dbInsights = await testPrismaClient.insight.findMany({
      include: {
        rollupRecidivismSeries: { include: { dataPoints: true } },
        dispositionData: true,
      },
      orderBy: { assessmentScoreBucketStart: "asc" },
    });

    // The seeded insight is deleted, leaving just the five imported ones
    expect(dbInsights.map((i) => i.rollupRecidivismNumRecords)).toEqual([
      99, 1, 2, 3, 4,
    ]);
    for (const insight of dbInsights) {
      expect(insight.rollupRecidivismSeries).toHaveLength(1);
      expect(insight.rollupRecidivismSeries[0].dataPoints).toHaveLength(2);
      expect(insight.dispositionData).toHaveLength(1);
    }
  });
});
