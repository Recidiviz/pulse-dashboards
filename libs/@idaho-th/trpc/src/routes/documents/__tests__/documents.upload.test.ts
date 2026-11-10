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

import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApplicationStage,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { STAFF_CASE_CLOSED_MESSAGE } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";

import { DOCUMENT_UPLOAD_ERROR } from "../documents.constants";
import { requestDocumentUploadSchema } from "../documents.schema";
import {
  confirmDocumentUpload,
  requestDigitizedDocumentUploadForStaff,
  requestDocumentUpload,
} from "../documents.service";

const gcsMocks = vi.hoisted(() => ({
  generateResumableUploadUrl: vi.fn(),
  deleteGcsObject: vi.fn(),
}));

const resolveMock = vi.hoisted(() => ({
  resolveOrRejectUpload: vi.fn(),
}));

const sentryMocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock("@sentry/node", () => ({ ...sentryMocks }));

function mockRequestPrisma(overrides?: {
  findFirst?: ReturnType<typeof vi.fn>;
  create?: ReturnType<typeof vi.fn>;
  count?: ReturnType<typeof vi.fn>;
  documentFindFirst?: ReturnType<typeof vi.fn>;
}) {
  const findFirst =
    overrides?.findFirst ??
    vi.fn().mockResolvedValue({
      staffApplication: { stage: ApplicationStage.APPLICATION },
    });
  const create = overrides?.create ?? vi.fn().mockResolvedValue(undefined);
  const count = overrides?.count ?? vi.fn().mockResolvedValue(0);
  // Used by staffApplicationHasDigitizedDocument (a different model/query
  // than the application-ownership `findFirst` above): defaults to "no
  // existing digitized document" so the happy path isn't blocked.
  const documentFindFirst =
    overrides?.documentFindFirst ?? vi.fn().mockResolvedValue(null);
  const $executeRaw = vi.fn().mockResolvedValue(undefined);
  const documentDb = { create, count, findFirst: documentFindFirst };
  const tx = {
    housingApplicationDocument: documentDb,
    $executeRaw,
  };
  return {
    prisma: {
      housingApplication: { findFirst },
      housingApplicationDocument: documentDb,
      $executeRaw,
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as never,
    findFirst,
    create,
    count,
    documentFindFirst,
  };
}

vi.mock("~@idaho-th/trpc/storage/gcs", () => ({
  assertScanPipelineConfigured: () => undefined,
  gcsConfig: {
    bucketName: "test-bucket",
    skipDocumentScan: false,
    malwareScanEnabled: true,
  },
  generateResumableUploadUrl: gcsMocks.generateResumableUploadUrl,
  deleteGcsObject: gcsMocks.deleteGcsObject,
  resolveUnscannedUploadBucketName: () => "test-bucket",
}));

const { gcsConfig } = await import("~@idaho-th/trpc/storage/gcs");

vi.mock("~@idaho-th/trpc/routes/documents/documents.verifyUpload", () => ({
  resolveOrRejectUpload: resolveMock.resolveOrRejectUpload,
}));

const applicationId = "app-1";
const staffPseudonymizedId = "staff-1";
const providerPseudonymizedId = "provider-1";
const housingProviderId = "housing-provider-1";
const PDF_MIME = "application/pdf";

const staffUploader = {
  audience: HousingApplicationDocumentUploader.STAFF,
  staffPseudonymizedId,
} as const;
const providerUploader = {
  audience: HousingApplicationDocumentUploader.PROVIDER,
  providerId: housingProviderId,
  uploadedByPseudonymizedId: providerPseudonymizedId,
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  gcsConfig.skipDocumentScan = false;
  gcsConfig.malwareScanEnabled = true;
  gcsMocks.generateResumableUploadUrl.mockResolvedValue("https://signed-url");
  gcsMocks.deleteGcsObject.mockResolvedValue(undefined);
  resolveMock.resolveOrRejectUpload.mockResolvedValue({
    bucketName: "test-bucket",
    objectKey: "unset",
  });
});

describe("requestDocumentUploadSchema", () => {
  it("strips a client-supplied documentType instead of passing it through", () => {
    const parsed = requestDocumentUploadSchema.parse({
      applicationId: "11111111-1111-1111-1111-111111111111",
      fileName: "x.pdf",
      mimeType: PDF_MIME,
      sizeBytes: 1024,
      documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
    });

    expect(parsed).not.toHaveProperty("documentType");
  });
});

describe("requestDocumentUpload", () => {
  it("rejects an unsupported file type before any work", async () => {
    const prisma = {} as never;

    await expect(
      requestDocumentUpload(prisma, staffUploader, {
        applicationId,
        fileName: "x.zip",
        mimeType: "application/zip",
        sizeBytes: 1024,
      }),
    ).rejects.toMatchObject({
      message: DOCUMENT_UPLOAD_ERROR.UNSUPPORTED_FILE_TYPE,
    });
    expect(gcsMocks.generateResumableUploadUrl).not.toHaveBeenCalled();
  });

  it("rejects a file larger than the max", async () => {
    const prisma = {} as never;

    await expect(
      requestDocumentUpload(prisma, staffUploader, {
        applicationId,
        fileName: "big.pdf",
        mimeType: PDF_MIME,
        sizeBytes: 51 * 1024 * 1024,
      }),
    ).rejects.toMatchObject({ message: DOCUMENT_UPLOAD_ERROR.FILE_TOO_LARGE });
  });

  it("creates a PENDING row and returns a resumable URL for staff", async () => {
    const { prisma, create } = mockRequestPrisma();

    const result = await requestDocumentUpload(prisma, staffUploader, {
      applicationId,
      fileName: "intake notes.pdf",
      mimeType: PDF_MIME,
      sizeBytes: 2048,
    });

    expect(result.uploadUrl).toBe("https://signed-url");
    expect(result.documentId).toBeTruthy();
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: result.documentId,
        applicationId,
        uploadedByType: HousingApplicationDocumentUploader.STAFF,
        uploadedByPseudonymizedId: staffPseudonymizedId,
        scopedProviderId: null,
        documentType: HousingApplicationDocumentType.ATTACHMENT,
        bucketName: "test-bucket",
        contentType: PDF_MIME,
        fileSizeBytes: 2048,
      }),
    });
  });

  it("scopes a provider upload to that provider's provider", async () => {
    const { prisma, create } = mockRequestPrisma({
      findFirst: vi.fn().mockResolvedValue({
        providerApplications: [{ stage: ApplicationStage.APPLICATION }],
      }),
    });

    await requestDocumentUpload(prisma, providerUploader, {
      applicationId,
      fileName: "proof.png",
      mimeType: "image/png",
      sizeBytes: 4096,
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
        uploadedByPseudonymizedId: providerPseudonymizedId,
        scopedProviderId: housingProviderId,
      }),
    });
  });

  it("forbids a closed provider from uploading", async () => {
    const { prisma, create } = mockRequestPrisma({
      findFirst: vi.fn().mockResolvedValue({
        providerApplications: [{ stage: ApplicationStage.CLOSED }],
      }),
    });

    await expect(
      requestDocumentUpload(prisma, providerUploader, {
        applicationId,
        fileName: "late.pdf",
        mimeType: PDF_MIME,
        sizeBytes: 1024,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects once the uploader hits the daily upload quota", async () => {
    const { prisma, create } = mockRequestPrisma({
      count: vi.fn().mockResolvedValue(75),
    });

    await expect(
      requestDocumentUpload(prisma, staffUploader, {
        applicationId,
        fileName: "one-too-many.pdf",
        mimeType: PDF_MIME,
        sizeBytes: 1024,
      }),
    ).rejects.toMatchObject({
      message: DOCUMENT_UPLOAD_ERROR.DAILY_UPLOAD_QUOTA_EXCEEDED,
    });
    expect(create).not.toHaveBeenCalled();
    expect(gcsMocks.generateResumableUploadUrl).not.toHaveBeenCalled();
  });

  it("scopes the quota count to the uploader's own type and pseudonymized id", async () => {
    const { prisma, count } = mockRequestPrisma();

    await requestDocumentUpload(prisma, staffUploader, {
      applicationId,
      fileName: "notes.pdf",
      mimeType: PDF_MIME,
      sizeBytes: 1024,
    });

    expect(count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        uploadedByType: HousingApplicationDocumentUploader.STAFF,
        uploadedByPseudonymizedId: staffPseudonymizedId,
        status: HousingApplicationDocumentStatus.CONFIRMED,
        confirmedAt: { gte: expect.any(Date) },
      }),
    });
  });
});

describe("requestDigitizedDocumentUploadForStaff", () => {
  it("rejects anything other than application/pdf before any work", async () => {
    const prisma = {} as never;

    await expect(
      requestDigitizedDocumentUploadForStaff(prisma, staffPseudonymizedId, {
        applicationId,
        fileName: "x.png",
        mimeType: "image/png",
        sizeBytes: 1024,
      }),
    ).rejects.toMatchObject({
      message: DOCUMENT_UPLOAD_ERROR.UNSUPPORTED_FILE_TYPE,
    });
    expect(gcsMocks.generateResumableUploadUrl).not.toHaveBeenCalled();
  });

  it("rejects a file larger than the max", async () => {
    const prisma = {} as never;

    await expect(
      requestDigitizedDocumentUploadForStaff(prisma, staffPseudonymizedId, {
        applicationId,
        fileName: "big.pdf",
        mimeType: PDF_MIME,
        sizeBytes: 51 * 1024 * 1024,
      }),
    ).rejects.toMatchObject({ message: DOCUMENT_UPLOAD_ERROR.FILE_TOO_LARGE });
  });

  it("creates a PENDING row tagged DIGITIZED and returns a resumable URL", async () => {
    const { prisma, create } = mockRequestPrisma();

    const result = await requestDigitizedDocumentUploadForStaff(
      prisma,
      staffPseudonymizedId,
      {
        applicationId,
        fileName: "Jane Doe_digitized-application.pdf",
        mimeType: PDF_MIME,
        sizeBytes: 2048,
      },
    );

    expect(result.uploadUrl).toBe("https://signed-url");
    expect(result.documentId).toBeTruthy();
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: result.documentId,
        applicationId,
        uploadedByType: HousingApplicationDocumentUploader.STAFF,
        uploadedByPseudonymizedId: staffPseudonymizedId,
        documentType: HousingApplicationDocumentType.DIGITIZED,
        bucketName: "test-bucket",
        contentType: PDF_MIME,
        fileSizeBytes: 2048,
      }),
    });
  });

  it("rejects once the uploader hits the daily upload quota, before requesting a signed URL", async () => {
    const { prisma, create } = mockRequestPrisma({
      count: vi.fn().mockResolvedValue(75),
    });

    await expect(
      requestDigitizedDocumentUploadForStaff(prisma, staffPseudonymizedId, {
        applicationId,
        fileName: "Jane Doe_digitized-application.pdf",
        mimeType: PDF_MIME,
        sizeBytes: 2048,
      }),
    ).rejects.toMatchObject({
      message: DOCUMENT_UPLOAD_ERROR.DAILY_UPLOAD_QUOTA_EXCEEDED,
    });
    expect(create).not.toHaveBeenCalled();
    expect(gcsMocks.generateResumableUploadUrl).not.toHaveBeenCalled();
  });

  it("rejects when the application already has a digitized document", async () => {
    const { prisma, create } = mockRequestPrisma({
      documentFindFirst: vi.fn().mockResolvedValue({ id: "existing-doc" }),
    });

    await expect(
      requestDigitizedDocumentUploadForStaff(prisma, staffPseudonymizedId, {
        applicationId,
        fileName: "Jane Doe_digitized-application.pdf",
        mimeType: PDF_MIME,
        sizeBytes: 2048,
      }),
    ).rejects.toMatchObject({
      message: "This application already has a digitized document",
    });
    expect(create).not.toHaveBeenCalled();
    expect(gcsMocks.generateResumableUploadUrl).not.toHaveBeenCalled();
  });

  it("forbids a staff caller who can't access the application", async () => {
    const { prisma, create } = mockRequestPrisma({
      findFirst: vi.fn().mockResolvedValue(null),
    });

    await expect(
      requestDigitizedDocumentUploadForStaff(prisma, staffPseudonymizedId, {
        applicationId,
        fileName: "Jane Doe_digitized-application.pdf",
        mimeType: PDF_MIME,
        sizeBytes: 2048,
      }),
    ).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });
});

describe("confirmDocumentUpload", () => {
  function pendingPrisma() {
    const findFirst = vi.fn().mockResolvedValue({
      id: "doc-1",
      applicationId,
      bucketName: "test-bucket",
      objectKey: "applications/app-1/documents/doc-1.pdf",
      contentType: PDF_MIME,
      fileName: "intake notes.pdf",
      documentType: HousingApplicationDocumentType.ATTACHMENT,
      application: { clientName: "Jane Doe" },
    });
    const update = vi.fn().mockResolvedValue({
      id: "doc-1",
      fileName: "intake notes.pdf",
      documentType: HousingApplicationDocumentType.ATTACHMENT,
      uploadedByType: HousingApplicationDocumentUploader.STAFF,
      uploadedByPseudonymizedId: staffPseudonymizedId,
      scopedProviderId: null,
      fileSizeBytes: 2048,
      contentType: PDF_MIME,
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    });
    const count = vi.fn().mockResolvedValue(0);
    const $executeRaw = vi.fn().mockResolvedValue(undefined);
    const timelineEventCreate = vi.fn().mockResolvedValue(undefined);
    const housingApplicationFindFirst = vi.fn().mockResolvedValue({
      staffApplication: { stage: ApplicationStage.APPLICATION },
    });
    const documentDb = { findFirst, update, count };
    const tx = {
      housingApplicationDocument: documentDb,
      housingApplicationTimelineEvent: { create: timelineEventCreate },
      housingApplication: {
        findFirst: housingApplicationFindFirst,
        update: vi.fn(),
      },
      $executeRaw,
    };
    return {
      prisma: {
        housingApplicationDocument: documentDb,
        housingApplication: { findFirst: housingApplicationFindFirst },
        $executeRaw,
        $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
          callback(tx),
        ),
      } as never,
      findFirst,
      update,
      count,
      timelineEventCreate,
      housingApplicationFindFirst,
    };
  }

  it("throws UPLOAD_NOT_FOUND when there is no pending row for the uploader", async () => {
    const prisma = {
      housingApplicationDocument: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as never;

    await expect(
      confirmDocumentUpload(prisma, staffUploader, "doc-1"),
    ).rejects.toMatchObject({
      message: DOCUMENT_UPLOAD_ERROR.UPLOAD_NOT_FOUND,
    });
  });

  it("resolves against the pending row's bucket/objectKey/contentType", async () => {
    const { prisma } = pendingPrisma();

    await confirmDocumentUpload(prisma, staffUploader, "doc-1");

    expect(resolveMock.resolveOrRejectUpload).toHaveBeenCalledWith(
      prisma,
      "doc-1",
      expect.objectContaining({
        bucketName: "test-bucket",
        objectKey: "applications/app-1/documents/doc-1.pdf",
        contentType: PDF_MIME,
      }),
    );
  });

  it("throws UPLOAD_FAILED, without rejecting the row, when the object isn't found in the stored or clean bucket (never landed or ClamAV flagged it INFECTED)", async () => {
    resolveMock.resolveOrRejectUpload.mockRejectedValue(
      new TRPCError({
        code: "BAD_REQUEST",
        message: DOCUMENT_UPLOAD_ERROR.UPLOAD_FAILED,
      }),
    );
    const { prisma, update } = pendingPrisma();

    await expect(
      confirmDocumentUpload(prisma, staffUploader, "doc-1"),
    ).rejects.toMatchObject({ message: DOCUMENT_UPLOAD_ERROR.UPLOAD_FAILED });
    expect(update).not.toHaveBeenCalled();
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("rejects and deletes the object on a type mismatch", async () => {
    resolveMock.resolveOrRejectUpload.mockRejectedValue(
      new TRPCError({
        code: "BAD_REQUEST",
        message: DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH,
      }),
    );
    const { prisma, update } = pendingPrisma();

    await expect(
      confirmDocumentUpload(prisma, staffUploader, "doc-1"),
    ).rejects.toMatchObject({ message: DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH });

    expect(update).not.toHaveBeenCalled();
  });

  it("confirms a clean upload and returns the mapped document", async () => {
    const { prisma, update } = pendingPrisma();

    const result = await confirmDocumentUpload(prisma, staffUploader, "doc-1");

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CONFIRMED",
          bucketName: "test-bucket",
        }),
      }),
    );
    expect(result).toMatchObject({
      id: "doc-1",
      fileName: "intake notes.pdf",
      canDelete: true,
    });
  });

  it("confirms against cleanBucketName and persists it when ClamAV already moved the object there", async () => {
    resolveMock.resolveOrRejectUpload.mockResolvedValue({
      bucketName: "test-clean-bucket",
      objectKey: "applications/app-1/documents/doc-1.pdf",
    });
    const { prisma, update } = pendingPrisma();

    await confirmDocumentUpload(prisma, staffUploader, "doc-1");

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bucketName: "test-clean-bucket" }),
      }),
    );
  });

  it.each([true, false])(
    "marks the document CLEAN immediately when skipDocumentScan is set (dev only), with malwareScanEnabled=%s",
    async (malwareScanEnabled) => {
      gcsConfig.skipDocumentScan = true;
      gcsConfig.malwareScanEnabled = malwareScanEnabled;
      try {
        const { prisma, update } = pendingPrisma();

        await confirmDocumentUpload(prisma, staffUploader, "doc-1");

        expect(update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ scanStatus: "CLEAN" }),
          }),
        );
      } finally {
        gcsConfig.skipDocumentScan = false;
        gcsConfig.malwareScanEnabled = true;
      }
    },
  );

  it("leaves scanStatus untouched (defaults to PENDING) when skipDocumentScan is off", async () => {
    const { prisma, update } = pendingPrisma();

    await confirmDocumentUpload(prisma, staffUploader, "doc-1");

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ scanStatus: expect.anything() }),
      }),
    );
  });

  it("records a DOCUMENT_UPLOADED event visible to all providers for a CM upload", async () => {
    const { prisma, timelineEventCreate } = pendingPrisma();

    await confirmDocumentUpload(prisma, staffUploader, "doc-1");

    expect(timelineEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId,
        eventType: TimelineEventType.DOCUMENT_UPLOADED,
        description: "Document intake notes.pdf uploaded",
        scopedProviderId: null,
      }),
    });
  });

  it("scopes the DOCUMENT_UPLOADED event to the uploading provider", async () => {
    const { prisma, timelineEventCreate, housingApplicationFindFirst } =
      pendingPrisma();
    housingApplicationFindFirst.mockResolvedValue({
      providerApplications: [
        {
          stage: ApplicationStage.APPLICATION,
          providerId: "provider-id-1",
          provider: { name: "Sunrise House" },
        },
      ],
    });

    await confirmDocumentUpload(prisma, providerUploader, "doc-1");

    expect(timelineEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId,
        eventType: TimelineEventType.DOCUMENT_UPLOADED,
        description: "Sunrise House uploaded intake notes.pdf",
        scopedProviderId: "provider-id-1",
      }),
    });
  });

  it("reports to Sentry and skips the timeline event when the provider's scope disappears between the access check and the transaction", async () => {
    const { prisma, timelineEventCreate, housingApplicationFindFirst } =
      pendingPrisma();
    // assertUploaderCanAccessApplication reads outside any transaction, then
    // GCS verification (real I/O) runs, then the transaction re-reads for
    // scope — the provider's application row can change in that window
    // (e.g. declined) even though access was already granted.
    housingApplicationFindFirst
      .mockResolvedValueOnce({
        providerApplications: [{ stage: ApplicationStage.APPLICATION }],
      })
      .mockResolvedValueOnce({ providerApplications: [] });

    // The document is still confirmed; only the audit event is lost.
    await expect(
      confirmDocumentUpload(prisma, providerUploader, "doc-1"),
    ).resolves.toMatchObject({ id: "doc-1" });

    expect(timelineEventCreate).not.toHaveBeenCalled();
    expect(sentryMocks.captureMessage).toHaveBeenCalledWith(
      "Provider upload could not resolve a timeline scope",
      expect.objectContaining({
        level: "warning",
        extra: {
          applicationId,
          uploaderPseudonymizedId: providerPseudonymizedId,
        },
      }),
    );
  });

  it("rejects confirm when the daily confirmed-document quota is already exhausted", async () => {
    const { prisma, update, count } = pendingPrisma();
    count.mockResolvedValue(75);

    await expect(
      confirmDocumentUpload(prisma, staffUploader, "doc-1"),
    ).rejects.toMatchObject({
      message: DOCUMENT_UPLOAD_ERROR.DAILY_UPLOAD_QUOTA_EXCEEDED,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects confirm when the staff case was closed after upload was requested", async () => {
    const { prisma, housingApplicationFindFirst } = pendingPrisma();
    housingApplicationFindFirst.mockResolvedValue({
      staffApplication: { stage: ApplicationStage.CLOSED },
    });

    await expect(
      confirmDocumentUpload(prisma, staffUploader, "doc-1"),
    ).rejects.toThrow(STAFF_CASE_CLOSED_MESSAGE);
  });
});
