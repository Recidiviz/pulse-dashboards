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

import type { Mock } from "vitest";
import { vi } from "vitest";

/** The subset of `@google-cloud/storage`'s File that this library calls. */
export type FakeGcsFile = {
  name: string;
  getSignedUrl: Mock;
  download: Mock;
  exists: Mock;
  getMetadata: Mock;
  delete: Mock;
  save: Mock;
};

export type FakeGcsStorage = {
  /** Every file handed out, keyed by `${bucketName}/${objectKey}`. */
  files: Map<string, FakeGcsFile>;
  /** What `listGcsObjects` should see, per bucket prefix scan. */
  getFilesResult: FakeGcsFile[];
  /** Records the options each `getFiles` call was made with. */
  getFilesCalls: unknown[];
  /** Applied to every file the moment it is created, before the subject uses it. */
  onFileCreated?: (file: FakeGcsFile) => void;
  bucket(bucketName: string): {
    file(objectKey: string): FakeGcsFile;
    getFiles(options: unknown): Promise<[FakeGcsFile[]]>;
  };
  file(bucketName: string, objectKey: string): FakeGcsFile;
};

export const DEFAULT_SIGNED_URL = "https://signed.example.com/object";
export const DEFAULT_FILE_BYTES = Buffer.from("pdf-bytes");

function createFakeFile(name: string): FakeGcsFile {
  return {
    name,
    getSignedUrl: vi.fn().mockResolvedValue([DEFAULT_SIGNED_URL]),
    download: vi.fn().mockResolvedValue([DEFAULT_FILE_BYTES]),
    exists: vi.fn().mockResolvedValue([true]),
    getMetadata: vi
      .fn()
      .mockResolvedValue([{ contentType: "application/pdf" }]),
    delete: vi.fn().mockResolvedValue([{}]),
    save: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Stands in for the `@google-cloud/storage` SDK so `gcs.client.ts` and the
 * services above it run for real. Files are memoized per `bucket/key`, so a
 * test can configure a file before the subject asks for it and assert on the
 * same instance afterwards.
 *
 * Only the File methods are `vi.fn()`s: the config-level `mockReset` empties
 * every mock implementation before each test, so anything that must keep
 * behaving is a plain function and the whole fake is rebuilt per test.
 */
export function createFakeGcsStorage(): FakeGcsStorage {
  const files = new Map<string, FakeGcsFile>();

  const fake: FakeGcsStorage = {
    files,
    getFilesResult: [],
    getFilesCalls: [],
    file(bucketName, objectKey) {
      const key = `${bucketName}/${objectKey}`;
      const existing = files.get(key);
      if (existing) return existing;

      const created = createFakeFile(objectKey);
      fake.onFileCreated?.(created);
      files.set(key, created);
      return created;
    },
    bucket(bucketName) {
      return {
        file: (objectKey: string) => fake.file(bucketName, objectKey),
        getFiles: async (options: unknown) => {
          fake.getFilesCalls.push(options);
          return [fake.getFilesResult];
        },
      };
    },
  };

  return fake;
}

/**
 * Shared slot the `@google-cloud/storage` mock reads through. A suite declares
 * the mock with `vi.hoisted`, points the Storage stub at this holder, and
 * refreshes it in `beforeEach`.
 */
export type GcsFakeHolder = { current: FakeGcsStorage };
