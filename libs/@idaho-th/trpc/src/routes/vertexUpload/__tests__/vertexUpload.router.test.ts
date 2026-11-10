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

import { beforeEach, describe, expect, it } from "vitest";

import {
  ApplicationIntakeStatus,
  ApplicationStage,
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
} from "~@idaho-th/prisma/client";
import { DOCUMENT_UPLOAD_ERROR } from "~@idaho-th/shared";
import type { RequestVertexUploadInput } from "~@idaho-th/trpc/routes/vertexUpload/vertexUpload.upload.types";
import {
  staffCaller,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  seedVertexConfirmedDocument,
  seedVertexIntakeShell,
  seedVertexPendingDocument,
} from "./vertexUpload.fixtures";

const PDF_MIME = "application/pdf";
const OTHER_STAFF_PSEUDONYMIZED_ID = "other-staff";

// requestVertexUpload/confirmVertexUpload talk to GCS (signed URLs, then
// verifying the uploaded object) via these two modules. Mocked the same way
// vertexUpload.upload.service.test.ts mocks them, so the router test exercises
// real Prisma ownership/state logic against the test DB without touching GCS.
const gcsMocks = vi.hoisted(() => ({
  generateResumableUploadUrl: vi.fn(),
  deleteGcsObject: vi.fn(),
}));

const verifyUploadMocks = vi.hoisted(() => ({
  resolveConfirmableUploadRef: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/storage/gcs", () => {
  const mockedGcsConfig: { skipDocumentScan: boolean } = {
    skipDocumentScan: false,
  };
  return {
    // requestVertexUpload asserts the scan pipeline is configured before it
    // touches Prisma; there is no scan config in tests, so it always passes.
    assertScanPipelineConfigured: () => undefined,
    gcsConfig: mockedGcsConfig,
    // requestVertexUploadSchema (vertexUpload.upload.schema.ts) pins its
    // mimeType literal to this real constant, so it must stay unmocked.
    GCS_PDF_CONTENT_TYPE: "application/pdf",
    resolveUnscannedUploadBucketName: () => "test-bucket",
    generateResumableUploadUrl: gcsMocks.generateResumableUploadUrl,
    deleteGcsObject: gcsMocks.deleteGcsObject,
  };
});

vi.mock("~@idaho-th/trpc/routes/documents/documents.verifyUpload", () => ({
  resolveConfirmableUploadRef: verifyUploadMocks.resolveConfirmableUploadRef,
}));

beforeEach(() => {
  gcsMocks.generateResumableUploadUrl.mockResolvedValue("https://signed-url");
  gcsMocks.deleteGcsObject.mockResolvedValue(undefined);
  verifyUploadMocks.resolveConfirmableUploadRef.mockResolvedValue({
    ok: true,
    ref: { bucketName: "test-bucket", objectKey: "unset" },
  });
});

function requestUploadInput(
  overrides: Partial<RequestVertexUploadInput> = {},
): RequestVertexUploadInput {
  return {
    fileName: "intake.pdf",
    mimeType: PDF_MIME,
    sizeBytes: 2048,
    ...overrides,
  };
}

describe("vertexUploadRouter", () => {
  describe("input validation", () => {
    it("rejects a mimeType other than application/pdf on requestUpload", async () => {
      await expect(
        staffCaller().vertexUpload.requestUpload(
          requestUploadInput({ mimeType: "image/png" as never }),
        ),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a non-positive sizeBytes on requestUpload", async () => {
      await expect(
        staffCaller().vertexUpload.requestUpload(
          requestUploadInput({ sizeBytes: 0 }),
        ),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects an empty fileName on requestUpload", async () => {
      await expect(
        staffCaller().vertexUpload.requestUpload(
          requestUploadInput({ fileName: "   " }),
        ),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a documentId that is not a uuid on confirmUpload", async () => {
      await expect(
        staffCaller().vertexUpload.confirmUpload({ documentId: "not-a-uuid" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a documentId that is not a uuid on getScanStatus", async () => {
      await expect(
        staffCaller().vertexUpload.getScanStatus({ documentId: "not-a-uuid" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects an applicationId that is not a uuid on cancelUpload", async () => {
      await expect(
        staffCaller().vertexUpload.cancelUpload({
          applicationId: "not-a-uuid",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("requestUpload", () => {
    it("creates a PENDING shell application and document owned by the caller", async () => {
      const result =
        await staffCaller().vertexUpload.requestUpload(requestUploadInput());

      expect(result).toEqual({
        applicationId: expect.any(String),
        documentId: expect.any(String),
        uploadUrl: "https://signed-url",
      });

      const document =
        await testPrismaClient.housingApplicationDocument.findUnique({
          where: { id: result.documentId },
        });
      expect(document).toMatchObject({
        applicationId: result.applicationId,
        uploadedByPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        status: HousingApplicationDocumentStatus.PENDING,
      });

      const staffApplication =
        await testPrismaClient.staffHousingApplication.findUnique({
          where: { applicationId: result.applicationId },
        });
      expect(staffApplication).toMatchObject({
        staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        intakeStatus: ApplicationIntakeStatus.DRAFT,
        stage: ApplicationStage.DRAFT,
      });
    });
  });

  describe("confirmUpload", () => {
    it("confirms the caller's pending document and persists the resolved bucket", async () => {
      const { document } = await seedVertexPendingDocument(testPrismaClient);
      verifyUploadMocks.resolveConfirmableUploadRef.mockResolvedValue({
        ok: true,
        ref: { bucketName: "test-clean-bucket", objectKey: document.objectKey },
      });

      await expect(
        staffCaller().vertexUpload.confirmUpload({ documentId: document.id }),
      ).resolves.toBeUndefined();

      const updated =
        await testPrismaClient.housingApplicationDocument.findUnique({
          where: { id: document.id },
        });
      expect(updated).toMatchObject({
        status: HousingApplicationDocumentStatus.CONFIRMED,
        bucketName: "test-clean-bucket",
      });
      expect(updated?.confirmedAt).not.toBeNull();
    });

    it("rejects confirming a document uploaded by another staff member", async () => {
      const { document } = await seedVertexPendingDocument(testPrismaClient, {
        staffPseudonymizedId: OTHER_STAFF_PSEUDONYMIZED_ID,
        uploadedByPseudonymizedId: OTHER_STAFF_PSEUDONYMIZED_ID,
      });

      await expect(
        staffCaller().vertexUpload.confirmUpload({ documentId: document.id }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: DOCUMENT_UPLOAD_ERROR.UPLOAD_NOT_FOUND,
      });

      const unchanged =
        await testPrismaClient.housingApplicationDocument.findUnique({
          where: { id: document.id },
        });
      expect(unchanged?.status).toBe(HousingApplicationDocumentStatus.PENDING);
    });
  });

  describe("getScanStatus", () => {
    it("returns the scan status for the caller's confirmed document", async () => {
      const { document } = await seedVertexConfirmedDocument(testPrismaClient);

      await expect(
        staffCaller().vertexUpload.getScanStatus({ documentId: document.id }),
      ).resolves.toEqual({
        scanStatus: HousingApplicationDocumentScanStatus.PENDING,
      });
    });

    it("does not expose a document on an application owned by another staff member", async () => {
      const { document } = await seedVertexConfirmedDocument(testPrismaClient, {
        staffPseudonymizedId: OTHER_STAFF_PSEUDONYMIZED_ID,
      });

      await expect(
        staffCaller().vertexUpload.getScanStatus({ documentId: document.id }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("cancelUpload", () => {
    it("deletes the caller's empty intake shell", async () => {
      const { application } = await seedVertexIntakeShell(testPrismaClient);

      await expect(
        staffCaller().vertexUpload.cancelUpload({
          applicationId: application.id,
        }),
      ).resolves.toEqual({ deleted: true });

      await expect(
        testPrismaClient.housingApplication.findUnique({
          where: { id: application.id },
        }),
      ).resolves.toBeNull();
    });

    it("does not delete a shell owned by another staff member", async () => {
      const { application } = await seedVertexIntakeShell(testPrismaClient, {
        staffPseudonymizedId: OTHER_STAFF_PSEUDONYMIZED_ID,
      });

      await expect(
        staffCaller().vertexUpload.cancelUpload({
          applicationId: application.id,
        }),
      ).resolves.toEqual({ deleted: false });

      await expect(
        testPrismaClient.housingApplication.findUnique({
          where: { id: application.id },
        }),
      ).resolves.not.toBeNull();
    });
  });
});
