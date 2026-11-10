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

import {
  ApplicationIntakeStatus,
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  ClosedOutcome,
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { duplicateHousingApplication } from "~@idaho-th/trpc/routes/staffApplication/duplicateApplication.service";
import {
  ADVANCE_STAGE_BAD_REQUEST,
  STAFF_APPLICATION_NOT_FOUND,
} from "~@idaho-th/trpc/routes/staffApplication/staffApplication.constants";
import {
  createHousingApplicationDocument,
  createHousingProvider,
  createHousingProviderLocation,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import {
  readPreferredProviderIds,
  readProviderApplication,
  readStaffApplication,
  readTimelineEvents,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  seedStaffApplication,
  TEST_APPLICATION_FORM_DATA,
  TEST_PROVIDER_LOCATION,
} from "./staffApplication.fixtures";

describe("duplicateHousingApplication", () => {
  function readDuplicate(duplicateId: string) {
    return testPrismaClient.housingApplication.findUniqueOrThrow({
      where: { id: duplicateId },
      include: {
        staffApplication: true,
        eligibleProviders: true,
        documents: true,
        timelineEvents: true,
      },
    });
  }

  function countApplications() {
    return testPrismaClient.housingApplication.count();
  }

  /**
   * Closes the case for real after the pre-transaction source lookup has passed
   * but before the transaction opens, reproducing the TOCTOU window that the
   * row-locked re-fetch inside the transaction exists to catch. Only the
   * transaction's start is intercepted — it still runs for real, so its re-fetch
   * reads the now-closed row from the DB.
   *
   * Patched by hand, not with `vi.spyOn`: `mockReset` turns a leftover spy
   * into a no-op for every later test, and `mockRestore` cannot put back a
   * method on Prisma's client proxy. Putting back the bound original works.
   */
  function closeCaseBeforeTransaction(applicationId: string) {
    const runTransaction = testPrismaClient.$transaction.bind(testPrismaClient);
    const setTransaction = (value: unknown) =>
      Object.defineProperty(testPrismaClient, "$transaction", {
        value,
        configurable: true,
        writable: true,
      });

    setTransaction(async (...args: Parameters<typeof runTransaction>) => {
      setTransaction(runTransaction);
      await testPrismaClient.staffHousingApplication.update({
        where: { applicationId },
        data: {
          stage: ApplicationStage.CLOSED,
          subStage: ApplicationSubStage.CANCELED,
          status: ApplicationStatus.DONE,
        },
      });
      return runTransaction(...args);
    });
  }

  test("closes the original with a CASE_CLOSED timeline event", async () => {
    const { application, providerApplications } = await seedStaffApplication(
      testPrismaClient,
      { providerApplicationStages: [ApplicationStage.APPLICATION] },
    );

    await duplicateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id },
    );

    const originalStaffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(originalStaffApplication).toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CANCELED,
      status: ApplicationStatus.DONE,
      closedOutcome: null,
      closedOutcomeNote: null,
    });

    const originalProviderApplication = await readProviderApplication(
      testPrismaClient,
      providerApplications[0].id,
    );
    expect(originalProviderApplication).toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CANCELED,
      status: ApplicationStatus.DONE,
    });

    const originalTimelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(originalTimelineEvents).toHaveLength(1);
    expect(originalTimelineEvents[0]).toMatchObject({
      eventType: TimelineEventType.CASE_CLOSED,
      actorRole: TimelineActorRole.STAFF,
      actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      metadata: { closedSubStage: ApplicationSubStage.CANCELED },
    });
  });

  test("creates a submitted duplicate with copied data, re-matched providers, and initial timeline events", async () => {
    const { application, providerApplications } = await seedStaffApplication(
      testPrismaClient,
      { providerApplicationStages: [ApplicationStage.APPLICATION] },
    );

    const result = await duplicateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id },
    );

    expect(result.applicationId).not.toBe(application.id);

    const duplicate = await readDuplicate(result.applicationId);
    expect(duplicate).toMatchObject({
      duplicatedFromId: application.id,
      clientName: TEST_APPLICATION_FORM_DATA.clientFullName,
      idocNumber: TEST_APPLICATION_FORM_DATA.idocNumber,
      expectedReleaseDate: new Date(
        TEST_APPLICATION_FORM_DATA.tpdHousingNeededDate,
      ),
      formData: TEST_APPLICATION_FORM_DATA,
    });
    expect(duplicate.staffApplication).toMatchObject({
      staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      intakeStatus: ApplicationIntakeStatus.SUBMITTED,
      stage: ApplicationStage.APPLICATION,
      subStage: ApplicationSubStage.PROVIDER_REVIEW,
      status: ApplicationStatus.ACTION_NEEDED,
    });

    // Eligibility is re-derived from the stored form data, so the original's
    // provider is matched again — provider *responses* are not carried over.
    expect(duplicate.eligibleProviders).toHaveLength(1);
    expect(duplicate.eligibleProviders[0]).toMatchObject({
      providerId: providerApplications[0].providerId,
      providerLocationId: providerApplications[0].providerLocationId,
    });
    const duplicateProviderApplications =
      await testPrismaClient.providerHousingApplication.count({
        where: { applicationId: duplicate.id },
      });
    expect(duplicateProviderApplications).toBe(0);

    expect(duplicate.timelineEvents).toIncludeSameMembers([
      expect.objectContaining({
        eventType: TimelineEventType.APPLICATION_CREATED,
        actorRole: TimelineActorRole.STAFF,
        actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      }),
      expect.objectContaining({
        eventType: TimelineEventType.STAGE_ADVANCED,
        actorRole: TimelineActorRole.SYSTEM,
        metadata: {
          fromStage: ApplicationStage.APPLICATION,
          toStage: ApplicationStage.APPLICATION,
        },
      }),
    ]);
  });

  test("copies the preferred providers, which stay eligible on the duplicate", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);
    // Outside the form's district filter, so only being preferred makes it eligible.
    const preferred = await createHousingProvider(testPrismaClient);
    await createHousingProviderLocation(testPrismaClient, {
      providerId: preferred.id,
      ...TEST_PROVIDER_LOCATION,
      district: "D9",
    });
    await testPrismaClient.preferredHousingProvider.create({
      data: {
        applicationId: application.id,
        providerId: preferred.id,
        rank: 0,
      },
    });

    const result = await duplicateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id },
    );

    await expect(
      readPreferredProviderIds(testPrismaClient, result.applicationId),
    ).resolves.toEqual([preferred.id]);
    const duplicate = await readDuplicate(result.applicationId);
    expect(duplicate.eligibleProviders).toEqual([
      expect.objectContaining({ providerId: preferred.id }),
    ]);
  });

  test("reuses the handwritten source's GCS object and creates a CONFIRMED/CLEAN document", async () => {
    const { application, document } = await seedStaffApplication(
      testPrismaClient,
      { withHandwrittenSourceDocument: true },
    );

    const { applicationId: duplicateId } = await duplicateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id },
    );

    const duplicate = await readDuplicate(duplicateId);
    expect(duplicate.documents).toHaveLength(1);
    expect(duplicate.documents[0]).toMatchObject({
      documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
      // Same bucket + key: the file is shared with the original, not copied.
      bucketName: document?.bucketName,
      objectKey: document?.objectKey,
      contentType: document?.contentType,
      fileSizeBytes: document?.fileSizeBytes,
      fileName: document?.fileName,
      status: HousingApplicationDocumentStatus.CONFIRMED,
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
      confirmedAt: expect.any(Date),
    });
  });

  test("reuses the digitized PDF's GCS object and creates a CONFIRMED/CLEAN document", async () => {
    const { application, digitizedDocument } = await seedStaffApplication(
      testPrismaClient,
      { withDigitizedDocument: true },
    );

    const { applicationId: duplicateId } = await duplicateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id },
    );

    const duplicate = await readDuplicate(duplicateId);
    expect(duplicate.documents).toHaveLength(1);
    expect(duplicate.documents[0]).toMatchObject({
      documentType: HousingApplicationDocumentType.DIGITIZED,
      bucketName: digitizedDocument?.bucketName,
      objectKey: digitizedDocument?.objectKey,
      contentType: digitizedDocument?.contentType,
      fileSizeBytes: digitizedDocument?.fileSizeBytes,
      fileName: digitizedDocument?.fileName,
      status: HousingApplicationDocumentStatus.CONFIRMED,
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
      confirmedAt: expect.any(Date),
    });
  });

  test("duplicates both the handwritten source and digitized documents together", async () => {
    const { application, document, digitizedDocument } =
      await seedStaffApplication(testPrismaClient, {
        withHandwrittenSourceDocument: true,
        withDigitizedDocument: true,
      });

    const { applicationId: duplicateId } = await duplicateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id },
    );

    const duplicate = await readDuplicate(duplicateId);
    expect(duplicate.documents).toIncludeSameMembers([
      expect.objectContaining({
        documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
        objectKey: document?.objectKey,
      }),
      expect.objectContaining({
        documentType: HousingApplicationDocumentType.DIGITIZED,
        objectKey: digitizedDocument?.objectKey,
      }),
    ]);
  });

  test.each([
    HousingApplicationDocumentScanStatus.PENDING,
    HousingApplicationDocumentScanStatus.INFECTED,
    HousingApplicationDocumentScanStatus.FAILED,
  ])(
    "does not duplicate a handwritten source document with scanStatus %s",
    async (scanStatus) => {
      const { application } = await seedStaffApplication(testPrismaClient);
      await createHousingApplicationDocument(testPrismaClient, {
        applicationId: application.id,
        scanStatus,
      });

      const { applicationId: duplicateId } = await duplicateHousingApplication(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        { applicationId: application.id },
      );

      const duplicate = await readDuplicate(duplicateId);
      expect(duplicate.documents).toHaveLength(0);
    },
  );

  test("does not create a document when there is no handwritten source", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    const { applicationId: duplicateId } = await duplicateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id },
    );

    const duplicate = await readDuplicate(duplicateId);
    expect(duplicate.documents).toHaveLength(0);
  });

  test("links the duplicate back to its source, queryable from either side", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    const result = await duplicateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id },
    );

    // Walking forward from the original finds the duplicate it was replaced by.
    const source = await testPrismaClient.housingApplication.findUniqueOrThrow({
      where: { id: application.id },
      include: { duplicates: { select: { id: true } }, duplicatedFrom: true },
    });
    expect(source.duplicates).toEqual([{ id: result.applicationId }]);
    expect(source.duplicatedFrom).toBeNull();

    // ...and walking back from the duplicate finds the original.
    const duplicate =
      await testPrismaClient.housingApplication.findUniqueOrThrow({
        where: { id: result.applicationId },
        include: { duplicatedFrom: { select: { id: true } } },
      });
    expect(duplicate.duplicatedFrom).toEqual({ id: application.id });
  });

  test("keeps the duplicate when its source is hard-deleted, nulling the back-pointer", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    const result = await duplicateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id },
    );

    await testPrismaClient.housingApplication.delete({
      where: { id: application.id },
    });

    // SetNull, not Cascade: deleting the closed original must not take the
    // live duplicate with it.
    const duplicate = await readDuplicate(result.applicationId);
    expect(duplicate.duplicatedFromId).toBeNull();
  });

  test("rejects duplicating another staff member's application", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    await expect(
      duplicateHousingApplication(testPrismaClient, "some-other-staff", {
        applicationId: application.id,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: STAFF_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );

    expect(await countApplications()).toBe(1);
    const staffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(staffApplication.stage).toBe(ApplicationStage.APPLICATION);
  });

  test("rejects duplicating an already-closed case", async () => {
    const { application } = await seedStaffApplication(testPrismaClient, {
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CANCELED,
      status: ApplicationStatus.DONE,
    });

    await expect(
      duplicateHousingApplication(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        { applicationId: application.id },
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: STAFF_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );

    expect(await countApplications()).toBe(1);
  });

  test("throws BAD_REQUEST and creates no duplicate when the case is closed after the pre-check", async () => {
    const { application } = await seedStaffApplication(testPrismaClient, {
      providerApplicationStages: [ApplicationStage.APPLICATION],
    });
    closeCaseBeforeTransaction(application.id);

    await expect(
      duplicateHousingApplication(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        { applicationId: application.id },
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: ADVANCE_STAGE_BAD_REQUEST.CASE_CLOSED,
      } satisfies Partial<TRPCError>),
    );

    // The flow rolls back as one transaction: no duplicate, no CASE_CLOSED
    // event, and the case is left exactly as the concurrent writer closed it.
    expect(await countApplications()).toBe(1);
    const staffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(staffApplication.stage).toBe(ApplicationStage.CLOSED);
    expect(await readTimelineEvents(testPrismaClient, application.id)).toEqual(
      [],
    );
  });
});

describe("duplicating a case its home plan provider revoked", () => {
  function seedRevokedCase(status: ApplicationStatus) {
    return seedStaffApplication(testPrismaClient, {
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
      status,
    });
  }

  function duplicate(applicationId: string) {
    return duplicateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId },
    );
  }

  test.each([ApplicationStatus.ACTION_NEEDED, ApplicationStatus.DONE])(
    "creates the copy from a %s source and marks the source done",
    async (status) => {
      const { application } = await seedRevokedCase(status);

      const { applicationId: duplicateId } = await duplicate(application.id);

      await expect(
        testPrismaClient.housingApplication.findUniqueOrThrow({
          where: { id: duplicateId },
        }),
      ).resolves.toMatchObject({ duplicatedFromId: application.id });
      await expect(
        readStaffApplication(testPrismaClient, application.id),
      ).resolves.toMatchObject({
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
        status: ApplicationStatus.DONE,
      });
      // The revoke already closed the source, so nothing closes it again.
      expect(
        await readTimelineEvents(testPrismaClient, application.id),
      ).toEqual([]);
    },
  );

  test("refuses a second duplicate", async () => {
    const { application } = await seedRevokedCase(
      ApplicationStatus.ACTION_NEEDED,
    );
    await duplicate(application.id);

    await expect(duplicate(application.id)).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
      } satisfies Partial<TRPCError>),
    );
    expect(await testPrismaClient.housingApplication.count()).toBe(2);
  });
});

describe("duplicating a case closed on a home plan decision", () => {
  function seedPlanRejectedCase(closedOutcome: ClosedOutcome) {
    return seedStaffApplication(testPrismaClient, {
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.PLAN_REJECTED,
      status: ApplicationStatus.DONE,
      closedOutcome,
    });
  }

  function duplicate(applicationId: string) {
    return duplicateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId },
    );
  }

  test("creates the copy from a rejected home plan and leaves the source closed", async () => {
    const { application } = await seedPlanRejectedCase(
      ClosedOutcome.HOUSING_PLAN_REJECTED,
    );

    const { applicationId: duplicateId } = await duplicate(application.id);

    await expect(
      testPrismaClient.housingApplication.findUniqueOrThrow({
        where: { id: duplicateId },
      }),
    ).resolves.toMatchObject({ duplicatedFromId: application.id });
    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.PLAN_REJECTED,
      status: ApplicationStatus.DONE,
      closedOutcome: ClosedOutcome.HOUSING_PLAN_REJECTED,
    });
    expect(await readTimelineEvents(testPrismaClient, application.id)).toEqual(
      [],
    );
  });

  test("refuses a second duplicate of a rejected home plan", async () => {
    const { application } = await seedPlanRejectedCase(
      ClosedOutcome.HOUSING_PLAN_REJECTED,
    );
    await duplicate(application.id);

    await expect(duplicate(application.id)).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
      } satisfies Partial<TRPCError>),
    );
    expect(await testPrismaClient.housingApplication.count()).toBe(2);
  });

  test("refuses a denied release", async () => {
    const { application } = await seedPlanRejectedCase(
      ClosedOutcome.RELEASE_DENIED,
    );

    await expect(duplicate(application.id)).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
      } satisfies Partial<TRPCError>),
    );
    expect(await testPrismaClient.housingApplication.count()).toBe(1);
  });
});
