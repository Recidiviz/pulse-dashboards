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

import { beforeEach, describe, expect, test } from "vitest";

import { TIME_SERVED_FILE_NAME } from "~@sentencing/import/constants";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import { importFile } from "~@sentencing/import/test/setup/utils";
import { Gender, StateCode } from "~@sentencing/prisma/client";

const OFFENSE_NAME = "ROBBERY 1ST DEGREE";

let offenseId: string;

/** A row for OFFENSE_NAME. Tests pass the fields they care about. */
function createTimeServedImportRow(overrides: Record<string, unknown> = {}) {
  return {
    state_code: StateCode.US_MO,
    most_severe_description: OFFENSE_NAME,
    sex: Gender.MALE,
    assessment_level: "HIGH",
    n_all: 100,
    avg_sentence_length_yrs: 4.5,
    avg_credit_days: 30,
    n_elapsed: 80,
    avg_pct_served: 0.6,
    ci95: 5,
    ...overrides,
  };
}

async function importTimeServed(rows: Record<string, unknown>[]) {
  await importFile(TIME_SERVED_FILE_NAME, rows, StateCode.US_MO);
}

function findInsights() {
  return testPrismaClient.insight.findMany({
    where: { offenseId },
    orderBy: { assessmentScoreBucketStart: "asc" },
  });
}

describe("import time served data", () => {
  beforeEach(async () => {
    offenseId = (
      await testPrismaClient.offense.create({
        data: { stateCode: StateCode.US_MO, name: OFFENSE_NAME },
      })
    ).id;
  });

  test("should add time served data to an existing insight without changing its other data", async () => {
    const existingInsight = await testPrismaClient.insight.create({
      data: {
        stateCode: StateCode.US_MO,
        gender: Gender.MALE,
        offense: { connect: { id: offenseId } },
        // HIGH maps to bucket 2.
        assessmentScoreBucketStart: 2,
        assessmentScoreBucketEnd: 2,
        rollupStateCode: StateCode.US_MO,
        rollupRecidivismNumRecords: 50,
        dispositionNumRecords: 40,
      },
    });

    await importTimeServed([createTimeServedImportRow()]);

    expect(await findInsights()).toEqual([
      expect.objectContaining({
        id: existingInsight.id,
        rollupRecidivismNumRecords: 50,
        dispositionNumRecords: 40,
        avgSentenceLengthYears: 4.5,
        avgPctServed: 0.6,
        timeServedNumRecords: 80,
      }),
    ]);
  });

  test("should create an insight with only time served data when none exists", async () => {
    await importTimeServed([createTimeServedImportRow()]);

    expect(await findInsights()).toEqual([
      expect.objectContaining({
        gender: Gender.MALE,
        assessmentScoreBucketStart: 2,
        assessmentScoreBucketEnd: 2,
        rollupRecidivismNumRecords: 0,
        dispositionNumRecords: 0,
        avgSentenceLengthYears: 4.5,
        avgPctServed: 0.6,
        timeServedNumRecords: 80,
      }),
    ]);
  });

  test.each([
    ["LOW", 0],
    ["LOW_MEDIUM", 1],
    ["MEDIUM", 1],
    ["HIGH", 2],
    ["VERY_HIGH", 3],
    // No ORAS score on file
    [null, -1],
  ])(
    "should map assessment level %s to score bucket %i",
    async (assessmentLevel, bucket) => {
      await importTimeServed([
        createTimeServedImportRow({ assessment_level: assessmentLevel }),
      ]);

      expect(await findInsights()).toEqual([
        expect.objectContaining({
          assessmentScoreBucketStart: bucket,
          assessmentScoreBucketEnd: bucket,
        }),
      ]);
    },
  );

  test("should skip rows with an unknown assessment level", async () => {
    await importTimeServed([
      createTimeServedImportRow({ assessment_level: "EXTREME" }),
    ]);

    expect(await findInsights()).toEqual([]);
  });

  test("should only import rows with a confidence interval of 15 or less", async () => {
    await importTimeServed([
      createTimeServedImportRow({ assessment_level: "LOW", ci95: 15 }),
      createTimeServedImportRow({ assessment_level: "MEDIUM", ci95: 15.1 }),
      createTimeServedImportRow({ assessment_level: "HIGH", ci95: null }),
    ]);

    expect(
      (await findInsights()).map(
        ({ assessmentScoreBucketStart }) => assessmentScoreBucketStart,
      ),
    ).toEqual([0]);
  });

  test("should skip rows with no matching offense", async () => {
    await importTimeServed([
      createTimeServedImportRow({ most_severe_description: "UNKNOWN OFFENSE" }),
    ]);

    expect(await testPrismaClient.insight.count({ where: { offenseId } })).toBe(
      0,
    );
    expect(
      await testPrismaClient.offense.findUnique({
        where: { name: "UNKNOWN OFFENSE" },
      }),
    ).toBeNull();
  });
});
