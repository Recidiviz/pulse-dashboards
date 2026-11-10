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
  HousingApplicationDocumentStatus,
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
  deleteGcsObject: vi.fn(),
  gcsConfig: { skipDocumentScan: false },
}));

vi.mock("~@idaho-th/trpc/storage/gcs", () => ({ ...gcsMocks }));

const {
  createDraftIntakeApplicationShell,
  finalizeDraftIntakeApplicationData,
  getDocumentScanState,
} = await import("../draftIntake.service");

const STAFF_PSEUDONYMIZED_ID = "staff-1";

const DOCUMENT_INPUT = {
  bucketName: "quarantine-bucket",
  objectKey: "applications/staff/staff-1/HANDWRITTEN_SOURCE/obj.pdf",
  contentType: "application/pdf",
  fileSizeBytes: 2048,
  fileName: "obj.pdf",
};

beforeEach(() => {
  gcsMocks.deleteGcsObject.mockResolvedValue(undefined);
});

describe("createDraftIntakeApplicationShell", () => {
  it("creates an empty DRAFT shell with a PENDING document", async () => {
    const applicationId = "11111111-1111-4111-8111-111111111111";

    const result = await createDraftIntakeApplicationShell(testPrismaClient, {
      applicationId,
      staffPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
      document: DOCUMENT_INPUT,
    });

    expect(result.applicationId).toBe(applicationId);
    expect(result.documentId).toBeTruthy();

    const application = await testPrismaClient.housingApplication.findUnique({
      where: { id: applicationId },
      select: {
        clientName: true,
        formData: true,
        idocNumber: true,
        expectedReleaseDate: true,
        staffApplication: { select: { intakeStatus: true, stage: true } },
        documents: {
          select: {
            status: true,
            scanStatus: true,
            fileName: true,
            confirmedAt: true,
          },
        },
      },
    });

    expect(application).toMatchObject({
      clientName: "",
      formData: {},
      idocNumber: null,
      expectedReleaseDate: null,
      staffApplication: {
        intakeStatus: ApplicationIntakeStatus.DRAFT,
        stage: ApplicationStage.DRAFT,
      },
    });
    // The upload is already CONFIRMED (the object landed); it is the scan
    // verdict that stays PENDING until the ClamAV webhook flips it.
    expect(application?.documents[0]).toMatchObject({
      status: HousingApplicationDocumentStatus.CONFIRMED,
      scanStatus: HousingApplicationDocumentScanStatus.PENDING,
      fileName: DOCUMENT_INPUT.fileName,
    });
    expect(application?.documents[0]?.confirmedAt).toBeInstanceOf(Date);
  });

  it("leaves confirmedAt unset for an explicitly PENDING document", async () => {
    const applicationId = "22222222-2222-4222-8222-222222222222";

    await createDraftIntakeApplicationShell(testPrismaClient, {
      applicationId,
      staffPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
      document: DOCUMENT_INPUT,
      documentStatus: HousingApplicationDocumentStatus.PENDING,
    });

    const document =
      await testPrismaClient.housingApplicationDocument.findFirst({
        where: { applicationId },
        select: { status: true, confirmedAt: true },
      });
    expect(document?.status).toBe(HousingApplicationDocumentStatus.PENDING);
    expect(document?.confirmedAt).toBeNull();
  });

  it("generates a file name when the upload did not supply one", async () => {
    const applicationId = "33333333-3333-4333-8333-333333333333";

    await createDraftIntakeApplicationShell(testPrismaClient, {
      applicationId,
      staffPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
      document: { ...DOCUMENT_INPUT, fileName: "   " },
    });

    const document =
      await testPrismaClient.housingApplicationDocument.findFirst({
        where: { applicationId },
        select: { fileName: true },
      });
    expect(document?.fileName).toMatch(/_handwritten-application\.pdf$/);
  });

  it("deletes the uploaded object when the row create fails", async () => {
    const applicationId = "44444444-4444-4444-8444-444444444444";
    await createDraftIntakeApplicationShell(testPrismaClient, {
      applicationId,
      staffPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
      document: DOCUMENT_INPUT,
    });

    // The same id again violates the primary key.
    await expect(
      createDraftIntakeApplicationShell(testPrismaClient, {
        applicationId,
        staffPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
        document: DOCUMENT_INPUT,
      }),
    ).rejects.toThrow();

    expect(gcsMocks.deleteGcsObject).toHaveBeenCalledWith({
      bucketName: DOCUMENT_INPUT.bucketName,
      objectKey: DOCUMENT_INPUT.objectKey,
    });
  });
});

describe("finalizeDraftIntakeApplicationData", () => {
  async function seedShell() {
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
    return application.id;
  }

  it("copies the scalars out of the extracted form data", async () => {
    const applicationId = await seedShell();

    await finalizeDraftIntakeApplicationData(testPrismaClient, {
      applicationId,
      formData: {
        clientFullName: "Jane Doe",
        idocNumber: "12345",
        tpdHousingNeededDate: "08/01/2026",
      },
    });

    await expect(
      testPrismaClient.housingApplication.findUnique({
        where: { id: applicationId },
        select: {
          clientName: true,
          idocNumber: true,
          expectedReleaseDate: true,
          formData: true,
          rawAiResponse: true,
        },
      }),
    ).resolves.toMatchObject({
      clientName: "Jane Doe",
      idocNumber: "12345",
      expectedReleaseDate: new Date("2026-08-01T00:00:00.000Z"),
      formData: { clientFullName: "Jane Doe" },
      rawAiResponse: { clientFullName: "Jane Doe" },
    });
  });

  it.each([
    ["a missing name", {}, { clientName: "", idocNumber: null }],
    [
      "a non-string idoc number",
      { clientFullName: "Jane Doe", idocNumber: 12345 },
      { clientName: "Jane Doe", idocNumber: null },
    ],
    [
      "an unparseable release date",
      { tpdHousingNeededDate: "not a date" },
      { expectedReleaseDate: null },
    ],
  ])("falls back for %s", async (_label, formData, expected) => {
    const applicationId = await seedShell();

    await finalizeDraftIntakeApplicationData(testPrismaClient, {
      applicationId,
      formData,
    });

    await expect(
      testPrismaClient.housingApplication.findUnique({
        where: { id: applicationId },
        select: {
          clientName: true,
          idocNumber: true,
          expectedReleaseDate: true,
        },
      }),
    ).resolves.toMatchObject(expected);
  });

  it("rejects for an application that does not exist", async () => {
    await expect(
      finalizeDraftIntakeApplicationData(testPrismaClient, {
        applicationId: "55555555-5555-4555-8555-555555555555",
        formData: {},
      }),
    ).rejects.toThrow();
  });
});

describe("getDocumentScanState", () => {
  it.each(Object.values(HousingApplicationDocumentScanStatus))(
    "reports the %s verdict with the document's current bucket",
    async (scanStatus) => {
      const application = await createHousingApplication(testPrismaClient);
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        {
          applicationId: application.id,
          scanStatus,
          bucketName: "clean-bucket",
        },
      );

      await expect(
        getDocumentScanState(testPrismaClient, document.objectKey),
      ).resolves.toEqual({ scanStatus, bucketName: "clean-bucket" });
    },
  );

  it("returns null for an object key with no document row", async () => {
    await expect(
      getDocumentScanState(testPrismaClient, "applications/nope.pdf"),
    ).resolves.toBeNull();
  });
});
