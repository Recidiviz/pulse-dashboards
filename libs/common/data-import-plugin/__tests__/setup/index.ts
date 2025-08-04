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

import { ImportHandler } from "~data-import-plugin/index";
import {
  FILE_ONE,
  FILE_TWO,
  TEST_BUCKET,
} from "~data-import-plugin/test/common/constants";
import {
  fileOneSchema,
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

vi.mock("@google-cloud/storage", () => ({
  Storage: vi.fn().mockImplementation(() => {
    return mockStorageSingleton;
  }),
}));

beforeEach(() => {
  dataProcessorOne.mockClear();
  dataProcessorTwo.mockClear();
  mockStorageSingleton = new MockStorage();
});
