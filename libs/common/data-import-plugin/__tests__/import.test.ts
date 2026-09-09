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

import { describe, expect, test } from "vitest";

import { ImportHandler } from "~data-import-plugin/index";
import {
  FILE_ONE,
  FILE_THREE,
  FILE_TWO,
  TEST_BUCKET,
  TEST_STATE_CODE,
} from "~data-import-plugin/test/common/constants";
import { arrayToJsonLines } from "~data-import-plugin/test/common/utils";
import {
  contextProcessorThree,
  dataProcessorOne,
  dataProcessorThree,
  dataProcessorTwo,
  fileThreeLoadFn,
  importHandler,
  mockStorageSingleton,
  rowIdImportHandler,
  testGetPrismaClientForStateCode,
} from "~data-import-plugin/test/setup";
import { fileThreeSchema } from "~data-import-plugin/test/setup/constants";

const VALID_ROW = { id: "1", testFieldThree: "testing-field" };
const OTHER_VALID_ROW = { id: "3", testFieldThree: "testing-field" };
const INVALID_ROW = { id: "2" };

async function saveFileThree(rows: object[]) {
  await mockStorageSingleton
    .bucket(TEST_BUCKET)
    .file(`${TEST_STATE_CODE}/${FILE_THREE}`)
    .save(arrayToJsonLines(rows));
}

describe("import", () => {
  test("should throw error if state code is invalid", async () => {
    await expect(importHandler.import("wrong-state-code")).rejects.toThrow(
      "Unsupported state code: wrong-state-code",
    );
  });

  test("should throw error if data is not parsable but continue with rest of the file", async () => {
    await mockStorageSingleton
      .bucket(TEST_BUCKET)
      .file(`${TEST_STATE_CODE}/${FILE_ONE}`)
      .save(
        arrayToJsonLines([
          // This should fail
          {
            datapoint: "not-right",
          },
          // This should succeed
          {
            testFieldOne: "testing-field",
          },
        ]),
      );

    await expect(
      importHandler.import(TEST_STATE_CODE, [FILE_ONE]),
    ).rejects.toThrow(
      /Error individual lines from file-one from bucket id test-bucket for state code US_ID:\nUnable to parse data for line 1. Error: \[/,
    );

    expect(dataProcessorOne).toHaveBeenCalledWith({
      testFieldOne: "testing-field",
    });
  });

  test("should handle files being passed", async () => {
    await mockStorageSingleton
      .bucket(TEST_BUCKET)
      .file(`${TEST_STATE_CODE}/${FILE_ONE}`)
      .save(
        arrayToJsonLines([
          {
            testFieldOne: "testing-field",
          },
        ]),
      );

    await importHandler.import(TEST_STATE_CODE, [FILE_ONE]);

    expect(dataProcessorOne).toHaveBeenCalledWith({
      testFieldOne: "testing-field",
    });

    expect(dataProcessorTwo).not.toHaveBeenCalled();
  });

  test("should load all files by default", async () => {
    await mockStorageSingleton
      .bucket(TEST_BUCKET)
      .file(`${TEST_STATE_CODE}/${FILE_ONE}`)
      .save(
        arrayToJsonLines([
          {
            testFieldOne: "testing-field",
          },
        ]),
      );

    await mockStorageSingleton
      .bucket(TEST_BUCKET)
      .file(`${TEST_STATE_CODE}/${FILE_TWO}`)
      .save(
        arrayToJsonLines([
          {
            testFieldTwo: "testing-field",
          },
        ]),
      );

    await importHandler.import(TEST_STATE_CODE);

    expect(dataProcessorOne).toHaveBeenCalledWith({
      testFieldOne: "testing-field",
    });

    expect(dataProcessorTwo).toHaveBeenCalledWith({
      testFieldTwo: "testing-field",
    });
  });
});

describe("import with getRowId", () => {
  test("reports the ids of rows that could not be parsed", async () => {
    await saveFileThree([VALID_ROW, INVALID_ROW, OTHER_VALID_ROW]);

    await expect(
      rowIdImportHandler.import(TEST_STATE_CODE, [FILE_THREE]),
    ).rejects.toThrow();

    expect(dataProcessorThree).toHaveBeenCalledWith(VALID_ROW);
    expect(dataProcessorThree).toHaveBeenCalledWith(OTHER_VALID_ROW);
    expect(contextProcessorThree).toHaveBeenCalledWith({
      skippedRowIds: ["2"],
      unidentifiedSkippedRowCount: 0,
    });
  });

  test("reports rows that could not be parsed on the last line", async () => {
    await saveFileThree([VALID_ROW, INVALID_ROW]);

    await expect(
      rowIdImportHandler.import(TEST_STATE_CODE, [FILE_THREE]),
    ).rejects.toThrow();

    expect(contextProcessorThree).toHaveBeenCalledWith({
      skippedRowIds: ["2"],
      unidentifiedSkippedRowCount: 0,
    });
  });

  test("includes the row id in the reported error", async () => {
    await saveFileThree([VALID_ROW, INVALID_ROW]);

    await expect(
      rowIdImportHandler.import(TEST_STATE_CODE, [FILE_THREE]),
    ).rejects.toThrow(
      /Unable to parse data for line 2 \(row id 2\)\. Error: \[/,
    );
  });

  test("reports rows whose id could not be read", async () => {
    await saveFileThree([VALID_ROW, { testFieldThree: 42 }]);

    await expect(
      rowIdImportHandler.import(TEST_STATE_CODE, [FILE_THREE]),
    ).rejects.toThrow(
      /Unable to parse data for line 2 \(row id could not be determined\)\. Error: \[/,
    );

    expect(contextProcessorThree).toHaveBeenCalledWith({
      skippedRowIds: [],
      unidentifiedSkippedRowCount: 1,
    });
  });

  test("a getRowId that throws costs one row, not the whole file", async () => {
    const throwingHandler = new ImportHandler({
      bucket: TEST_BUCKET,
      getPrismaClientForStateCode: testGetPrismaClientForStateCode,
      filesToSchemasAndLoaderFns: {
        [FILE_THREE]: {
          schema: fileThreeSchema,
          loaderFn: fileThreeLoadFn,
          getRowId: () => {
            throw new Error("broken extractor");
          },
        },
      },
    });

    await saveFileThree([INVALID_ROW, VALID_ROW]);

    await expect(
      throwingHandler.import(TEST_STATE_CODE, [FILE_THREE]),
    ).rejects.toThrow(/row id could not be determined/);

    expect(dataProcessorThree).toHaveBeenCalledWith(VALID_ROW);
    expect(contextProcessorThree).toHaveBeenCalledWith({
      skippedRowIds: [],
      unidentifiedSkippedRowCount: 1,
    });
  });

  test("a line that is not valid JSON aborts the whole file", async () => {
    await mockStorageSingleton
      .bucket(TEST_BUCKET)
      .file(`${TEST_STATE_CODE}/${FILE_THREE}`)
      .save(`${JSON.stringify(VALID_ROW)}\nnot json`);

    await expect(
      rowIdImportHandler.import(TEST_STATE_CODE, [FILE_THREE]),
    ).rejects.toThrow(/Unexpected error importing file-three/);

    // the loader never gets past its data loop, so it never consumes the context
    expect(contextProcessorThree).not.toHaveBeenCalled();
  });
});
