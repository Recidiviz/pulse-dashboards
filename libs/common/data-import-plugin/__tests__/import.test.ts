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

import {
  FILE_ONE,
  FILE_TWO,
  TEST_BUCKET,
  TEST_STATE_CODE,
} from "~data-import-plugin/test/common/constants";
import { arrayToJsonLines } from "~data-import-plugin/test/common/utils";
import {
  fileOneLoadFn,
  fileTwoLoadFn,
  importHandler,
  mockPrismaClient,
  mockStorageSingleton,
} from "~data-import-plugin/test/setup";

describe("import", () => {
  test("should throw error if state code is invalid", async () => {
    await expect(importHandler.import("wrong-state-code")).rejects.toThrow(
      "Unsupported state code: wrong-state-code",
    );
  });

  test("should throw error if data is not parsable", async () => {
    await mockStorageSingleton
      .bucket(TEST_BUCKET)
      .file(`${TEST_STATE_CODE}/${FILE_ONE}`)
      .save(
        arrayToJsonLines([
          {
            datapoint: "not-right",
          },
        ]),
      );

    await expect(
      importHandler.import(TEST_STATE_CODE, [FILE_ONE]),
    ).rejects.toThrow(
      /Error importing file-one from bucket id test-bucket for state code US_ID: \nUnable to parse data:/,
    );
  });

  test("should handle files being passed", async () => {
    await mockStorageSingleton
      .bucket(TEST_BUCKET)
      .file(`${TEST_STATE_CODE}/${FILE_ONE}`)
      .save(
        arrayToJsonLines([
          {
            testField: "testing-field",
          },
        ]),
      );

    await importHandler.import(TEST_STATE_CODE, [FILE_ONE]);

    expect(fileOneLoadFn).toHaveBeenCalledWith(
      mockPrismaClient,
      // This is how a generator apparently looks?
      expect.objectContaining({}),
    );

    expect(fileTwoLoadFn).not.toHaveBeenCalled();
  });

  test("should load all files by default", async () => {
    await mockStorageSingleton
      .bucket(TEST_BUCKET)
      .file(`${TEST_STATE_CODE}/${FILE_ONE}`)
      .save(
        arrayToJsonLines([
          {
            testField: "testing-field",
          },
        ]),
      );

    await mockStorageSingleton
      .bucket(TEST_BUCKET)
      .file(`${TEST_STATE_CODE}/${FILE_TWO}`)
      .save(
        arrayToJsonLines([
          {
            testField: "testing-field",
          },
        ]),
      );

    await importHandler.import(TEST_STATE_CODE);

    expect(fileOneLoadFn).toHaveBeenCalledWith(
      mockPrismaClient,
      // This is how a generator apparently looks?
      expect.objectContaining({}),
    );

    expect(fileTwoLoadFn).toHaveBeenCalledWith(
      mockPrismaClient,
      // This is how a generator apparently looks?
      expect.objectContaining({}),
    );
  });
});
