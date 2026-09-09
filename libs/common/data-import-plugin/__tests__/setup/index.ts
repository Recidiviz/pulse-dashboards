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

import { MockStorage } from "mock-gcs";
import { beforeEach, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { z } from "zod";

import type { LoaderContext } from "~data-import-plugin/index";
import { ImportHandler } from "~data-import-plugin/index";
import {
  FILE_ONE,
  FILE_THREE,
  FILE_TWO,
  TEST_BUCKET,
} from "~data-import-plugin/test/common/constants";
import {
  fileOneSchema,
  fileThreeSchema,
  fileTwoSchema,
} from "~data-import-plugin/test/setup/constants";

export const mockPrismaClient = mock();

export const testGetPrismaClientForStateCode = vi.fn((stateCode: string) => {
  if (stateCode === "US_ID") {
    return mockPrismaClient;
  }

  throw new Error(`Unsupported state code: ${stateCode}`);
});

export const dataProcessorOne = vi.fn();
export const fileOneLoadFn = async (
  _: typeof mockPrismaClient,
  data: AsyncGenerator<z.infer<typeof fileOneSchema> | Error>,
) => {
  for await (const datum of data) {
    dataProcessorOne(datum);
  }
  return Promise.resolve();
};

export const dataProcessorTwo = vi.fn();
export const fileTwoLoadFn = async (
  _: typeof mockPrismaClient,
  data: AsyncGenerator<z.infer<typeof fileTwoSchema> | Error>,
) => {
  for await (const datum of data) {
    dataProcessorTwo(datum);
  }
  return Promise.resolve();
};

export const dataProcessorThree = vi.fn();
/** Records what the loader was told about rows it never received. */
export const contextProcessorThree = vi.fn();
export const fileThreeLoadFn = async (
  _: typeof mockPrismaClient,
  data: AsyncGenerator<z.infer<typeof fileThreeSchema>>,
  context?: LoaderContext,
) => {
  for await (const datum of data) {
    dataProcessorThree(datum);
  }
  // the context is only complete once the data has been drained, which is why this comes after
  contextProcessorThree({
    skippedRowIds: [...(context?.skippedRowIds ?? [])],
    unidentifiedSkippedRowCount: context?.unidentifiedSkippedRowCount,
  });
};

export let mockStorageSingleton: MockStorage;

export const importHandler = new ImportHandler({
  bucket: TEST_BUCKET,
  getPrismaClientForStateCode: testGetPrismaClientForStateCode,
  filesToSchemasAndLoaderFns: {
    [FILE_ONE]: {
      schema: fileOneSchema,
      loaderFn: fileOneLoadFn,
    },
    [FILE_TWO]: {
      schema: fileTwoSchema,
      loaderFn: fileTwoLoadFn,
    },
  },
});

/*
 * Kept separate from the handler above rather than adding another file to it, because importing
 * without a file list loads every file in a handler's config, and the tests for that behavior
 * only stub out data for the two files it already has.
 */
export const rowIdImportHandler = new ImportHandler({
  bucket: TEST_BUCKET,
  getPrismaClientForStateCode: testGetPrismaClientForStateCode,
  filesToSchemasAndLoaderFns: {
    [FILE_THREE]: {
      schema: fileThreeSchema,
      loaderFn: fileThreeLoadFn,
      getRowId: (rawDatum: unknown) =>
        z.object({ id: z.string() }).safeParse(rawDatum).data?.id,
    },
  },
});

vi.mock("@google-cloud/storage", () => ({
  Storage: vi.fn().mockImplementation(() => {
    return mockStorageSingleton;
  }),
}));

beforeEach(() => {
  dataProcessorOne.mockClear();
  dataProcessorTwo.mockClear();
  dataProcessorThree.mockClear();
  contextProcessorThree.mockClear();
  mockStorageSingleton = new MockStorage();
});
