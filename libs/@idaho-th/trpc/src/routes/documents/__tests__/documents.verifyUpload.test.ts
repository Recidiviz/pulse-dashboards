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

import { beforeEach, describe, expect, it, vi } from "vitest";

import { DOCUMENT_UPLOAD_ERROR } from "~@idaho-th/shared";

import {
  resolveConfirmableUploadRef,
  resolveOrRejectUpload,
} from "../documents.verifyUpload";

const gcsMocks = vi.hoisted(() => ({
  getGcsObjectMetadata: vi.fn(),
  downloadGcsObjectHead: vi.fn(),
  deleteGcsObject: vi.fn(),
}));

const helperMocks = vi.hoisted(() => ({
  markDocumentRejected: vi.fn(),
}));

vi.mock("../documents.helpers", () => ({
  markDocumentRejected: helperMocks.markDocumentRejected,
}));

vi.mock("~@idaho-th/trpc/storage/gcs", () => ({
  gcsConfig: { cleanBucketName: "test-clean-bucket" },
  getGcsObjectMetadata: gcsMocks.getGcsObjectMetadata,
  downloadGcsObjectHead: gcsMocks.downloadGcsObjectHead,
  deleteGcsObject: gcsMocks.deleteGcsObject,
  toFiniteNumber: (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  },
  isGcsNotFoundError: (error: unknown) =>
    error instanceof Error &&
    ((error as { code?: unknown }).code === 404 ||
      error.message.includes("No such object")),
}));

const PDF_MIME = "application/pdf";
const PDF_HEAD = Buffer.from([0x25, 0x50, 0x44, 0x46, ...Array(12).fill(0)]);

function notFoundError(): Error {
  const error = new Error("No such object: unscanned-bucket/x.pdf");
  (error as Error & { code: number }).code = 404;
  return error;
}

beforeEach(() => {
  vi.clearAllMocks();
  gcsMocks.deleteGcsObject.mockResolvedValue(undefined);
  helperMocks.markDocumentRejected.mockResolvedValue(undefined);
});

describe("resolveConfirmableUploadRef", () => {
  const input = {
    bucketName: "test-unscanned-bucket",
    objectKey: "applications/app-1/documents/doc-1.pdf",
    contentType: PDF_MIME,
  };

  it("resolves against the stored bucket when the object is there", async () => {
    gcsMocks.getGcsObjectMetadata.mockResolvedValue({ size: "1024" });
    gcsMocks.downloadGcsObjectHead.mockResolvedValue(PDF_HEAD);

    const result = await resolveConfirmableUploadRef(input);

    expect(result).toEqual({
      ok: true,
      ref: { bucketName: "test-unscanned-bucket", objectKey: input.objectKey },
    });
    expect(gcsMocks.getGcsObjectMetadata).toHaveBeenCalledTimes(1);
  });

  it("falls back to cleanBucketName when the stored bucket 404s (ClamAV won the race)", async () => {
    gcsMocks.getGcsObjectMetadata
      .mockRejectedValueOnce(notFoundError())
      .mockResolvedValueOnce({ size: "1024" });
    gcsMocks.downloadGcsObjectHead.mockResolvedValue(PDF_HEAD);

    const result = await resolveConfirmableUploadRef(input);

    expect(result).toEqual({
      ok: true,
      ref: { bucketName: "test-clean-bucket", objectKey: input.objectKey },
    });
    expect(gcsMocks.getGcsObjectMetadata).toHaveBeenCalledTimes(2);
  });

  it("returns UPLOAD_FAILED without a ref when neither bucket has the object", async () => {
    gcsMocks.getGcsObjectMetadata.mockRejectedValue(notFoundError());

    const result = await resolveConfirmableUploadRef(input);

    expect(result).toEqual({
      ok: false,
      code: DOCUMENT_UPLOAD_ERROR.UPLOAD_FAILED,
    });
  });

  it("does not mask a non-not-found error by falling through to the next bucket", async () => {
    const permissionError = new Error("permission denied");
    (permissionError as Error & { code: number }).code = 403;
    gcsMocks.getGcsObjectMetadata.mockRejectedValue(permissionError);

    await expect(resolveConfirmableUploadRef(input)).rejects.toThrow(
      "permission denied",
    );
    expect(gcsMocks.getGcsObjectMetadata).toHaveBeenCalledTimes(1);
  });

  it("returns TYPE_MISMATCH with the ref it found the object at, without trying the other bucket", async () => {
    gcsMocks.getGcsObjectMetadata.mockResolvedValue({ size: "1024" });
    gcsMocks.downloadGcsObjectHead.mockResolvedValue(Buffer.from("not a pdf"));

    const result = await resolveConfirmableUploadRef(input);

    expect(result).toEqual({
      ok: false,
      ref: { bucketName: "test-unscanned-bucket", objectKey: input.objectKey },
      code: DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH,
    });
    expect(gcsMocks.getGcsObjectMetadata).toHaveBeenCalledTimes(1);
  });

  it("only tries one candidate when the stored bucket already equals cleanBucketName (dev/skipDocumentScan mode)", async () => {
    gcsMocks.getGcsObjectMetadata.mockRejectedValue(notFoundError());

    const result = await resolveConfirmableUploadRef({
      ...input,
      bucketName: "test-clean-bucket",
    });

    expect(result).toEqual({
      ok: false,
      code: DOCUMENT_UPLOAD_ERROR.UPLOAD_FAILED,
    });
    expect(gcsMocks.getGcsObjectMetadata).toHaveBeenCalledTimes(1);
  });

  it("never tries the quarantine bucket, so an INFECTED object is never confirmable", async () => {
    // The object was moved to quarantine (INFECTED verdict), so it 404s in
    // both the stored (unscanned) and clean buckets -- resolveConfirmableUploadRef
    // has no third candidate to fall back to, unlike a CLEAN-verdict race.
    gcsMocks.getGcsObjectMetadata.mockRejectedValue(notFoundError());

    const result = await resolveConfirmableUploadRef(input);

    expect(result).toEqual({
      ok: false,
      code: DOCUMENT_UPLOAD_ERROR.UPLOAD_FAILED,
    });
    expect(gcsMocks.getGcsObjectMetadata).toHaveBeenCalledTimes(2);
  });
});

describe("resolveOrRejectUpload", () => {
  const pending = {
    bucketName: "test-unscanned-bucket",
    objectKey: "applications/app-1/documents/doc-1.pdf",
    contentType: PDF_MIME,
  };
  const prisma = {} as never;

  it("returns the resolved ref when verification succeeds", async () => {
    gcsMocks.getGcsObjectMetadata.mockResolvedValue({ size: "1024" });
    gcsMocks.downloadGcsObjectHead.mockResolvedValue(PDF_HEAD);

    await expect(
      resolveOrRejectUpload(prisma, "doc-1", pending),
    ).resolves.toEqual({
      bucketName: "test-unscanned-bucket",
      objectKey: pending.objectKey,
    });
  });

  it("throws UPLOAD_FAILED without rejecting when the object isn't found anywhere", async () => {
    gcsMocks.getGcsObjectMetadata.mockRejectedValue(notFoundError());

    await expect(
      resolveOrRejectUpload(prisma, "doc-1", pending),
    ).rejects.toMatchObject({ message: DOCUMENT_UPLOAD_ERROR.UPLOAD_FAILED });
    expect(helperMocks.markDocumentRejected).not.toHaveBeenCalled();
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("rejects the row and deletes the object on a type mismatch", async () => {
    const resolvedRef = {
      bucketName: "test-unscanned-bucket",
      objectKey: pending.objectKey,
    };
    gcsMocks.getGcsObjectMetadata.mockResolvedValue({ size: "1024" });
    gcsMocks.downloadGcsObjectHead.mockResolvedValue(Buffer.from("not a pdf"));

    await expect(
      resolveOrRejectUpload(prisma, "doc-1", pending),
    ).rejects.toMatchObject({ message: DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH });
    expect(helperMocks.markDocumentRejected).toHaveBeenCalledWith(
      prisma,
      "doc-1",
      DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH,
    );
    expect(gcsMocks.deleteGcsObject).toHaveBeenCalledWith(resolvedRef);
  });
});
