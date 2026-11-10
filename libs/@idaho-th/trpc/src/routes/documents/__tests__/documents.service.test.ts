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

import { describe, expect, it, vi } from "vitest";

import {
  ApplicationStage,
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  type PrismaClient,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  createHousingApplication,
  createHousingApplicationDocument,
  createHousingProvider,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { providerUploader } from "../documents.helpers";
import {
  countStuckScanDocuments,
  listProviderDocuments,
  listStaffDocuments,
  sweepStalePendingDocuments,
} from "../documents.service";
import {
  seedProviderDocumentsApplication,
  seedStaffDocumentsApplication,
} from "./documents.fixtures";

const loggerMocks = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/routes/common/logger", () => ({
  getLogger: () => loggerMocks,
}));

const gcsMocks = vi.hoisted(() => ({
  deleteGcsObject: vi.fn().mockResolvedValue(undefined),
}));

// The service module imports the GCS barrel (for the upload flow), which eagerly
// reads env at load. The list paths under test never touch GCS, so stub it.
vi.mock("~@idaho-th/trpc/storage/gcs", () => ({
  gcsConfig: { bucketName: "test-bucket" },
  generateResumableUploadUrl: vi.fn(),
  gcsObjectExists: vi.fn(),
  deleteGcsObject: gcsMocks.deleteGcsObject,
  isGcsNotFoundError: (error: unknown) =>
    error instanceof Error && error.message.includes("No such object"),
}));

describe("listStaffDocuments", () => {
  it("returns only listable documents", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);
    const listable = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      fileName: "jane-doe_handwritten-application.pdf",
    });
    // INFECTED uploads are kept for audit but must not surface in the list.
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      fileName: "infected.pdf",
      scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
    });
    // An upload that was never verified is not a document yet.
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      fileName: "unverified.pdf",
      status: HousingApplicationDocumentStatus.PENDING,
      confirmedAt: null,
    });

    const result = await listStaffDocuments(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      application.id,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: listable.id,
      fileName: "jane-doe_handwritten-application.pdf",
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
    });
  });

  it("throws NOT_FOUND when the staff member does not own the application", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);

    await expect(
      listStaffDocuments(testPrismaClient, "someone-else", application.id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("marks system documents as not deletable even for the uploader", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
      uploadedByPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
    });

    const [document] = await listStaffDocuments(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      application.id,
    );

    expect(document.canDelete).toBe(false);
  });

  it("allows deleting the caller's own attachment uploads", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      documentType: HousingApplicationDocumentType.ATTACHMENT,
      uploadedByPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
    });

    const [document] = await listStaffDocuments(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      application.id,
    );

    expect(document.canDelete).toBe(true);
  });

  it("does not allow deleting another user's attachment", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      documentType: HousingApplicationDocumentType.ATTACHMENT,
      uploadedByPseudonymizedId: "someone-else",
    });

    const [document] = await listStaffDocuments(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      application.id,
    );

    expect(document.canDelete).toBe(false);
  });
});

describe("listProviderDocuments", () => {
  it("throws NOT_FOUND when the provider has no application", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);

    const housingProvider = await createHousingProvider(testPrismaClient);

    await expect(
      listProviderDocuments(
        testPrismaClient,
        providerUploader(housingProvider.id, TEST_PROVIDER_PSEUDONYMIZED_ID),
        application.id,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns shared docs for active providers and hides INFECTED uploads", async () => {
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient);
    const shared = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scopedProviderId: null,
    });
    // INFECTED uploads are kept for audit but must not surface in the list.
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scopedProviderId: null,
      scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
    });

    const result = await listProviderDocuments(
      testPrismaClient,
      providerUploader(housingProvider.id, TEST_PROVIDER_PSEUDONYMIZED_ID),
      application.id,
    );

    expect(result.map((document) => document.id)).toEqual([shared.id]);
  });

  it("hides documents scoped to a different provider", async () => {
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient);
    const shared = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scopedProviderId: null,
    });
    const otherHousingProvider = await createHousingProvider(testPrismaClient);
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      documentType: HousingApplicationDocumentType.ATTACHMENT,
      uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
      uploadedByPseudonymizedId: "other-provider-user",
      scopedProviderId: otherHousingProvider.id,
    });

    const result = await listProviderDocuments(
      testPrismaClient,
      providerUploader(housingProvider.id, TEST_PROVIDER_PSEUDONYMIZED_ID),
      application.id,
    );

    expect(result.map((document) => document.id)).toEqual([shared.id]);
  });

  it("still shows shared docs uploaded after close to the winning provider (§7.1)", async () => {
    // CLOSED with no PROVIDER_DECLINED/NOT_SELECTED event of its own: this
    // provider won the home plan, so it keeps full access.
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient, {
        providerStage: ApplicationStage.CLOSED,
      });
    const pre = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scopedProviderId: null,
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    });
    const post = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scopedProviderId: null,
      createdAt: new Date("2026-06-20T00:00:00.000Z"),
    });
    const own = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      documentType: HousingApplicationDocumentType.ATTACHMENT,
      uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
      uploadedByPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
      scopedProviderId: housingProvider.id,
      createdAt: new Date("2026-06-25T00:00:00.000Z"),
    });

    const result = await listProviderDocuments(
      testPrismaClient,
      providerUploader(housingProvider.id, TEST_PROVIDER_PSEUDONYMIZED_ID),
      application.id,
    );

    expect(result.map((document) => document.id)).toEqual([
      own.id,
      post.id,
      pre.id,
    ]);
  });

  it("hides shared docs uploaded after a declined provider's application closed", async () => {
    const closedAt = new Date("2026-06-15T00:00:00.000Z");
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient, {
        providerStage: ApplicationStage.CLOSED,
        closedEvent: {
          eventType: TimelineEventType.PROVIDER_DECLINED,
          createdAt: closedAt,
        },
      });
    const beforeDecline = await createHousingApplicationDocument(
      testPrismaClient,
      {
        applicationId: application.id,
        scopedProviderId: null,
        createdAt: new Date("2026-06-10T00:00:00.000Z"),
      },
    );
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scopedProviderId: null,
      createdAt: new Date("2026-06-20T00:00:00.000Z"),
    });

    const result = await listProviderDocuments(
      testPrismaClient,
      providerUploader(housingProvider.id, TEST_PROVIDER_PSEUDONYMIZED_ID),
      application.id,
    );

    expect(result.map((document) => document.id)).toEqual([beforeDecline.id]);
  });
});

describe("sweepStalePendingDocuments", () => {
  const OLD = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3h ago
  const RECENT = new Date(Date.now() - 60 * 1000); // 1m ago
  const OLDER_THAN = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2h cutoff

  beforeEach(() => {
    gcsMocks.deleteGcsObject.mockReset().mockResolvedValue(undefined);
    loggerMocks.error.mockClear();
  });

  async function seedApplication(extractionClaimedAt?: Date) {
    const application = await createHousingApplication(testPrismaClient, {
      clientName: "",
      formData: {},
      ...(extractionClaimedAt ? { extractionClaimedAt } : {}),
    });
    return application.id;
  }

  function documentExists(documentId: string) {
    return testPrismaClient.housingApplicationDocument
      .findUnique({ where: { id: documentId }, select: { id: true } })
      .then((row) => row !== null);
  }

  it("deletes an old abandoned PENDING upload and its GCS object", async () => {
    const applicationId = await seedApplication();
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId,
      status: HousingApplicationDocumentStatus.PENDING,
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
      createdAt: OLD,
    });

    await expect(
      sweepStalePendingDocuments(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 1, failed: 0 });
    await expect(documentExists(document.id)).resolves.toBe(false);
    expect(gcsMocks.deleteGcsObject).toHaveBeenCalledWith(
      expect.objectContaining({ objectKey: document.objectKey }),
    );
  });

  it("deletes the GCS object while the row still exists", async () => {
    const applicationId = await seedApplication();
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId,
      status: HousingApplicationDocumentStatus.PENDING,
      createdAt: OLD,
    });
    let rowExistedAtGcsDelete: boolean | undefined;
    gcsMocks.deleteGcsObject.mockImplementation(async () => {
      rowExistedAtGcsDelete = await documentExists(document.id);
    });

    await sweepStalePendingDocuments(testPrismaClient, OLDER_THAN);

    expect(rowExistedAtGcsDelete).toBe(true);
    await expect(documentExists(document.id)).resolves.toBe(false);
  });

  it("leaves an upload that isn't old enough yet", async () => {
    const applicationId = await seedApplication();
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId,
      status: HousingApplicationDocumentStatus.PENDING,
      createdAt: RECENT,
    });

    await expect(
      sweepStalePendingDocuments(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 0 });
    await expect(documentExists(document.id)).resolves.toBe(true);
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("leaves an old PENDING upload whose extraction was claimed 5 minutes ago", async () => {
    const applicationId = await seedApplication(
      new Date(Date.now() - 5 * 60 * 1000),
    );
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId,
      status: HousingApplicationDocumentStatus.PENDING,
      createdAt: OLD,
    });

    await expect(
      sweepStalePendingDocuments(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 0 });
    await expect(documentExists(document.id)).resolves.toBe(true);
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("deletes an old PENDING upload whose extraction was claimed long ago", async () => {
    const applicationId = await seedApplication(
      new Date(Date.now() - 4 * 60 * 60 * 1000),
    );
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId,
      status: HousingApplicationDocumentStatus.PENDING,
      createdAt: OLD,
    });

    await expect(
      sweepStalePendingDocuments(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 1, failed: 0 });
    await expect(documentExists(document.id)).resolves.toBe(false);
  });

  it("never sweeps an INFECTED upload, even if old and still PENDING", async () => {
    const applicationId = await seedApplication();
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId,
      status: HousingApplicationDocumentStatus.PENDING,
      scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
      createdAt: OLD,
    });

    await expect(
      sweepStalePendingDocuments(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 0 });
    await expect(documentExists(document.id)).resolves.toBe(true);
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("leaves an old document that was confirmed in between (race guard)", async () => {
    const applicationId = await seedApplication();
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId,
      status: HousingApplicationDocumentStatus.CONFIRMED,
      createdAt: OLD,
    });

    await expect(
      sweepStalePendingDocuments(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 0 });
    await expect(documentExists(document.id)).resolves.toBe(true);
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("reports nothing when there is nothing stale", async () => {
    await expect(
      sweepStalePendingDocuments(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 0 });
  });

  it("keeps the row and counts a failure when its GCS delete fails", async () => {
    const failure = new Error("bucket unreachable");
    gcsMocks.deleteGcsObject.mockRejectedValueOnce(failure);
    const applicationId = await seedApplication();
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId,
      status: HousingApplicationDocumentStatus.PENDING,
      createdAt: OLD,
    });

    await expect(
      sweepStalePendingDocuments(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 1 });
    // Still there, so the next run retries the object delete.
    await expect(documentExists(document.id)).resolves.toBe(true);
    expect(loggerMocks.error).toHaveBeenCalledWith(
      "Failed to delete GCS object for stale pending document",
      expect.objectContaining({
        documentId: document.id,
        errorMessage: failure.message,
      }),
    );
  });

  it("treats an already-missing GCS object as deleted", async () => {
    gcsMocks.deleteGcsObject.mockRejectedValueOnce(
      new Error("No such object: test-clean-bucket/document.pdf"),
    );
    const applicationId = await seedApplication();
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId,
      status: HousingApplicationDocumentStatus.PENDING,
      createdAt: OLD,
    });

    await expect(
      sweepStalePendingDocuments(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 1, failed: 0 });
    await expect(documentExists(document.id)).resolves.toBe(false);
  });

  const STALE_DOCUMENT = {
    id: "document-1",
    bucketName: "test-clean-bucket",
    objectKey: "applications/app-1/documents/document-1.pdf",
  };

  it("does not delete the GCS object when the row is no longer stale at re-check", async () => {
    const prisma = {
      housingApplicationDocument: {
        findMany: vi.fn().mockResolvedValue([STALE_DOCUMENT]),
        count: vi.fn().mockResolvedValue(0),
        deleteMany: vi.fn(),
      },
    } as unknown as PrismaClient;

    await expect(
      sweepStalePendingDocuments(prisma, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 0 });
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
    expect(prisma.housingApplicationDocument.deleteMany).not.toHaveBeenCalled();
  });

  it("counts a failure when the row changes after its object was deleted", async () => {
    const prisma = {
      housingApplicationDocument: {
        findMany: vi.fn().mockResolvedValue([STALE_DOCUMENT]),
        count: vi.fn().mockResolvedValue(1),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    } as unknown as PrismaClient;

    await expect(
      sweepStalePendingDocuments(prisma, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 1 });
    expect(loggerMocks.error).toHaveBeenCalledWith(
      "Stale pending document changed after its GCS object was deleted",
      { documentId: STALE_DOCUMENT.id },
    );
  });

  it("counts a failure when the row delete throws", async () => {
    const prisma = {
      housingApplicationDocument: {
        findMany: vi.fn().mockResolvedValue([STALE_DOCUMENT]),
        count: vi.fn().mockResolvedValue(1),
        deleteMany: vi.fn().mockRejectedValue(new Error("db down")),
      },
    } as unknown as PrismaClient;

    await expect(
      sweepStalePendingDocuments(prisma, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 1 });
    expect(loggerMocks.error).toHaveBeenCalledWith(
      "Failed to delete stale pending document",
      expect.objectContaining({ documentId: STALE_DOCUMENT.id }),
    );
  });
});

describe("countStuckScanDocuments", () => {
  const OLD = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3h ago
  const RECENT = new Date(Date.now() - 60 * 1000); // 1m ago
  const ANCIENT = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30d ago
  const OLDER_THAN = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2h cutoff
  const NEWER_THAN = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7d window

  it("counts only recent-enough confirmed uploads still waiting on a scan verdict", async () => {
    const application = await createHousingApplication(testPrismaClient, {
      clientName: "",
      formData: {},
    });
    const seed = (
      overrides: Partial<{
        status: HousingApplicationDocumentStatus;
        scanStatus: HousingApplicationDocumentScanStatus;
        createdAt: Date;
      }>,
    ) =>
      createHousingApplicationDocument(testPrismaClient, {
        applicationId: application.id,
        status: HousingApplicationDocumentStatus.CONFIRMED,
        scanStatus: HousingApplicationDocumentScanStatus.PENDING,
        createdAt: OLD,
        ...overrides,
      });

    const stuck = await seed({});
    await seed({ createdAt: RECENT });
    // Predates the lookback window, like staging's pre-scanner uploads.
    await seed({ createdAt: ANCIENT });
    await seed({ status: HousingApplicationDocumentStatus.PENDING });
    await seed({ scanStatus: HousingApplicationDocumentScanStatus.CLEAN });
    await seed({ scanStatus: HousingApplicationDocumentScanStatus.INFECTED });

    await expect(
      countStuckScanDocuments(testPrismaClient, OLDER_THAN, NEWER_THAN),
    ).resolves.toBe(1);
    // Count only: the stuck row is left exactly as it was.
    await expect(
      testPrismaClient.housingApplicationDocument.findUnique({
        where: { id: stuck.id },
        select: { scanStatus: true },
      }),
    ).resolves.toEqual({
      scanStatus: HousingApplicationDocumentScanStatus.PENDING,
    });
  });
});
