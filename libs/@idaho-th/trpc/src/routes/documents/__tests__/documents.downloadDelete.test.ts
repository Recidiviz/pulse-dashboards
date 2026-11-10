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

import {
  ApplicationStage,
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentType,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { STAFF_CASE_CLOSED_MESSAGE } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import {
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";

import { providerUploader, staffUploader } from "../documents.helpers";
import {
  deleteDocument,
  getProviderDocumentDownload,
  getStaffDocumentDownload,
  getStaffDocumentPreview,
} from "../documents.service";

const gcsMocks = vi.hoisted(() => ({
  resolveGcsReadAccess: vi.fn(),
  deleteGcsObject: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/storage/gcs", () => ({
  gcsConfig: { bucketName: "test-bucket" },
  resolveGcsReadAccess: gcsMocks.resolveGcsReadAccess,
  deleteGcsObject: gcsMocks.deleteGcsObject,
  generateResumableUploadUrl: vi.fn(),
  gcsObjectExists: vi.fn(),
}));

const sentryMocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock("@sentry/node", () => ({ ...sentryMocks }));

const documentId = "doc-1";
const HOUSING_PROVIDER_ID = "housing-provider-1";
const homePlanCreatedAt = new Date("2026-06-15T00:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  gcsMocks.resolveGcsReadAccess.mockResolvedValue({
    signedUrl: "https://download-url",
    contentBase64: null,
  });
  gcsMocks.deleteGcsObject.mockResolvedValue(undefined);
});

describe("getStaffDocumentDownload", () => {
  function buildStaffPrisma(findFirstResult: unknown) {
    const findFirst = vi.fn().mockResolvedValue(findFirstResult);
    const timelineEventCreate = vi.fn().mockResolvedValue({});
    const tx = {
      housingApplicationDocument: { findFirst },
      housingApplicationTimelineEvent: { create: timelineEventCreate },
    };
    const prisma = {
      ...tx,
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as never;
    return { prisma, findFirst, timelineEventCreate };
  }

  it("returns a download URL with a Content-Disposition filename", async () => {
    const { prisma, timelineEventCreate } = buildStaffPrisma({
      applicationId: "app-1",
      bucketName: "test-bucket",
      objectKey: "applications/app-1/documents/doc-1.pdf",
      fileName: "john_handwritten-application.pdf",
      documentType: HousingApplicationDocumentType.ATTACHMENT,
      scopedProviderId: null,
      application: { clientName: "John" },
    });

    const result = await getStaffDocumentDownload(
      prisma,
      TEST_STAFF_PSEUDONYMIZED_ID,
      documentId,
    );

    expect(result).toEqual({
      fileName: "john_handwritten-application.pdf",
      downloadUrl: "https://download-url",
      contentBase64: null,
    });
    expect(gcsMocks.resolveGcsReadAccess).toHaveBeenCalledWith(
      {
        bucketName: "test-bucket",
        objectKey: "applications/app-1/documents/doc-1.pdf",
      },
      expect.objectContaining({
        responseDisposition:
          'attachment; filename="john_handwritten-application.pdf"',
      }),
    );
    expect(timelineEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId: "app-1",
          eventType: TimelineEventType.DOCUMENT_DOWNLOADED,
          description:
            "Document john_handwritten-application.pdf downloaded by CM",
          actorRole: TimelineActorRole.STAFF,
          actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        }),
      }),
    );
  });

  it("logs the display file name, not the raw uploaded file name, on the timeline event", async () => {
    const { prisma, timelineEventCreate } = buildStaffPrisma({
      applicationId: "app-1",
      bucketName: "test-bucket",
      objectKey: "applications/app-1/documents/doc-1.pdf",
      fileName: "20260116100022229.pdf",
      documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
      scopedProviderId: null,
      application: { clientName: "Jane Doe" },
    });

    await getStaffDocumentDownload(
      prisma,
      TEST_STAFF_PSEUDONYMIZED_ID,
      documentId,
    );

    expect(timelineEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description:
            "Document Jane Doe_handwritten-application.pdf downloaded by CM",
        }),
      }),
    );
  });

  it("throws NOT_FOUND when the document is not visible to the staff member", async () => {
    const { prisma, timelineEventCreate } = buildStaffPrisma(null);

    await expect(
      getStaffDocumentDownload(prisma, TEST_STAFF_PSEUDONYMIZED_ID, documentId),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(timelineEventCreate).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when scanStatus is not CLEAN", async () => {
    const { prisma, findFirst } = buildStaffPrisma(null);

    await expect(
      getStaffDocumentDownload(prisma, TEST_STAFF_PSEUDONYMIZED_ID, documentId),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(gcsMocks.resolveGcsReadAccess).not.toHaveBeenCalled();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
        }),
      }),
    );
  });
});

describe("getStaffDocumentPreview", () => {
  function buildStaffPreviewPrisma(findFirstResult: unknown) {
    const findFirst = vi.fn().mockResolvedValue(findFirstResult);
    const timelineEventCreate = vi.fn().mockResolvedValue({});
    const prisma = {
      housingApplicationDocument: { findFirst },
      housingApplicationTimelineEvent: { create: timelineEventCreate },
      $transaction: vi.fn(),
    } as never;
    return { prisma, findFirst, timelineEventCreate };
  }

  it("returns a URL for the DRAFT application's source document without recording a timeline event", async () => {
    const { prisma, timelineEventCreate } = buildStaffPreviewPrisma({
      applicationId: "app-1",
      bucketName: "test-bucket",
      objectKey: "applications/app-1/documents/doc-1.pdf",
      fileName: "20260116100022229.pdf",
      documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
      scopedProviderId: null,
      application: { clientName: "Jane Doe" },
    });

    const result = await getStaffDocumentPreview(
      prisma,
      TEST_STAFF_PSEUDONYMIZED_ID,
      documentId,
    );

    expect(result.downloadUrl).toBe("https://download-url");
    expect(timelineEventCreate).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when the application is not DRAFT or isn't the staff member's", async () => {
    const { prisma } = buildStaffPreviewPrisma(null);

    await expect(
      getStaffDocumentPreview(prisma, TEST_STAFF_PSEUDONYMIZED_ID, documentId),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("getProviderDocumentDownload", () => {
  function providerDoc(overrides: Record<string, unknown> = {}) {
    return {
      applicationId: "app-1",
      bucketName: "test-bucket",
      objectKey: "applications/app-1/documents/doc-1.pdf",
      fileName: "shared.pdf",
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
      scopedProviderId: null,
      application: {
        providerApplications: [
          {
            providerId: HOUSING_PROVIDER_ID,
            stage: ApplicationStage.APPLICATION,
          },
        ],
        timelineEvents: [],
      },
      ...overrides,
    };
  }

  function buildProviderPrisma(documentFindFirstResult: unknown) {
    const documentFindFirst = vi
      .fn()
      .mockResolvedValue(documentFindFirstResult);
    const applicationFindFirst = vi.fn().mockResolvedValue({
      providerApplications: [
        {
          providerId: HOUSING_PROVIDER_ID,
          provider: { name: "Test Provider" },
        },
      ],
    });
    const timelineEventCreate = vi.fn().mockResolvedValue({});
    const tx = {
      housingApplicationDocument: { findFirst: documentFindFirst },
      housingApplication: { findFirst: applicationFindFirst },
      housingApplicationTimelineEvent: { create: timelineEventCreate },
    };
    const prisma = {
      ...tx,
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as never;
    return {
      prisma,
      documentFindFirst,
      applicationFindFirst,
      timelineEventCreate,
    };
  }

  it("returns a download URL for a visible shared document", async () => {
    const { prisma, timelineEventCreate } = buildProviderPrisma(providerDoc());

    const result = await getProviderDocumentDownload(
      prisma,
      providerUploader(HOUSING_PROVIDER_ID, TEST_PROVIDER_PSEUDONYMIZED_ID),
      documentId,
    );

    expect(result.downloadUrl).toBe("https://download-url");
    expect(timelineEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId: "app-1",
          eventType: TimelineEventType.DOCUMENT_DOWNLOADED,
          description: "Document shared.pdf downloaded by Provider",
          actorRole: TimelineActorRole.PROVIDER,
          actorPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
          scopedProviderId: HOUSING_PROVIDER_ID,
        }),
      }),
    );
  });

  it("reports to Sentry and skips the timeline event when the provider's scope disappears before recording the download", async () => {
    const { prisma, applicationFindFirst, timelineEventCreate } =
      buildProviderPrisma(providerDoc());
    applicationFindFirst.mockResolvedValue({ providerApplications: [] });

    // The download is still granted; only the audit event is lost.
    await expect(
      getProviderDocumentDownload(
        prisma,
        providerUploader(HOUSING_PROVIDER_ID, TEST_PROVIDER_PSEUDONYMIZED_ID),
        documentId,
      ),
    ).resolves.toMatchObject({ downloadUrl: "https://download-url" });

    expect(timelineEventCreate).not.toHaveBeenCalled();
    expect(sentryMocks.captureMessage).toHaveBeenCalledWith(
      "Provider download could not resolve a timeline scope",
      expect.objectContaining({
        level: "warning",
        extra: {
          applicationId: "app-1",
          downloaderPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
        },
      }),
    );
  });

  it("blocks a declined/not-selected provider from a shared doc uploaded after their cutoff (§7.1)", async () => {
    const { prisma, timelineEventCreate } = buildProviderPrisma(
      providerDoc({
        createdAt: new Date("2026-06-20T00:00:00.000Z"),
        application: {
          providerApplications: [
            {
              providerId: HOUSING_PROVIDER_ID,
              stage: ApplicationStage.CLOSED,
            },
          ],
          timelineEvents: [
            {
              eventType: TimelineEventType.PROVIDER_NOT_SELECTED,
              scopedProviderId: HOUSING_PROVIDER_ID,
              createdAt: homePlanCreatedAt,
            },
          ],
        },
      }),
    );

    await expect(
      getProviderDocumentDownload(
        prisma,
        providerUploader(HOUSING_PROVIDER_ID, TEST_PROVIDER_PSEUDONYMIZED_ID),
        documentId,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(gcsMocks.resolveGcsReadAccess).not.toHaveBeenCalled();
    expect(timelineEventCreate).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when the provider cannot see the document", async () => {
    const { prisma, timelineEventCreate } = buildProviderPrisma(null);

    await expect(
      getProviderDocumentDownload(
        prisma,
        providerUploader(HOUSING_PROVIDER_ID, TEST_PROVIDER_PSEUDONYMIZED_ID),
        documentId,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(timelineEventCreate).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when scanStatus is not CLEAN", async () => {
    const { prisma, documentFindFirst } = buildProviderPrisma(null);

    await expect(
      getProviderDocumentDownload(
        prisma,
        providerUploader(HOUSING_PROVIDER_ID, TEST_PROVIDER_PSEUDONYMIZED_ID),
        documentId,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(gcsMocks.resolveGcsReadAccess).not.toHaveBeenCalled();
    expect(documentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
        }),
      }),
    );
  });
});

describe("deleteDocument", () => {
  it("hard-deletes the row and removes the GCS object", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: documentId,
      applicationId: "app-1",
      bucketName: "test-bucket",
      objectKey: "applications/app-1/documents/doc-1.pdf",
    });
    const deleteRow = vi.fn().mockResolvedValue(undefined);
    const prisma = {
      housingApplicationDocument: { findFirst, delete: deleteRow },
      housingApplication: {
        findFirst: vi.fn().mockResolvedValue({
          staffApplication: { stage: ApplicationStage.APPLICATION },
        }),
      },
    } as never;

    const result = await deleteDocument(
      prisma,
      staffUploader(TEST_STAFF_PSEUDONYMIZED_ID),
      documentId,
    );

    expect(result).toEqual({ id: documentId });
    expect(deleteRow).toHaveBeenCalledWith({ where: { id: documentId } });
    expect(gcsMocks.deleteGcsObject).toHaveBeenCalledWith({
      bucketName: "test-bucket",
      objectKey: "applications/app-1/documents/doc-1.pdf",
    });
  });

  it("rejects delete when the staff case is closed", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: documentId,
      applicationId: "app-1",
      bucketName: "test-bucket",
      objectKey: "applications/app-1/documents/doc-1.pdf",
    });
    const deleteRow = vi.fn();
    const prisma = {
      housingApplicationDocument: { findFirst, delete: deleteRow },
      housingApplication: {
        findFirst: vi.fn().mockResolvedValue({
          staffApplication: { stage: ApplicationStage.CLOSED },
        }),
      },
    } as never;

    await expect(
      deleteDocument(
        prisma,
        staffUploader(TEST_STAFF_PSEUDONYMIZED_ID),
        documentId,
      ),
    ).rejects.toThrow(STAFF_CASE_CLOSED_MESSAGE);
    expect(deleteRow).not.toHaveBeenCalled();
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND for a non-owner or system document", async () => {
    const deleteRow = vi.fn();
    const prisma = {
      housingApplicationDocument: {
        findFirst: vi.fn().mockResolvedValue(null),
        delete: deleteRow,
      },
    } as never;

    await expect(
      deleteDocument(
        prisma,
        staffUploader(TEST_STAFF_PSEUDONYMIZED_ID),
        documentId,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(deleteRow).not.toHaveBeenCalled();
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("reports a GCS delete failure to Sentry instead of leaving it silent", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: documentId,
      applicationId: "app-1",
      bucketName: "test-bucket",
      objectKey: "applications/app-1/documents/doc-1.pdf",
    });
    const deleteRow = vi.fn().mockResolvedValue(undefined);
    const prisma = {
      housingApplicationDocument: { findFirst, delete: deleteRow },
      housingApplication: {
        findFirst: vi.fn().mockResolvedValue({
          staffApplication: { stage: ApplicationStage.APPLICATION },
        }),
      },
    } as never;
    const gcsFailure = new Error("bucket unreachable");
    gcsMocks.deleteGcsObject.mockRejectedValueOnce(gcsFailure);

    // The DB row is already gone by this point; a GCS failure here must not
    // fail the caller's delete request.
    await expect(
      deleteDocument(
        prisma,
        staffUploader(TEST_STAFF_PSEUDONYMIZED_ID),
        documentId,
      ),
    ).resolves.toEqual({ id: documentId });
    expect(sentryMocks.captureException).toHaveBeenCalledWith(gcsFailure, {
      extra: { documentId },
    });
  });
});
