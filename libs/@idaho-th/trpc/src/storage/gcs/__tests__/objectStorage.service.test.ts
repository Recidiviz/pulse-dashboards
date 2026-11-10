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

import { beforeAll, describe, expect, it } from "vitest";

import { GCS_VALIDATION_CRC32C } from "~@idaho-th/trpc/storage/gcs/gcs.constants";

import type { FakeGcsStorage } from "./gcs.fake";
import { createFakeGcsStorage, DEFAULT_FILE_BYTES } from "./gcs.fake";

const holder = vi.hoisted(() => ({ current: null as unknown }));

// Plain class, not vi.fn: the config-level mockReset would empty a mocked
// constructor's implementation between tests.
vi.mock("@google-cloud/storage", () => ({
  Storage: class {
    bucket(bucketName: string) {
      return (holder.current as FakeGcsStorage).bucket(bucketName);
    }
  },
}));

// gcs.config.ts reads its required env vars at module-eval time, so they
// must be stubbed before this dynamic import runs -- a static import would
// be hoisted ahead of any stubbing done in a test file.
let isGcsNotFoundError: (error: unknown) => boolean;

beforeAll(async () => {
  process.env["IDAHO_TH_PDF_GCS_BUCKET"] = "test-bucket";
  process.env["IDAHO_TH_PDF_GCS_CLEAN_BUCKET"] = "test-clean-bucket";
  process.env["GOOGLE_PROJECT_ID"] = "test-project";
  ({ isGcsNotFoundError } = await import("../objectStorage.service"));
});

function gcsError(message: string, code?: number): Error {
  const error = new Error(message);
  if (code !== undefined) {
    (error as Error & { code: number }).code = code;
  }
  return error;
}

describe("isGcsNotFoundError", () => {
  it("matches the SDK's numeric 404 code regardless of message", () => {
    expect(isGcsNotFoundError(gcsError("some other message", 404))).toBe(true);
  });

  it("falls back to matching the SDK's 'No such object' message when code is absent", () => {
    expect(
      isGcsNotFoundError(
        gcsError("No such object: clean-bucket/applications/x.pdf"),
      ),
    ).toBe(true);
  });

  it("does not match an unrelated error", () => {
    expect(isGcsNotFoundError(gcsError("permission denied", 403))).toBe(false);
  });

  it("does not match a non-Error value", () => {
    expect(isGcsNotFoundError("No such object")).toBe(false);
  });
});

const { ensureGcsStorageInitialized } = await import(
  "~@idaho-th/trpc/storage/gcs/gcs.client"
);
const {
  assertGcsObjectExistence,
  decodeBase64ToBuffer,
  deleteGcsObject,
  downloadBufferFromGcs,
  downloadGcsObjectHead,
  gcsObjectExists,
  getGcsObjectMetadata,
  listGcsObjects,
  toFiniteNumber,
  toObjectMetadata,
  uploadBufferToGcs,
  upsertBufferInGcs,
} = await import("../objectStorage.service");

const BUCKET = "test-pdf-bucket";
const OBJECT_KEY = "applications/app-1/upload.pdf";
const REF = { bucketName: BUCKET, objectKey: OBJECT_KEY };

let fake: FakeGcsStorage;

beforeEach(async () => {
  fake = createFakeGcsStorage();
  holder.current = fake;
  await ensureGcsStorageInitialized();
});

describe("object existence", () => {
  it("reports whether the object exists", async () => {
    fake.file(BUCKET, OBJECT_KEY).exists.mockResolvedValue([true]);
    await expect(gcsObjectExists(REF)).resolves.toBe(true);

    fake.file(BUCKET, OBJECT_KEY).exists.mockResolvedValue([false]);
    await expect(gcsObjectExists(REF)).resolves.toBe(false);
  });

  it("passes when the expectation matches reality", async () => {
    fake.file(BUCKET, OBJECT_KEY).exists.mockResolvedValue([true]);
    await expect(assertGcsObjectExistence(REF, true)).resolves.toBeUndefined();

    fake.file(BUCKET, OBJECT_KEY).exists.mockResolvedValue([false]);
    await expect(assertGcsObjectExistence(REF, false)).resolves.toBeUndefined();
  });

  it("throws NOT_FOUND when a required object is missing", async () => {
    fake.file(BUCKET, OBJECT_KEY).exists.mockResolvedValue([false]);

    await expect(assertGcsObjectExistence(REF, true)).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "File does not exist",
    });
  });

  it("throws CONFLICT when an object that must be absent exists", async () => {
    fake.file(BUCKET, OBJECT_KEY).exists.mockResolvedValue([true]);

    await expect(assertGcsObjectExistence(REF, false)).rejects.toMatchObject({
      code: "CONFLICT",
      message: "File already exists",
    });
  });

  it("uses a custom message when one is supplied", async () => {
    fake.file(BUCKET, OBJECT_KEY).exists.mockResolvedValue([false]);

    await expect(
      assertGcsObjectExistence(REF, true, "Upload not finished"),
    ).rejects.toMatchObject({ message: "Upload not finished" });
  });
});

describe("reads", () => {
  it("downloads the whole object", async () => {
    await expect(downloadBufferFromGcs(REF)).resolves.toEqual(
      DEFAULT_FILE_BYTES,
    );
  });

  it("downloads only the requested head range", async () => {
    const file = fake.file(BUCKET, OBJECT_KEY);
    file.download.mockResolvedValue([Buffer.from("head")]);

    await expect(downloadGcsObjectHead(REF, 4)).resolves.toEqual(
      Buffer.from("head"),
    );
    // Inclusive end, so a length of 4 asks for bytes 0-3.
    expect(file.download).toHaveBeenCalledWith({ start: 0, end: 3 });
  });

  it("returns the object metadata", async () => {
    fake
      .file(BUCKET, OBJECT_KEY)
      .getMetadata.mockResolvedValue([
        { contentType: "text/plain", size: "7" },
      ]);

    await expect(getGcsObjectMetadata(REF)).resolves.toEqual({
      contentType: "text/plain",
      size: "7",
    });
  });

  it("scopes a listing to the requested prefix", async () => {
    fake.getFilesResult = [fake.file(BUCKET, "applications/app-1/a.pdf")];

    await expect(
      listGcsObjects({
        bucketName: BUCKET,
        prefix: "applications/app-1/",
        maxResults: 5,
      }),
    ).resolves.toHaveLength(1);

    expect(fake.getFilesCalls).toEqual([
      { prefix: "applications/app-1/", maxResults: 5 },
    ]);
  });
});

describe("writes", () => {
  const buffer = Buffer.from("bytes");
  const uploadInput = {
    ...REF,
    buffer,
    contentType: "application/pdf",
  };

  it("uploads only when the object does not already exist", async () => {
    fake.file(BUCKET, OBJECT_KEY).exists.mockResolvedValue([false]);

    await uploadBufferToGcs(uploadInput);

    expect(fake.file(BUCKET, OBJECT_KEY).save).toHaveBeenCalledWith(buffer, {
      contentType: "application/pdf",
      resumable: false,
      validation: GCS_VALIDATION_CRC32C,
      metadata: { contentType: "application/pdf" },
    });
  });

  it("refuses to upload over an existing object", async () => {
    fake.file(BUCKET, OBJECT_KEY).exists.mockResolvedValue([true]);

    await expect(uploadBufferToGcs(uploadInput)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(fake.file(BUCKET, OBJECT_KEY).save).not.toHaveBeenCalled();
  });

  it("upserts without consulting existence at all", async () => {
    const file = fake.file(BUCKET, OBJECT_KEY);
    file.exists.mockResolvedValue([true]);

    await upsertBufferInGcs(uploadInput);

    expect(file.exists).not.toHaveBeenCalled();
    expect(file.save).toHaveBeenCalledTimes(1);
  });

  it("drops validation when it is explicitly disabled", async () => {
    await upsertBufferInGcs({ ...uploadInput, validation: false });

    expect(fake.file(BUCKET, OBJECT_KEY).save).toHaveBeenCalledWith(
      buffer,
      expect.objectContaining({ validation: undefined }),
    );
  });

  it("deletes the object", async () => {
    await deleteGcsObject(REF);

    expect(fake.file(BUCKET, OBJECT_KEY).delete).toHaveBeenCalledTimes(1);
  });
});

describe("decodeBase64ToBuffer", () => {
  it("round-trips valid base64", () => {
    expect(
      decodeBase64ToBuffer(Buffer.from("hello").toString("base64")),
    ).toEqual(Buffer.from("hello"));
  });

  it("does not throw on malformed input", () => {
    // Buffer.from silently drops invalid characters, so callers must not rely
    // on this to reject a bad payload.
    expect(decodeBase64ToBuffer("!!!not base64!!!")).toBeInstanceOf(Buffer);
    expect(decodeBase64ToBuffer("")).toHaveLength(0);
  });

  it("honours an explicit encoding", () => {
    expect(decodeBase64ToBuffer("68656c6c6f", "hex")).toEqual(
      Buffer.from("hello"),
    );
  });
});

describe("metadata shaping", () => {
  it.each([
    ["7", 7],
    [7, 7],
    ["not-a-number", undefined],
    ["NaN", undefined],
  ])("toFiniteNumber(%p) is %p", (value, expected) => {
    expect(toFiniteNumber(value)).toBe(expected);
  });

  it("falls back to octet-stream and omits absent fields", () => {
    expect(toObjectMetadata(REF)).toEqual({
      ...REF,
      contentType: "application/octet-stream",
      sizeInBytes: undefined,
      updatedAt: undefined,
    });
  });

  it("normalizes a Date updated field to an ISO string", () => {
    const updated = new Date("2026-01-02T03:04:05.000Z");

    expect(
      toObjectMetadata(REF, { contentType: "text/plain", size: "9", updated }),
    ).toEqual({
      ...REF,
      contentType: "text/plain",
      sizeInBytes: 9,
      updatedAt: updated.toISOString(),
    });
  });

  it("passes a string updated field through and respects a custom default", () => {
    expect(
      toObjectMetadata(REF, { updated: "2026-01-02" }, "application/pdf"),
    ).toMatchObject({
      contentType: "application/pdf",
      updatedAt: "2026-01-02",
    });
  });
});
