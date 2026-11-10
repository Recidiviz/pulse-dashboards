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
import { describe, expect, it, vi } from "vitest";

import {
  ApplicationIntakeStatus,
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  Prisma,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { DEFAULT_HOUSING_APPLICATION_FORM_VALUES } from "~@idaho-th/shared/fixtures/housingApplication";
import {
  createAiExtractionMetrics,
  createHousingApplication,
  createHousingApplicationDocument,
  createHousingProvider,
  createStaffHousingApplication,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import {
  readHousingApplication,
  readPreferredProviderIds,
  readStaffApplication,
  readTimelineEvents,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  claimApplicationForExtraction,
  cleanupIntakeShell,
  createDraftIntakeApplication,
  finalizeDraftIntakeApplicationData,
  isEmptyIntakeShell,
  submitDraftIntakeApplication,
  tryCleanupIntakeShell,
} from "../draftIntake.service";
import type { SubmitDraftIntakeApplicationInput } from "../draftIntake.types";

const loggerMocks = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/routes/common/logger", () => ({
  getLogger: () => loggerMocks,
}));

const gcsMocks = vi.hoisted(() => ({
  deleteGcsObject: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~@idaho-th/trpc/storage/gcs", () => ({
  deleteGcsObject: gcsMocks.deleteGcsObject,
  gcsConfig: { skipDocumentScan: false },
}));

const { gcsConfig } = await import("~@idaho-th/trpc/storage/gcs");

type DraftFormData = SubmitDraftIntakeApplicationInput["formData"];

/** A complete, valid submission — the CM's own values, not the AI's. */
const BASE_FORM_DATA: DraftFormData = {
  ...DEFAULT_HOUSING_APPLICATION_FORM_VALUES,
  clientFullName: "Jane Doe",
  // These tests call the service directly, bypassing the tRPC input schema
  // that normally strips the padded empty-string slots; an empty slot would
  // fail the PreferredHousingProvider foreign key.
  preferredProviders: [],
};

const SOURCE_DOCUMENT = {
  bucketName: "bucket",
  objectKey:
    "applications/staff/staff-1/HANDWRITTEN_SOURCE/jane-doe_handwritten-application.pdf",
  contentType: "application/pdf",
  fileSizeBytes: 1024,
  fileName: "jane-doe_handwritten-application.pdf",
};

/** A staff-owned DRAFT intake awaiting submission. */
async function seedDraftIntakeApplication(
  overrides: Partial<Prisma.HousingApplicationUncheckedCreateInput> = {},
) {
  const application = await createHousingApplication(testPrismaClient, {
    clientName: "",
    formData: {},
    sentToProvidersAt: null,
    ...overrides,
  });

  await createStaffHousingApplication(testPrismaClient, {
    applicationId: application.id,
    intakeStatus: ApplicationIntakeStatus.DRAFT,
    stage: ApplicationStage.DRAFT,
    subStage: null,
    status: ApplicationStatus.ACTION_NEEDED,
  });

  return application;
}

function submitDraft(
  applicationId: string,
  formData: Partial<DraftFormData> = {},
) {
  return submitDraftIntakeApplication(
    testPrismaClient,
    TEST_STAFF_PSEUDONYMIZED_ID,
    {
      id: applicationId,
      formData: { ...BASE_FORM_DATA, ...formData },
    },
  );
}

describe("createDraftIntakeApplication", () => {
  it("stores extracted preferred providers as rows, not in formData", async () => {
    const provider = await createHousingProvider(testPrismaClient);

    const { applicationId } = await createDraftIntakeApplication(
      testPrismaClient,
      {
        applicationId: "app-1",
        staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        formData: {
          clientFullName: "Jane Doe",
          preferredProviders: [provider.id],
        },
      },
    );

    await expect(
      readPreferredProviderIds(testPrismaClient, applicationId),
    ).resolves.toEqual([provider.id]);
    const stored = await readHousingApplication(
      testPrismaClient,
      applicationId,
    );
    expect(stored.formData).toEqual({ clientFullName: "Jane Doe" });
  });

  it("creates the draft application, staff row, and source document with scanStatus left PENDING for the real ClamAV flow", async () => {
    const { applicationId, documentId } = await createDraftIntakeApplication(
      testPrismaClient,
      {
        applicationId: "app-1",
        staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        formData: { clientFullName: "Jane Doe", idocNumber: "123" },
        document: SOURCE_DOCUMENT,
      },
    );

    expect(applicationId).toBe("app-1");

    const application = await readHousingApplication(
      testPrismaClient,
      applicationId,
    );
    expect(application).toMatchObject({
      stateCode: "US_ID",
      clientName: "Jane Doe",
      formData: { clientFullName: "Jane Doe", idocNumber: "123" },
      idocNumber: "123",
      expectedReleaseDate: null,
    });

    const staffApplication = await readStaffApplication(
      testPrismaClient,
      applicationId,
    );
    expect(staffApplication).toMatchObject({
      staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      intakeStatus: ApplicationIntakeStatus.DRAFT,
      stage: ApplicationStage.DRAFT,
      subStage: null,
      status: ApplicationStatus.ACTION_NEEDED,
    });

    const document =
      await testPrismaClient.housingApplicationDocument.findUniqueOrThrow({
        where: { id: documentId },
      });
    expect(document).toMatchObject({
      uploadedByType: HousingApplicationDocumentUploader.STAFF,
      uploadedByPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
      fileName: SOURCE_DOCUMENT.fileName,
      bucketName: SOURCE_DOCUMENT.bucketName,
      objectKey: SOURCE_DOCUMENT.objectKey,
      contentType: SOURCE_DOCUMENT.contentType,
      fileSizeBytes: SOURCE_DOCUMENT.fileSizeBytes,
      status: HousingApplicationDocumentStatus.CONFIRMED,
      scanStatus: HousingApplicationDocumentScanStatus.PENDING,
    });
    expect(document.confirmedAt).toBeInstanceOf(Date);

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      applicationId,
    );
    expect(timelineEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: TimelineEventType.APPLICATION_CREATED,
          actorRole: TimelineActorRole.STAFF,
          actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        }),
        expect.objectContaining({
          eventType: TimelineEventType.STAGE_ADVANCED,
          actorRole: TimelineActorRole.SYSTEM,
          metadata: {
            fromStage: ApplicationStage.DRAFT,
            toStage: ApplicationStage.DRAFT,
          },
        }),
      ]),
    );
  });

  it("marks the source document CLEAN on creation when skipDocumentScan is set (dev only)", async () => {
    gcsConfig.skipDocumentScan = true;
    try {
      const { documentId } = await createDraftIntakeApplication(
        testPrismaClient,
        {
          applicationId: "app-1",
          staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
          formData: { clientFullName: "Jane Doe", idocNumber: "123" },
          document: SOURCE_DOCUMENT,
        },
      );

      await expect(
        testPrismaClient.housingApplicationDocument.findUniqueOrThrow({
          where: { id: documentId },
          select: { scanStatus: true },
        }),
      ).resolves.toEqual({
        scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
      });
    } finally {
      gcsConfig.skipDocumentScan = false;
    }
  });

  it("deletes the uploaded object when the create fails", async () => {
    gcsMocks.deleteGcsObject.mockClear();
    const existing = await seedDraftIntakeApplication();

    await expect(
      createDraftIntakeApplication(testPrismaClient, {
        applicationId: existing.id,
        staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        formData: { clientFullName: "Jane Doe" },
        document: SOURCE_DOCUMENT,
      }),
    ).rejects.toThrow();

    expect(gcsMocks.deleteGcsObject).toHaveBeenCalledWith({
      bucketName: SOURCE_DOCUMENT.bucketName,
      objectKey: SOURCE_DOCUMENT.objectKey,
    });
  });
});

describe("submitDraftIntakeApplication", () => {
  it("submits a draft by updating application data, intake status, and stage", async () => {
    const application = await seedDraftIntakeApplication();

    const result = await submitDraft(application.id);

    expect(result.staffApplication).toMatchObject({
      intakeStatus: ApplicationIntakeStatus.SUBMITTED,
      stage: ApplicationStage.APPLICATION,
      subStage: ApplicationSubStage.PROVIDER_REVIEW,
      status: ApplicationStatus.ACTION_NEEDED,
    });

    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      intakeStatus: ApplicationIntakeStatus.SUBMITTED,
      stage: ApplicationStage.APPLICATION,
      subStage: ApplicationSubStage.PROVIDER_REVIEW,
      status: ApplicationStatus.ACTION_NEEDED,
    });

    await expect(
      readHousingApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      clientName: "Jane Doe",
      formData: { clientFullName: "Jane Doe" },
    });

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toEqual([
      expect.objectContaining({
        eventType: TimelineEventType.STAGE_ADVANCED,
        actorRole: TimelineActorRole.SYSTEM,
        metadata: {
          fromStage: ApplicationStage.DRAFT,
          toStage: ApplicationStage.APPLICATION,
        },
      }),
    ]);
  });

  it("leaves the override summary alone when there is no AI baseline", async () => {
    const application = await seedDraftIntakeApplication();
    const metrics = await createAiExtractionMetrics(testPrismaClient, {
      applicationId: application.id,
    });

    await submitDraft(application.id);

    await expect(
      testPrismaClient.aiExtractionMetrics.findUniqueOrThrow({
        where: { id: metrics.id },
      }),
    ).resolves.toMatchObject({
      submittedAt: null,
      overriddenFieldCount: null,
      overriddenFields: [],
    });
  });

  it("diffs the AI-extraction baseline against the submission and persists the override summary", async () => {
    // Only 1 preferred provider, deliberately not 3: normalizeDefaultValues
    // pads the AI baseline to exactly 3 display slots before diffing, but
    // the submitted side is never padded (the write schema strips empty
    // slots before the service ever sees it). A 1-length baseline vs. a
    // 1-length submission must NOT diff as an override just because the
    // baseline's padding briefly made it look like 3.
    const provider = await createHousingProvider(testPrismaClient);
    const preferredProviders = [provider.id];

    const application = await seedDraftIntakeApplication({
      rawAiResponse: {
        ...BASE_FORM_DATA,
        preferredProviders,
      } as Prisma.InputJsonObject,
    });
    const metrics = await createAiExtractionMetrics(testPrismaClient, {
      applicationId: application.id,
    });

    await submitDraft(application.id, {
      clientFullName: "John Doe",
      preferredProviders,
    });

    // recordSubmittedOverrides is deliberately not awaited by the service, so
    // poll until the summary lands rather than reading once.
    await vi.waitFor(async () => {
      await expect(
        testPrismaClient.aiExtractionMetrics.findUniqueOrThrow({
          where: { id: metrics.id },
        }),
      ).resolves.toMatchObject({
        submittedAt: expect.any(Date),
        overriddenFieldCount: 1,
        overriddenFields: ["clientFullName"],
      });
    });
  });

  it("rejects a concurrent submit that loses the race to flip the draft status", async () => {
    const application = await seedDraftIntakeApplication();

    // Both callers see a DRAFT row, then contend on the conditional
    // updateMany; the loser's update matches zero rows.
    const outcomes = await Promise.allSettled([
      submitDraft(application.id),
      submitDraft(application.id),
    ]);

    const rejections = outcomes.filter(
      (outcome) => outcome.status === "rejected",
    );
    expect(rejections).toHaveLength(1);
    expect(rejections[0]).toMatchObject({
      reason: {
        code: "CONFLICT",
        message: "Draft housing application has already been submitted",
      },
    });
  });

  it("stores preferred providers as ranked rows, not in formData", async () => {
    const first = await createHousingProvider(testPrismaClient);
    const second = await createHousingProvider(testPrismaClient);
    const application = await seedDraftIntakeApplication();

    await submitDraft(application.id, {
      preferredProviders: [second.id, first.id],
    });

    await expect(
      readPreferredProviderIds(testPrismaClient, application.id),
    ).resolves.toEqual([second.id, first.id]);
    const stored = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(stored.formData).not.toHaveProperty("preferredProviders");
  });

  it("rejects an unknown preferred provider with BAD_REQUEST and leaves the draft unsubmitted", async () => {
    const application = await seedDraftIntakeApplication();

    await expect(
      submitDraft(application.id, {
        preferredProviders: ["99999999-9999-4999-8999-999999999999"],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({ intakeStatus: ApplicationIntakeStatus.DRAFT });
  });

  it("rejects submit when the draft is not found", async () => {
    await expect(submitDraft("missing")).rejects.toBeInstanceOf(TRPCError);
  });

  it("rejects submit for another staff member's draft", async () => {
    const application = await seedDraftIntakeApplication();

    await expect(
      submitDraftIntakeApplication(testPrismaClient, "someone-else", {
        id: application.id,
        formData: BASE_FORM_DATA,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("cleanupIntakeShell", () => {
  it("conditionally deletes empty DRAFT shells owned by the requesting staff member", async () => {
    const application = await seedDraftIntakeApplication();

    await expect(
      cleanupIntakeShell(
        testPrismaClient,
        application.id,
        TEST_STAFF_PSEUDONYMIZED_ID,
      ),
    ).resolves.toBe(true);
    await expect(
      testPrismaClient.housingApplication.findUnique({
        where: { id: application.id },
      }),
    ).resolves.toBeNull();
  });

  it("keeps a shell whose formData has already been populated", async () => {
    const application = await seedDraftIntakeApplication({
      formData: { clientFullName: "Jane Doe" },
    });

    await expect(
      cleanupIntakeShell(
        testPrismaClient,
        application.id,
        TEST_STAFF_PSEUDONYMIZED_ID,
      ),
    ).resolves.toBe(false);
    await expect(
      testPrismaClient.housingApplication.findUnique({
        where: { id: application.id },
      }),
    ).resolves.not.toBeNull();
  });

  it("keeps another staff member's shell", async () => {
    const application = await seedDraftIntakeApplication();

    await expect(
      cleanupIntakeShell(testPrismaClient, application.id, "someone-else"),
    ).resolves.toBe(false);
  });
});

describe("tryCleanupIntakeShell", () => {
  it("logs and swallows cleanup failures so they never mask upstream errors", async () => {
    loggerMocks.error.mockClear();
    // An injected DB failure, not seed data: the point is that the rejection
    // never escapes.
    const failingPrisma = {
      housingApplication: {
        deleteMany: vi.fn().mockRejectedValue(new Error("db down")),
      },
    } as never;

    await expect(
      tryCleanupIntakeShell(failingPrisma, "app-1", "staff-1"),
    ).resolves.toBeUndefined();

    expect(loggerMocks.error).toHaveBeenCalledWith(
      "Failed to clean up empty vertex intake shell",
      expect.objectContaining({
        applicationId: "app-1",
        staffPseudonymizedId: "staff-1",
      }),
    );
  });
});

describe("claimApplicationForExtraction", () => {
  it("claims an unclaimed shell", async () => {
    const application = await seedDraftIntakeApplication();
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
    });

    await expect(
      claimApplicationForExtraction(testPrismaClient, application.id),
    ).resolves.toBe(true);
    await expect(
      readHousingApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({ extractionClaimedAt: expect.any(Date) });
  });

  it("refuses a shell that's already claimed", async () => {
    const application = await seedDraftIntakeApplication();
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
    });
    await claimApplicationForExtraction(testPrismaClient, application.id);

    await expect(
      claimApplicationForExtraction(testPrismaClient, application.id),
    ).resolves.toBe(false);
  });

  it("refuses an application whose formData is already populated", async () => {
    const application = await seedDraftIntakeApplication({
      formData: { clientFullName: "Jane Doe" },
    });
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
    });

    await expect(
      claimApplicationForExtraction(testPrismaClient, application.id),
    ).resolves.toBe(false);
  });

  it("refuses a shell without a clean confirmed handwritten source document", async () => {
    const application = await seedDraftIntakeApplication();
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      status: HousingApplicationDocumentStatus.PENDING,
      scanStatus: HousingApplicationDocumentScanStatus.PENDING,
    });

    await expect(
      claimApplicationForExtraction(testPrismaClient, application.id),
    ).resolves.toBe(false);
  });

  it("refuses an application whose staff intake is no longer a draft", async () => {
    const application = await seedDraftIntakeApplication();
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
    });
    await testPrismaClient.staffHousingApplication.update({
      where: { applicationId: application.id },
      data: { intakeStatus: ApplicationIntakeStatus.SUBMITTED },
    });

    await expect(
      claimApplicationForExtraction(testPrismaClient, application.id),
    ).resolves.toBe(false);
  });

  it("reports false for an application that does not exist", async () => {
    await expect(
      claimApplicationForExtraction(
        testPrismaClient,
        "11111111-1111-4111-8111-111111111111",
      ),
    ).resolves.toBe(false);
  });
});

describe("finalizeDraftIntakeApplicationData", () => {
  it("writes the extracted formData", async () => {
    const application = await seedDraftIntakeApplication();

    await finalizeDraftIntakeApplicationData(testPrismaClient, {
      applicationId: application.id,
      formData: BASE_FORM_DATA as unknown as Prisma.InputJsonValue,
    });

    await expect(
      readHousingApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({ clientName: "Jane Doe" });
  });

  it("moves preferred providers to rows but keeps them in the rawAiResponse snapshot", async () => {
    const provider = await createHousingProvider(testPrismaClient);
    const application = await seedDraftIntakeApplication();

    await finalizeDraftIntakeApplicationData(testPrismaClient, {
      applicationId: application.id,
      formData: {
        ...BASE_FORM_DATA,
        preferredProviders: [provider.id],
      } as unknown as Prisma.InputJsonValue,
    });

    await expect(
      readPreferredProviderIds(testPrismaClient, application.id),
    ).resolves.toEqual([provider.id]);
    const stored = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(stored.formData).not.toHaveProperty("preferredProviders");
    expect(stored.rawAiResponse).toMatchObject({
      preferredProviders: [provider.id],
    });
  });

  const connectionLost = () =>
    new Prisma.PrismaClientKnownRequestError(
      "Server has closed the connection",
      {
        code: "P1017",
        clientVersion: "test",
      },
    );

  it("retries a transient connection error and still succeeds", async () => {
    const update = vi
      .fn()
      .mockRejectedValueOnce(connectionLost())
      .mockResolvedValueOnce(undefined);
    const flakyPrisma = { housingApplication: { update } } as never;

    await finalizeDraftIntakeApplicationData(flakyPrisma, {
      applicationId: "app-1",
      formData: BASE_FORM_DATA as unknown as Prisma.InputJsonValue,
    });

    expect(update).toHaveBeenCalledTimes(2);
  });

  it("gives up and throws after exhausting every retry on a persistent connection error", async () => {
    const failure = connectionLost();
    const update = vi.fn().mockRejectedValue(failure);
    const failingPrisma = { housingApplication: { update } } as never;

    await expect(
      finalizeDraftIntakeApplicationData(failingPrisma, {
        applicationId: "app-1",
        formData: BASE_FORM_DATA as unknown as Prisma.InputJsonValue,
      }),
    ).rejects.toBe(failure);
    expect(update).toHaveBeenCalledTimes(3);
  });

  it("throws immediately on a non-transient error without retrying", async () => {
    const failure = new Prisma.PrismaClientKnownRequestError(
      "An operation failed because it depends on one or more records that were required but not found",
      { code: "P2025", clientVersion: "test" },
    );
    const update = vi.fn().mockRejectedValue(failure);
    const failingPrisma = { housingApplication: { update } } as never;

    await expect(
      finalizeDraftIntakeApplicationData(failingPrisma, {
        applicationId: "app-1",
        formData: BASE_FORM_DATA as unknown as Prisma.InputJsonValue,
      }),
    ).rejects.toBe(failure);
    expect(update).toHaveBeenCalledTimes(1);
  });
});

describe("isEmptyIntakeShell", () => {
  it("returns true only for empty object shells", () => {
    expect(isEmptyIntakeShell({})).toBe(true);
    expect(isEmptyIntakeShell({ clientFullName: "Jane" })).toBe(false);
    expect(isEmptyIntakeShell(null)).toBe(false);
  });
});
