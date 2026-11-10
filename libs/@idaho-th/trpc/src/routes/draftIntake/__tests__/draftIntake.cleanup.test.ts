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

import {
  ApplicationIntakeStatus,
  ApplicationStage,
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  type PrismaClient,
} from "~@idaho-th/prisma/client";
import {
  createHousingApplication,
  createHousingApplicationDocument,
  createStaffHousingApplication,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

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

vi.mock("~@idaho-th/trpc/storage/gcs", () => ({
  deleteGcsObject: gcsMocks.deleteGcsObject,
  isGcsNotFoundError: (error: unknown) =>
    error instanceof Error && error.message.includes("No such object"),
}));

const {
  cleanupIntakeShell,
  cleanupIntakeShellByObjectKey,
  deleteDraftIntakeApplicationShell,
  isEmptyIntakeShell,
  sweepInfectedIntakeShells,
  sweepStaleIntakeShells,
  tryCleanupIntakeShell,
  tryCleanupIntakeShellByObjectKey,
} = await import("../draftIntake.cleanup");

const STAFF_PSEUDONYMIZED_ID = "staff-1";
const OTHER_STAFF_PSEUDONYMIZED_ID = "staff-2";

/** An empty DRAFT shell owned by `staffPseudonymizedId`, with its source PDF. */
async function seedIntakeShell({
  staffPseudonymizedId = STAFF_PSEUDONYMIZED_ID,
  formData = {},
  intakeStatus = ApplicationIntakeStatus.DRAFT,
  stage = ApplicationStage.DRAFT,
  createdAt,
}: {
  staffPseudonymizedId?: string;
  formData?: object;
  intakeStatus?: ApplicationIntakeStatus;
  stage?: ApplicationStage;
  createdAt?: Date;
} = {}) {
  const application = await createHousingApplication(testPrismaClient, {
    clientName: "",
    formData,
    ...(createdAt ? { createdAt } : {}),
  });
  await createStaffHousingApplication(testPrismaClient, {
    applicationId: application.id,
    staffPseudonymizedId,
    intakeStatus,
    stage,
  });
  const document = await createHousingApplicationDocument(testPrismaClient, {
    applicationId: application.id,
    uploadedByPseudonymizedId: staffPseudonymizedId,
  });
  return { applicationId: application.id, objectKey: document.objectKey };
}

function applicationExists(applicationId: string) {
  return testPrismaClient.housingApplication
    .findUnique({ where: { id: applicationId }, select: { id: true } })
    .then((row) => row !== null);
}

/** A prisma stand-in whose delete path fails on demand. */
function rejectingPrisma(error: Error): PrismaClient {
  return {
    housingApplication: { deleteMany: vi.fn().mockRejectedValue(error) },
    housingApplicationDocument: {
      findFirst: vi.fn().mockResolvedValue({
        applicationId: "app-1",
        uploadedByPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
      }),
    },
  } as unknown as PrismaClient;
}

describe("isEmptyIntakeShell", () => {
  it.each([
    ["an empty object", {}, true],
    ["a populated object", { clientFullName: "Jane Doe" }, false],
    ["null", null, false],
    ["an array", [], false],
    ["a string", "{}", false],
    ["undefined", undefined, false],
  ])("reads %s as %s", (_label, formData, expected) => {
    expect(isEmptyIntakeShell(formData)).toBe(expected);
  });
});

describe("cleanupIntakeShell", () => {
  it("deletes an empty DRAFT shell owned by the caller", async () => {
    const { applicationId } = await seedIntakeShell();

    await expect(
      cleanupIntakeShell(
        testPrismaClient,
        applicationId,
        STAFF_PSEUDONYMIZED_ID,
      ),
    ).resolves.toBe(true);
    await expect(applicationExists(applicationId)).resolves.toBe(false);
  });

  it("refuses a shell owned by another staff member", async () => {
    const { applicationId } = await seedIntakeShell();

    await expect(
      cleanupIntakeShell(
        testPrismaClient,
        applicationId,
        OTHER_STAFF_PSEUDONYMIZED_ID,
      ),
    ).resolves.toBe(false);
    await expect(applicationExists(applicationId)).resolves.toBe(true);
  });

  it.each([
    [
      "formData has been populated",
      { formData: { clientFullName: "Jane Doe" } },
    ],
    [
      "the intake is no longer a draft",
      { intakeStatus: ApplicationIntakeStatus.SUBMITTED },
    ],
    ["the stage has advanced", { stage: ApplicationStage.APPLICATION }],
  ])("refuses to delete when %s", async (_label, overrides) => {
    const { applicationId } = await seedIntakeShell(overrides);

    await expect(
      cleanupIntakeShell(
        testPrismaClient,
        applicationId,
        STAFF_PSEUDONYMIZED_ID,
      ),
    ).resolves.toBe(false);
    await expect(applicationExists(applicationId)).resolves.toBe(true);
  });

  it("reports false for an application that does not exist", async () => {
    await expect(
      cleanupIntakeShell(
        testPrismaClient,
        "11111111-1111-4111-8111-111111111111",
        STAFF_PSEUDONYMIZED_ID,
      ),
    ).resolves.toBe(false);
  });
});

describe("tryCleanupIntakeShell", () => {
  it("does nothing at all without an application id", async () => {
    const prisma = rejectingPrisma(new Error("must not be called"));

    await expect(
      tryCleanupIntakeShell(prisma, undefined, STAFF_PSEUDONYMIZED_ID),
    ).resolves.toBeUndefined();
    expect(prisma.housingApplication.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes the shell on the happy path", async () => {
    const { applicationId } = await seedIntakeShell();

    await tryCleanupIntakeShell(
      testPrismaClient,
      applicationId,
      STAFF_PSEUDONYMIZED_ID,
    );

    await expect(applicationExists(applicationId)).resolves.toBe(false);
    expect(loggerMocks.error).not.toHaveBeenCalled();
  });

  it("logs and swallows a cleanup failure", async () => {
    const failure = new Error("deadlock detected");

    await expect(
      tryCleanupIntakeShell(
        rejectingPrisma(failure),
        "app-1",
        STAFF_PSEUDONYMIZED_ID,
      ),
    ).resolves.toBeUndefined();

    // Rethrowing would mask the upload/extraction error that triggered cleanup.
    expect(loggerMocks.error).toHaveBeenCalledWith(
      "Failed to clean up empty vertex intake shell",
      expect.objectContaining({
        applicationId: "app-1",
        errorName: "Error",
        errorMessage: failure.message,
      }),
    );
  });

  it("runs the caller's onError after the default log", async () => {
    const failure = new Error("deadlock detected");
    const onError = vi.fn();

    await tryCleanupIntakeShell(
      rejectingPrisma(failure),
      "app-1",
      STAFF_PSEUDONYMIZED_ID,
      onError,
    );

    expect(onError).toHaveBeenCalledWith(failure);
  });
});

describe("cleanupIntakeShellByObjectKey", () => {
  it("deletes only the shell whose document carries the key", async () => {
    const target = await seedIntakeShell();
    const bystander = await seedIntakeShell();

    await expect(
      cleanupIntakeShellByObjectKey(testPrismaClient, target.objectKey),
    ).resolves.toBe(true);

    await expect(applicationExists(target.applicationId)).resolves.toBe(false);
    await expect(applicationExists(bystander.applicationId)).resolves.toBe(
      true,
    );
  });

  it("reports false for an unknown object key", async () => {
    await seedIntakeShell();

    await expect(
      cleanupIntakeShellByObjectKey(testPrismaClient, "applications/nope.pdf"),
    ).resolves.toBe(false);
  });

  it.each([
    [
      "a provider upload",
      {
        uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
      },
    ],
    [
      "a non-source document type",
      {
        documentType: HousingApplicationDocumentType.ATTACHMENT,
      },
    ],
  ])("ignores %s with the same key", async (_label, documentOverrides) => {
    const application = await createHousingApplication(testPrismaClient, {
      clientName: "",
      formData: {},
    });
    await createStaffHousingApplication(testPrismaClient, {
      applicationId: application.id,
      staffPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
      intakeStatus: ApplicationIntakeStatus.DRAFT,
      stage: ApplicationStage.DRAFT,
    });
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      uploadedByPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
      ...documentOverrides,
    });

    await expect(
      cleanupIntakeShellByObjectKey(testPrismaClient, document.objectKey),
    ).resolves.toBe(false);
    await expect(applicationExists(application.id)).resolves.toBe(true);
  });

  it("uses the document's own uploader as the ownership check", async () => {
    const { objectKey, applicationId } = await seedIntakeShell({
      staffPseudonymizedId: OTHER_STAFF_PSEUDONYMIZED_ID,
    });

    // The key alone is enough: ownership comes from the document row, not the
    // caller, so the other staff member's shell is still cleaned up.
    await expect(
      cleanupIntakeShellByObjectKey(testPrismaClient, objectKey),
    ).resolves.toBe(true);
    await expect(applicationExists(applicationId)).resolves.toBe(false);
  });
});

describe("tryCleanupIntakeShellByObjectKey", () => {
  it("logs and swallows a cleanup failure", async () => {
    const failure = new Error("deadlock detected");
    const onError = vi.fn();

    await expect(
      tryCleanupIntakeShellByObjectKey(
        rejectingPrisma(failure),
        "applications/doc.pdf",
        onError,
      ),
    ).resolves.toBeUndefined();

    expect(loggerMocks.error).toHaveBeenCalledWith(
      "Failed to clean up empty vertex intake shell by objectKey",
      expect.objectContaining({
        objectKey: "applications/doc.pdf",
        errorName: "Error",
        errorMessage: failure.message,
      }),
    );
    expect(onError).toHaveBeenCalledWith(failure);
  });

  it("succeeds quietly when there is nothing to clean up", async () => {
    await expect(
      tryCleanupIntakeShellByObjectKey(
        testPrismaClient,
        "applications/nope.pdf",
      ),
    ).resolves.toBeUndefined();
    expect(loggerMocks.error).not.toHaveBeenCalled();
  });
});

describe("deleteDraftIntakeApplicationShell", () => {
  it("deletes the application and its cascaded rows unconditionally", async () => {
    const { applicationId } = await seedIntakeShell({
      formData: { clientFullName: "Jane Doe" },
      intakeStatus: ApplicationIntakeStatus.SUBMITTED,
    });

    await deleteDraftIntakeApplicationShell(testPrismaClient, applicationId);

    await expect(applicationExists(applicationId)).resolves.toBe(false);
    await expect(
      testPrismaClient.housingApplicationDocument.count({
        where: { applicationId },
      }),
    ).resolves.toBe(0);
  });

  it("rejects for an application that does not exist", async () => {
    await expect(
      deleteDraftIntakeApplicationShell(
        testPrismaClient,
        "11111111-1111-4111-8111-111111111111",
      ),
    ).rejects.toThrow();
  });
});

describe("sweepStaleIntakeShells", () => {
  const OLD = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3h ago
  const RECENT = new Date(Date.now() - 60 * 1000); // 1m ago
  const OLDER_THAN = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2h cutoff

  beforeEach(() => {
    gcsMocks.deleteGcsObject.mockReset().mockResolvedValue(undefined);
    loggerMocks.error.mockClear();
  });

  /** An old empty DRAFT shell with no documents at all. */
  async function seedDocumentlessShell(extractionClaimedAt?: Date) {
    const application = await createHousingApplication(testPrismaClient, {
      clientName: "",
      formData: {},
      createdAt: OLD,
      ...(extractionClaimedAt ? { extractionClaimedAt } : {}),
    });
    await createStaffHousingApplication(testPrismaClient, {
      applicationId: application.id,
      staffPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
      intakeStatus: ApplicationIntakeStatus.DRAFT,
      stage: ApplicationStage.DRAFT,
    });
    return application.id;
  }

  it("deletes an old empty DRAFT shell and its GCS object", async () => {
    const { applicationId, objectKey } = await seedIntakeShell({
      createdAt: OLD,
    });

    await expect(
      sweepStaleIntakeShells(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 1, failed: 0 });
    await expect(applicationExists(applicationId)).resolves.toBe(false);
    expect(gcsMocks.deleteGcsObject).toHaveBeenCalledWith(
      expect.objectContaining({ objectKey }),
    );
  });

  it("deletes the GCS object while the shell row still exists", async () => {
    const { applicationId } = await seedIntakeShell({ createdAt: OLD });
    let rowExistedAtGcsDelete: boolean | undefined;
    gcsMocks.deleteGcsObject.mockImplementation(async () => {
      rowExistedAtGcsDelete = await applicationExists(applicationId);
    });

    await sweepStaleIntakeShells(testPrismaClient, OLDER_THAN);

    expect(rowExistedAtGcsDelete).toBe(true);
    await expect(applicationExists(applicationId)).resolves.toBe(false);
  });

  it("leaves a shell that isn't old enough yet", async () => {
    const { applicationId } = await seedIntakeShell({ createdAt: RECENT });

    await expect(
      sweepStaleIntakeShells(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 0 });
    await expect(applicationExists(applicationId)).resolves.toBe(true);
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("deletes an old empty DRAFT shell whose source document is already gone", async () => {
    const applicationId = await seedDocumentlessShell();

    await expect(
      sweepStaleIntakeShells(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 1, failed: 0 });
    await expect(applicationExists(applicationId)).resolves.toBe(false);
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("leaves a document-less shell whose extraction was claimed 5 minutes ago", async () => {
    const applicationId = await seedDocumentlessShell(
      new Date(Date.now() - 5 * 60 * 1000),
    );

    await expect(
      sweepStaleIntakeShells(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 0 });
    await expect(applicationExists(applicationId)).resolves.toBe(true);
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("leaves an old empty DRAFT whose only document isn't a handwritten source", async () => {
    const applicationId = await seedDocumentlessShell();
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId,
      uploadedByPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
      documentType: HousingApplicationDocumentType.ATTACHMENT,
    });

    await expect(
      sweepStaleIntakeShells(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 0 });
    await expect(applicationExists(applicationId)).resolves.toBe(true);
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it.each([
    [
      "formData has since been populated",
      { formData: { clientFullName: "Test Client" } },
    ],
    [
      "the intake is no longer a draft",
      { intakeStatus: ApplicationIntakeStatus.SUBMITTED },
    ],
    ["the stage has advanced", { stage: ApplicationStage.APPLICATION }],
  ])(
    "leaves an old shell alone when %s (extraction finished in between)",
    async (_label, overrides) => {
      const { applicationId } = await seedIntakeShell({
        createdAt: OLD,
        ...overrides,
      });

      await expect(
        sweepStaleIntakeShells(testPrismaClient, OLDER_THAN),
      ).resolves.toEqual({ deleted: 0, failed: 0 });
      await expect(applicationExists(applicationId)).resolves.toBe(true);
      expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
    },
  );

  it("never sweeps a shell whose document was flagged INFECTED", async () => {
    const applicationId = await seedDocumentlessShell();
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId,
      uploadedByPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
      scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
      bucketName: "quarantined-bucket",
    });

    await expect(
      sweepStaleIntakeShells(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 0 });
    await expect(applicationExists(applicationId)).resolves.toBe(true);
    // Never even attempted against the quarantine bucket the document points at.
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("reports nothing when there is nothing stale", async () => {
    await expect(
      sweepStaleIntakeShells(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 0 });
  });

  it("keeps the shell and counts a failure when its GCS delete fails", async () => {
    const failure = new Error("bucket unreachable");
    gcsMocks.deleteGcsObject.mockRejectedValueOnce(failure);
    const { applicationId } = await seedIntakeShell({ createdAt: OLD });

    await expect(
      sweepStaleIntakeShells(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 1 });
    // Still there, so the next run retries the object delete.
    await expect(applicationExists(applicationId)).resolves.toBe(true);
    expect(loggerMocks.error).toHaveBeenCalledWith(
      "Failed to delete GCS object for stale intake shell",
      expect.objectContaining({
        applicationId,
        errorMessage: failure.message,
      }),
    );
  });

  it("treats an already-missing GCS object as deleted", async () => {
    gcsMocks.deleteGcsObject.mockRejectedValueOnce(
      new Error("No such object: test-clean-bucket/source.pdf"),
    );
    const { applicationId } = await seedIntakeShell({ createdAt: OLD });

    await expect(
      sweepStaleIntakeShells(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 1, failed: 0 });
    await expect(applicationExists(applicationId)).resolves.toBe(false);
  });

  it("does not delete GCS objects when the shell is no longer stale at re-check", async () => {
    const prisma = {
      housingApplication: {
        findMany: vi.fn().mockResolvedValue([{ id: "application-1" }]),
        findFirst: vi.fn().mockResolvedValue(null),
        deleteMany: vi.fn(),
      },
    } as unknown as PrismaClient;

    await expect(sweepStaleIntakeShells(prisma, OLDER_THAN)).resolves.toEqual({
      deleted: 0,
      failed: 0,
    });
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
    expect(prisma.housingApplication.deleteMany).not.toHaveBeenCalled();
  });

  it("counts a failure when the shell changes after its objects were deleted", async () => {
    const prisma = {
      housingApplication: {
        findMany: vi.fn().mockResolvedValue([{ id: "application-1" }]),
        findFirst: vi.fn().mockResolvedValue({
          documents: [
            {
              bucketName: "test-clean-bucket",
              objectKey: "applications/app-1/documents/source.pdf",
              scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
            },
          ],
        }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    } as unknown as PrismaClient;

    await expect(sweepStaleIntakeShells(prisma, OLDER_THAN)).resolves.toEqual({
      deleted: 0,
      failed: 1,
    });
    expect(loggerMocks.error).toHaveBeenCalledWith(
      "Stale intake shell changed after its GCS objects were deleted",
      { applicationId: "application-1" },
    );
  });

  it("counts a failure when the shell row delete throws", async () => {
    const prisma = {
      housingApplication: {
        findMany: vi.fn().mockResolvedValue([{ id: "application-1" }]),
        findFirst: vi.fn().mockResolvedValue({ documents: [] }),
        deleteMany: vi.fn().mockRejectedValue(new Error("db down")),
      },
    } as unknown as PrismaClient;

    await expect(sweepStaleIntakeShells(prisma, OLDER_THAN)).resolves.toEqual({
      deleted: 0,
      failed: 1,
    });
    expect(loggerMocks.error).toHaveBeenCalledWith(
      "Failed to delete stale intake shell",
      expect.objectContaining({ applicationId: "application-1" }),
    );
  });
});

describe("sweepInfectedIntakeShells", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const OLDER_THAN = new Date(Date.now() - 7 * DAY_MS); // 7-day cutoff

  beforeEach(() => {
    gcsMocks.deleteGcsObject.mockReset().mockResolvedValue(undefined);
  });

  /** An empty DRAFT shell whose source PDF scanned INFECTED. */
  async function seedInfectedShell({
    createdAt,
    formData = {},
  }: {
    createdAt: Date;
    formData?: object;
  }) {
    const application = await createHousingApplication(testPrismaClient, {
      clientName: "",
      formData,
      createdAt,
    });
    await createStaffHousingApplication(testPrismaClient, {
      applicationId: application.id,
      staffPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
      intakeStatus: ApplicationIntakeStatus.DRAFT,
      stage: ApplicationStage.DRAFT,
    });
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      uploadedByPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
      scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
      bucketName: "quarantined-bucket",
    });
    return application.id;
  }

  it("deletes an INFECTED shell older than the cutoff but leaves its quarantined object", async () => {
    const applicationId = await seedInfectedShell({
      createdAt: new Date(Date.now() - 8 * DAY_MS),
    });

    await expect(
      sweepInfectedIntakeShells(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 1, failed: 0 });
    await expect(applicationExists(applicationId)).resolves.toBe(false);
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("leaves an INFECTED shell younger than the cutoff", async () => {
    const applicationId = await seedInfectedShell({
      createdAt: new Date(Date.now() - 3 * DAY_MS),
    });

    await expect(
      sweepInfectedIntakeShells(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 0 });
    await expect(applicationExists(applicationId)).resolves.toBe(true);
  });

  it("leaves an INFECTED application whose formData was populated", async () => {
    const applicationId = await seedInfectedShell({
      createdAt: new Date(Date.now() - 8 * DAY_MS),
      formData: { clientFullName: "Test Client" },
    });

    await expect(
      sweepInfectedIntakeShells(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 0, failed: 0 });
    await expect(applicationExists(applicationId)).resolves.toBe(true);
  });

  it("deletes the shell's non-INFECTED objects so they aren't orphaned", async () => {
    const applicationId = await seedInfectedShell({
      createdAt: new Date(Date.now() - 8 * DAY_MS),
    });
    const clean = await createHousingApplicationDocument(testPrismaClient, {
      applicationId,
      uploadedByPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
      documentType: HousingApplicationDocumentType.ATTACHMENT,
    });

    await expect(
      sweepInfectedIntakeShells(testPrismaClient, OLDER_THAN),
    ).resolves.toEqual({ deleted: 1, failed: 0 });
    expect(gcsMocks.deleteGcsObject).toHaveBeenCalledTimes(1);
    expect(gcsMocks.deleteGcsObject).toHaveBeenCalledWith(
      expect.objectContaining({ objectKey: clean.objectKey }),
    );
  });
});
