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

import { HousingApplicationDocumentScanStatus } from "~@idaho-th/prisma/client";
import {
  DOCUMENT_UPLOAD_ERROR,
  MAX_VERTEX_UPLOAD_BYTES,
} from "~@idaho-th/shared";

import {
  cancelVertexUpload,
  confirmVertexUpload,
  getVertexUploadScanStatus,
  requestVertexUpload,
} from "../vertexUpload.upload.service";

const gcsMocks = vi.hoisted(() => ({
  generateResumableUploadUrl: vi.fn(),
  deleteGcsObject: vi.fn(),
}));

const documentHelperMocks = vi.hoisted(() => ({
  findOwnedPendingDocument: vi.fn(),
  markDocumentConfirmed: vi.fn(),
  markDocumentRejected: vi.fn(),
  findStaffDocumentForScanStatus: vi.fn(),
}));

const resolveMock = vi.hoisted(() => ({
  resolveConfirmableUploadRef: vi.fn(),
}));

const draftIntakeMocks = vi.hoisted(() => ({
  createDraftIntakeApplicationShell: vi.fn(),
  cleanupIntakeShell: vi.fn(),
  tryCleanupIntakeShell: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/storage/gcs", () => {
  const mockedGcsConfig: {
    bucketName: string;
    quarantinedBucketName: string | undefined;
    skipDocumentScan: boolean;
  } = {
    bucketName: "test-bucket",
    quarantinedBucketName: "test-quarantine-bucket",
    skipDocumentScan: false,
  };
  return {
    assertScanPipelineConfigured: () => undefined,
    gcsConfig: mockedGcsConfig,
    // Mirrors the real helper: uploads always target bucketName, never the
    // scan pipeline's quarantined bucket (the app SA can't write there).
    resolveUnscannedUploadBucketName: () => mockedGcsConfig.bucketName,
    generateResumableUploadUrl: gcsMocks.generateResumableUploadUrl,
    deleteGcsObject: gcsMocks.deleteGcsObject,
  };
});

const { gcsConfig } = await import("~@idaho-th/trpc/storage/gcs");

vi.mock("~@idaho-th/trpc/routes/documents/documents.helpers", () => ({
  findOwnedPendingDocument: documentHelperMocks.findOwnedPendingDocument,
  markDocumentConfirmed: documentHelperMocks.markDocumentConfirmed,
  markDocumentRejected: documentHelperMocks.markDocumentRejected,
  findStaffDocumentForScanStatus:
    documentHelperMocks.findStaffDocumentForScanStatus,
}));

vi.mock("~@idaho-th/trpc/routes/documents/documents.verifyUpload", () => ({
  resolveConfirmableUploadRef: resolveMock.resolveConfirmableUploadRef,
}));

vi.mock("~@idaho-th/trpc/routes/draftIntake/draftIntake.service", () => ({
  createDraftIntakeApplicationShell:
    draftIntakeMocks.createDraftIntakeApplicationShell,
}));

vi.mock("~@idaho-th/trpc/routes/draftIntake/draftIntake.cleanup", () => ({
  cleanupIntakeShell: draftIntakeMocks.cleanupIntakeShell,
  tryCleanupIntakeShell: draftIntakeMocks.tryCleanupIntakeShell,
}));

const staffPseudonymizedId = "staff-1";
const PDF_MIME = "application/pdf";

beforeEach(() => {
  vi.clearAllMocks();
  gcsConfig.skipDocumentScan = false;
  gcsMocks.generateResumableUploadUrl.mockResolvedValue("https://signed-url");
  gcsMocks.deleteGcsObject.mockResolvedValue(undefined);
  resolveMock.resolveConfirmableUploadRef.mockResolvedValue({
    ok: true,
    ref: { bucketName: "test-bucket", objectKey: "unset" },
  });
  draftIntakeMocks.createDraftIntakeApplicationShell.mockResolvedValue({
    applicationId: "app-1",
    documentId: "doc-1",
  });
  draftIntakeMocks.cleanupIntakeShell.mockResolvedValue(true);
  draftIntakeMocks.tryCleanupIntakeShell.mockResolvedValue(undefined);
});

describe("requestVertexUpload", () => {
  it("rejects a file larger than the max before doing any work", async () => {
    const prisma = {} as never;

    await expect(
      requestVertexUpload(prisma, staffPseudonymizedId, {
        fileName: "big.pdf",
        mimeType: PDF_MIME,
        // One byte past the limit: would have passed under the old 50 MB
        // MAX_DOCUMENT_BYTES alias, so this also pins the stricter limit.
        sizeBytes: MAX_VERTEX_UPLOAD_BYTES + 1,
      }),
    ).rejects.toMatchObject({ message: DOCUMENT_UPLOAD_ERROR.FILE_TOO_LARGE });
    expect(gcsMocks.generateResumableUploadUrl).not.toHaveBeenCalled();
  });

  it("creates a PENDING shell application in the main bucket and returns a resumable URL", async () => {
    const prisma = {} as never;

    const result = await requestVertexUpload(prisma, staffPseudonymizedId, {
      fileName: "intake.pdf",
      mimeType: PDF_MIME,
      sizeBytes: 2048,
    });

    expect(result).toEqual({
      applicationId: expect.any(String),
      documentId: "doc-1",
      uploadUrl: "https://signed-url",
    });
    expect(gcsMocks.generateResumableUploadUrl).toHaveBeenCalledWith(
      expect.objectContaining({ bucketName: "test-bucket" }),
    );
    expect(
      draftIntakeMocks.createDraftIntakeApplicationShell,
    ).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        staffPseudonymizedId,
        documentStatus: "PENDING",
        document: expect.objectContaining({
          bucketName: "test-bucket",
          contentType: PDF_MIME,
          fileSizeBytes: 2048,
        }),
      }),
    );
  });

  it("never uploads to the quarantine bucket even when it is configured", async () => {
    const prisma = {} as never;

    await requestVertexUpload(prisma, staffPseudonymizedId, {
      fileName: "intake.pdf",
      mimeType: PDF_MIME,
      sizeBytes: 2048,
    });

    expect(gcsMocks.generateResumableUploadUrl).not.toHaveBeenCalledWith(
      expect.objectContaining({ bucketName: "test-quarantine-bucket" }),
    );
  });

  it("throws when the shell was created without a document row", async () => {
    draftIntakeMocks.createDraftIntakeApplicationShell.mockResolvedValue({
      applicationId: "app-1",
      documentId: undefined,
    });
    const prisma = {} as never;

    await expect(
      requestVertexUpload(prisma, staffPseudonymizedId, {
        fileName: "intake.pdf",
        mimeType: PDF_MIME,
        sizeBytes: 2048,
      }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});

describe("confirmVertexUpload", () => {
  const pending = {
    id: "doc-1",
    applicationId: "app-1",
    bucketName: "test-bucket",
    objectKey: "applications/staff/staff-1/HANDWRITTEN_SOURCE/x.pdf",
    contentType: PDF_MIME,
  };

  it("throws UPLOAD_NOT_FOUND when there is no pending row for the staff member", async () => {
    documentHelperMocks.findOwnedPendingDocument.mockResolvedValue(null);
    const prisma = {} as never;

    await expect(
      confirmVertexUpload(prisma, staffPseudonymizedId, "doc-1"),
    ).rejects.toMatchObject({
      message: DOCUMENT_UPLOAD_ERROR.UPLOAD_NOT_FOUND,
    });
  });

  it("resolves against the pending row's bucket/objectKey/contentType", async () => {
    documentHelperMocks.findOwnedPendingDocument.mockResolvedValue(pending);
    resolveMock.resolveConfirmableUploadRef.mockResolvedValue({
      ok: true,
      ref: { bucketName: "test-bucket", objectKey: pending.objectKey },
    });
    const prisma = {} as never;

    await confirmVertexUpload(prisma, staffPseudonymizedId, "doc-1");

    expect(resolveMock.resolveConfirmableUploadRef).toHaveBeenCalledWith(
      expect.objectContaining({
        bucketName: pending.bucketName,
        objectKey: pending.objectKey,
        contentType: pending.contentType,
      }),
    );
  });

  it("throws UPLOAD_FAILED, without deleting a GCS object, when the object isn't found in the stored or clean bucket (never landed or ClamAV flagged it INFECTED)", async () => {
    documentHelperMocks.findOwnedPendingDocument.mockResolvedValue(pending);
    // No ref: the object was found in neither bucket, so there is nothing to
    // delete — but the empty intake shell must still be cleaned up.
    resolveMock.resolveConfirmableUploadRef.mockResolvedValue({
      ok: false,
      code: DOCUMENT_UPLOAD_ERROR.UPLOAD_FAILED,
    });
    const prisma = {} as never;

    await expect(
      confirmVertexUpload(prisma, staffPseudonymizedId, "doc-1"),
    ).rejects.toMatchObject({ message: DOCUMENT_UPLOAD_ERROR.UPLOAD_FAILED });
    expect(documentHelperMocks.markDocumentConfirmed).not.toHaveBeenCalled();
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
    expect(draftIntakeMocks.tryCleanupIntakeShell).toHaveBeenCalledWith(
      prisma,
      "app-1",
      staffPseudonymizedId,
    );
  });

  it("rejects and deletes the shell on a type mismatch", async () => {
    documentHelperMocks.findOwnedPendingDocument.mockResolvedValue(pending);
    resolveMock.resolveConfirmableUploadRef.mockResolvedValue({
      ok: false,
      ref: { bucketName: "test-bucket", objectKey: pending.objectKey },
      code: DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH,
    });
    const prisma = {} as never;

    await expect(
      confirmVertexUpload(prisma, staffPseudonymizedId, "doc-1"),
    ).rejects.toMatchObject({ message: DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH });
    expect(gcsMocks.deleteGcsObject).toHaveBeenCalled();
    expect(draftIntakeMocks.tryCleanupIntakeShell).toHaveBeenCalledWith(
      prisma,
      "app-1",
      staffPseudonymizedId,
    );
    expect(documentHelperMocks.markDocumentRejected).not.toHaveBeenCalled();
    expect(documentHelperMocks.markDocumentConfirmed).not.toHaveBeenCalled();
  });

  it("confirms a valid upload, leaving scanStatus untouched by default", async () => {
    documentHelperMocks.findOwnedPendingDocument.mockResolvedValue(pending);
    resolveMock.resolveConfirmableUploadRef.mockResolvedValue({
      ok: true,
      ref: { bucketName: "test-bucket", objectKey: pending.objectKey },
    });
    const prisma = {} as never;

    await confirmVertexUpload(prisma, staffPseudonymizedId, "doc-1");

    expect(documentHelperMocks.markDocumentConfirmed).toHaveBeenCalledWith(
      prisma,
      "doc-1",
      { bucketName: "test-bucket", scanStatus: undefined },
    );
  });

  it("confirms against cleanBucketName and persists it when ClamAV already moved the object there", async () => {
    documentHelperMocks.findOwnedPendingDocument.mockResolvedValue(pending);
    resolveMock.resolveConfirmableUploadRef.mockResolvedValue({
      ok: true,
      ref: { bucketName: "test-clean-bucket", objectKey: pending.objectKey },
    });
    const prisma = {} as never;

    await confirmVertexUpload(prisma, staffPseudonymizedId, "doc-1");

    expect(documentHelperMocks.markDocumentConfirmed).toHaveBeenCalledWith(
      prisma,
      "doc-1",
      { bucketName: "test-clean-bucket", scanStatus: undefined },
    );
  });

  it("marks scanStatus CLEAN immediately when skipDocumentScan is set (dev only)", async () => {
    documentHelperMocks.findOwnedPendingDocument.mockResolvedValue(pending);
    resolveMock.resolveConfirmableUploadRef.mockResolvedValue({
      ok: true,
      ref: { bucketName: "test-bucket", objectKey: pending.objectKey },
    });
    gcsConfig.skipDocumentScan = true;
    try {
      const prisma = {} as never;

      await confirmVertexUpload(prisma, staffPseudonymizedId, "doc-1");

      expect(documentHelperMocks.markDocumentConfirmed).toHaveBeenCalledWith(
        prisma,
        "doc-1",
        {
          bucketName: "test-bucket",
          scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
        },
      );
    } finally {
      gcsConfig.skipDocumentScan = false;
    }
  });
});

describe("getVertexUploadScanStatus", () => {
  it("returns the scanStatus for an owned, confirmed document", async () => {
    documentHelperMocks.findStaffDocumentForScanStatus.mockResolvedValue({
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
    });
    const prisma = {} as never;

    const result = await getVertexUploadScanStatus(
      prisma,
      staffPseudonymizedId,
      "doc-1",
    );

    expect(result).toEqual({
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
    });
  });

  it("throws NOT_FOUND when the document isn't owned or doesn't exist", async () => {
    documentHelperMocks.findStaffDocumentForScanStatus.mockResolvedValue(null);
    const prisma = {} as never;

    await expect(
      getVertexUploadScanStatus(prisma, staffPseudonymizedId, "doc-1"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("cancelVertexUpload", () => {
  it("delegates to cleanupIntakeShell and returns whether a shell was deleted", async () => {
    const prisma = {} as never;

    const result = await cancelVertexUpload(
      prisma,
      staffPseudonymizedId,
      "app-1",
    );

    expect(result).toEqual({ deleted: true });
    expect(draftIntakeMocks.cleanupIntakeShell).toHaveBeenCalledWith(
      prisma,
      "app-1",
      staffPseudonymizedId,
    );
  });
});
