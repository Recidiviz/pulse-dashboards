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
import { Gender, StateCode } from "@prisma/sentencing/client";
import { describe, expect, test } from "vitest";

import { INSIGHTS_FILE_NAME } from "~@sentencing/import/constants";
import { getImportHandler } from "~@sentencing/import/handler";
import {
  createFakeDispositionsForImport,
  createFakeRecidivismSeriesForImport,
} from "~@sentencing/import/test/common/utils";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import {
  TEST_INSIGHTS_FILE_NAME,
  TEST_STATE_CODE,
} from "~@sentencing/import/test/setup/constants";
import { fakeOffense } from "~@sentencing/import/test/setup/seed";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

describe("import insight data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should import new insights and delete old data", async () => {
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
});
