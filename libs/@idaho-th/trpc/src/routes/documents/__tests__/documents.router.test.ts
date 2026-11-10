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
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
} from "~@idaho-th/prisma/client";
import { DOCUMENT_UPLOAD_ERROR } from "~@idaho-th/shared";
import {
  providerCaller,
  staffCaller,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";
import {
  createHousingApplicationDocument,
  createHousingProvider,
  seedApplicationProvider,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { MAX_DOCUMENT_BYTES } from "../documents.constants";
import {
  seedDocumentsProviderUser,
  seedProviderDocumentsApplication,
  seedStaffDocumentsApplication,
} from "./documents.fixtures";

// GCS is the only external boundary — mocked here the same way the unit tests
// in this folder mock it (see documents.upload.test.ts,
// documents.downloadDelete.test.ts), so the router test exercises the real
// service/DB path (including upload verification) without hitting real GCS.
const gcsMocks = vi.hoisted(() => ({
  generateResumableUploadUrl: vi.fn(),
  deleteGcsObject: vi.fn(),
  resolveGcsReadAccess: vi.fn(),
  getGcsObjectMetadata: vi.fn(),
  downloadGcsObjectHead: vi.fn(),
}));

// Only the network-calling exports are stubbed; everything else (gcsConfig,
// constants, etc.) stays real since other routers pulled in via appRouter
// (e.g. vertexUpload) import additional named exports from this module.
vi.mock("~@idaho-th/trpc/storage/gcs", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~@idaho-th/trpc/storage/gcs")>();
  return {
    ...actual,
    generateResumableUploadUrl: gcsMocks.generateResumableUploadUrl,
    deleteGcsObject: gcsMocks.deleteGcsObject,
    resolveGcsReadAccess: gcsMocks.resolveGcsReadAccess,
    getGcsObjectMetadata: gcsMocks.getGcsObjectMetadata,
    downloadGcsObjectHead: gcsMocks.downloadGcsObjectHead,
  };
});

/** Leading bytes of a real PDF, so magic-byte verification passes. */
const PDF_HEAD_BYTES = Buffer.from([
  0x25,
  0x50,
  0x44,
  0x46,
  ...Array(12).fill(0),
]);

beforeEach(() => {
  gcsMocks.generateResumableUploadUrl.mockResolvedValue("https://signed-url");
  gcsMocks.deleteGcsObject.mockResolvedValue(undefined);
  gcsMocks.resolveGcsReadAccess.mockResolvedValue({
    signedUrl: "https://download-url",
    contentBase64: null,
  });
  gcsMocks.getGcsObjectMetadata.mockResolvedValue({ size: "1024" });
  gcsMocks.downloadGcsObjectHead.mockResolvedValue(PDF_HEAD_BYTES);
});

function seedStaffApp(staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID) {
  return seedStaffDocumentsApplication(testPrismaClient, {
    staffPseudonymizedId,
  });
}

/** An application shared with the organization providerCaller() acts as. */
async function seedProviderApp() {
  const seeded = await seedProviderDocumentsApplication(testPrismaClient);
  await seedDocumentsProviderUser(testPrismaClient, {
    providerId: seeded.housingProvider.id,
  });
  return seeded;
}

/**
 * An application shared with an organization the caller has no assignment to.
 * The caller still resolves an organization of its own, so the refusal under
 * test is the application scope and not a missing active organization.
 */
async function seedForeignProviderApp() {
  const seeded = await seedProviderDocumentsApplication(testPrismaClient);
  const callersHousingProvider = await createHousingProvider(testPrismaClient);
  await seedDocumentsProviderUser(testPrismaClient, {
    providerId: callersHousingProvider.id,
  });
  return seeded;
}

function findDocument(documentId: string) {
  return testPrismaClient.housingApplicationDocument.findUnique({
    where: { id: documentId },
  });
}

describe("documentsRouter", () => {
  describe("input validation", () => {
    it("rejects an applicationId that is not a uuid", async () => {
      await expect(
        staffCaller().documents.listForStaff({
          applicationId: "not-a-uuid",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a documentId that is not a uuid", async () => {
      await expect(
        staffCaller().documents.confirmUploadForStaff({
          documentId: "not-a-uuid",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a non-positive sizeBytes", async () => {
      const { application } = await seedStaffApp();

      await expect(
        staffCaller().documents.requestUploadForStaff({
          applicationId: application.id,
          fileName: "note.pdf",
          mimeType: "application/pdf",
          sizeBytes: 0,
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a non-integer sizeBytes", async () => {
      const { application } = await seedStaffApp();

      await expect(
        staffCaller().documents.requestUploadForStaff({
          applicationId: application.id,
          fileName: "note.pdf",
          mimeType: "application/pdf",
          sizeBytes: 12.5,
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("ignores a client-supplied documentType and forces ATTACHMENT", async () => {
      const { application } = await seedStaffApp();

      // documentType is not on the input schema: HANDWRITTEN_SOURCE and
      // DIGITIZED rows are undeletable, so letting a caller pick the type
      // would let anyone create a document nobody can remove.
      const result = await staffCaller().documents.requestUploadForStaff({
        applicationId: application.id,
        fileName: "note.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
      } as never);

      await expect(findDocument(result.documentId)).resolves.toMatchObject({
        documentType: HousingApplicationDocumentType.ATTACHMENT,
      });
    });
  });

  describe("listForStaff", () => {
    it("returns the confirmed documents for the owning staff member", async () => {
      const { application } = await seedStaffApp();
      await createHousingApplicationDocument(testPrismaClient, {
        applicationId: application.id,
      });

      const documents = await staffCaller().documents.listForStaff({
        applicationId: application.id,
      });

      expect(documents).toHaveLength(1);
      expect(documents[0]).toMatchObject({ fileName: "handwritten.pdf" });
    });

    it("does not expose an application owned by another staff member", async () => {
      const { application } = await seedStaffApp("other-staff");

      await expect(
        staffCaller().documents.listForStaff({ applicationId: application.id }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("listForProvider", () => {
    it("returns the visible documents for a provider on the application", async () => {
      const { application } = await seedProviderApp();
      await createHousingApplicationDocument(testPrismaClient, {
        applicationId: application.id,
      });

      const documents = await providerCaller().documents.listForProvider({
        applicationId: application.id,
      });

      expect(documents).toHaveLength(1);
    });

    it("does not expose an application the provider is not on", async () => {
      const { application } = await seedForeignProviderApp();

      await expect(
        providerCaller().documents.listForProvider({
          applicationId: application.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("requestUploadForStaff", () => {
    it("creates a PENDING document row and returns a resumable upload URL", async () => {
      const { application } = await seedStaffApp();

      const result = await staffCaller().documents.requestUploadForStaff({
        applicationId: application.id,
        fileName: "intake notes.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
      });

      expect(result.uploadUrl).toBe("https://signed-url");
      await expect(findDocument(result.documentId)).resolves.toMatchObject({
        applicationId: application.id,
        status: "PENDING",
        uploadedByType: HousingApplicationDocumentUploader.STAFF,
        uploadedByPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      });
    });

    it("does not allow uploading against an application owned by another staff member", async () => {
      const { application } = await seedStaffApp("other-staff");

      await expect(
        staffCaller().documents.requestUploadForStaff({
          applicationId: application.id,
          fileName: "note.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("requestUploadForProvider", () => {
    it("creates a PENDING document row scoped to the uploading provider", async () => {
      const { application, housingProvider } = await seedProviderApp();

      const result = await providerCaller().documents.requestUploadForProvider({
        applicationId: application.id,
        fileName: "proof.png",
        mimeType: "image/png",
        sizeBytes: 4096,
      });

      await expect(findDocument(result.documentId)).resolves.toMatchObject({
        applicationId: application.id,
        status: "PENDING",
        uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
        uploadedByPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
        scopedProviderId: housingProvider.id,
      });
    });

    it("does not allow uploading against an application the provider is not on", async () => {
      const { application } = await seedStaffApp();
      const callersHousingProvider =
        await createHousingProvider(testPrismaClient);
      await seedDocumentsProviderUser(testPrismaClient, {
        providerId: callersHousingProvider.id,
      });

      await expect(
        providerCaller().documents.requestUploadForProvider({
          applicationId: application.id,
          fileName: "proof.png",
          mimeType: "image/png",
          sizeBytes: 4096,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("confirmUploadForStaff", () => {
    it("confirms the staff member's own pending upload", async () => {
      const { application } = await seedStaffApp();
      const pending = await createHousingApplicationDocument(testPrismaClient, {
        applicationId: application.id,
        status: "PENDING",
        confirmedAt: null,
        scanStatus: "PENDING",
      });

      const result = await staffCaller().documents.confirmUploadForStaff({
        documentId: pending.id,
      });

      expect(result.id).toBe(pending.id);
      await expect(findDocument(pending.id)).resolves.toMatchObject({
        status: "CONFIRMED",
      });
    });

    it("does not confirm a pending upload owned by another staff member", async () => {
      const { application } = await seedStaffApp();
      const pending = await createHousingApplicationDocument(testPrismaClient, {
        applicationId: application.id,
        uploadedByPseudonymizedId: "other-staff",
        status: "PENDING",
        confirmedAt: null,
        scanStatus: "PENDING",
      });

      await expect(
        staffCaller().documents.confirmUploadForStaff({
          documentId: pending.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(findDocument(pending.id)).resolves.toMatchObject({
        status: "PENDING",
      });
    });

    it("rejects an upload over the size cap and deletes the object", async () => {
      const { application } = await seedStaffApp();
      const pending = await createHousingApplicationDocument(testPrismaClient, {
        applicationId: application.id,
        status: "PENDING",
        confirmedAt: null,
        scanStatus: "PENDING",
      });
      gcsMocks.getGcsObjectMetadata.mockResolvedValue({
        size: String(MAX_DOCUMENT_BYTES + 1),
      });

      await expect(
        staffCaller().documents.confirmUploadForStaff({
          documentId: pending.id,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: DOCUMENT_UPLOAD_ERROR.FILE_TOO_LARGE,
      });
      await expect(findDocument(pending.id)).resolves.toMatchObject({
        status: "REJECTED",
        rejectionReason: DOCUMENT_UPLOAD_ERROR.FILE_TOO_LARGE,
      });
      expect(gcsMocks.deleteGcsObject).toHaveBeenCalledWith({
        bucketName: pending.bucketName,
        objectKey: pending.objectKey,
      });
    });

    it("rejects an upload whose bytes do not match the declared MIME type", async () => {
      const { application } = await seedStaffApp();
      const pending = await createHousingApplicationDocument(testPrismaClient, {
        applicationId: application.id,
        contentType: "application/pdf",
        status: "PENDING",
        confirmedAt: null,
        scanStatus: "PENDING",
      });
      // A PNG masquerading as a PDF: the declared type is on the allowlist,
      // so only the magic-byte check can catch it.
      gcsMocks.downloadGcsObjectHead.mockResolvedValue(
        Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0,
          0,
        ]),
      );

      await expect(
        staffCaller().documents.confirmUploadForStaff({
          documentId: pending.id,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH,
      });
      await expect(findDocument(pending.id)).resolves.toMatchObject({
        status: "REJECTED",
        rejectionReason: DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH,
      });
      expect(gcsMocks.deleteGcsObject).toHaveBeenCalledWith({
        bucketName: pending.bucketName,
        objectKey: pending.objectKey,
      });
    });
  });

  describe("confirmUploadForProvider", () => {
    it("confirms the provider's own pending upload", async () => {
      const { application, housingProvider } = await seedProviderApp();
      const pending = await createHousingApplicationDocument(testPrismaClient, {
        applicationId: application.id,
        uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
        uploadedByPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
        scopedProviderId: housingProvider.id,
        status: "PENDING",
        confirmedAt: null,
        scanStatus: "PENDING",
      });

      const result = await providerCaller().documents.confirmUploadForProvider({
        documentId: pending.id,
      });

      expect(result.id).toBe(pending.id);
      await expect(findDocument(pending.id)).resolves.toMatchObject({
        status: "CONFIRMED",
      });
    });

    // Confirming is the tail of the uploader's own request — the signed URL
    // was handed to them — so it stays with the person even though the
    // confirmed document is then shared with the whole organization.
    it("does not confirm a colleague's pending upload", async () => {
      const { application, housingProvider } = await seedProviderApp();
      const pending = await createHousingApplicationDocument(testPrismaClient, {
        applicationId: application.id,
        uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
        uploadedByPseudonymizedId: "colleague-1",
        scopedProviderId: housingProvider.id,
        status: "PENDING",
        confirmedAt: null,
        scanStatus: "PENDING",
      });

      await expect(
        providerCaller().documents.confirmUploadForProvider({
          documentId: pending.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("getDownloadUrlForStaff", () => {
    it("returns a download URL for a document on the staff member's application", async () => {
      const { application } = await seedStaffApp();
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        { applicationId: application.id },
      );

      const result = await staffCaller().documents.getDownloadUrlForStaff({
        documentId: document.id,
      });

      expect(result.downloadUrl).toBe("https://download-url");
    });

    it("does not expose a document on another staff member's application", async () => {
      const { application } = await seedStaffApp("other-staff");
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        { applicationId: application.id },
      );

      await expect(
        staffCaller().documents.getDownloadUrlForStaff({
          documentId: document.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("getDownloadUrlForProvider", () => {
    it("returns a download URL for a shared document visible to the provider", async () => {
      const { application } = await seedProviderApp();
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        { applicationId: application.id },
      );

      const result = await providerCaller().documents.getDownloadUrlForProvider(
        { documentId: document.id },
      );

      expect(result.downloadUrl).toBe("https://download-url");
    });

    it("does not expose a document to a provider not on the application", async () => {
      const { application } = await seedForeignProviderApp();
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        { applicationId: application.id },
      );

      await expect(
        providerCaller().documents.getDownloadUrlForProvider({
          documentId: document.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("getPreviewUrlForStaff", () => {
    it("returns a preview URL for the source document on a DRAFT application", async () => {
      const { application } = await seedStaffApp();
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        { applicationId: application.id },
      );

      const result = await staffCaller().documents.getPreviewUrlForStaff({
        documentId: document.id,
      });

      expect(result.downloadUrl).toBe("https://download-url");
    });

    it("does not record a DOCUMENT_DOWNLOADED timeline event", async () => {
      const { application } = await seedStaffApp();
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        { applicationId: application.id },
      );

      await staffCaller().documents.getPreviewUrlForStaff({
        documentId: document.id,
      });

      const events =
        await testPrismaClient.housingApplicationTimelineEvent.findMany({
          where: { applicationId: application.id },
        });
      expect(events).toHaveLength(0);
    });

    it("throws NOT_FOUND once the application is no longer DRAFT", async () => {
      const { application, staffApplication } = await seedStaffApp();
      await testPrismaClient.staffHousingApplication.update({
        where: { id: staffApplication.id },
        data: { intakeStatus: ApplicationIntakeStatus.SUBMITTED },
      });
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        { applicationId: application.id },
      );

      await expect(
        staffCaller().documents.getPreviewUrlForStaff({
          documentId: document.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("does not expose a document on another staff member's application", async () => {
      const { application } = await seedStaffApp("other-staff");
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        { applicationId: application.id },
      );

      await expect(
        staffCaller().documents.getPreviewUrlForStaff({
          documentId: document.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("getScanStatusForStaff", () => {
    it("returns the scan status for a document on the staff member's application", async () => {
      const { application } = await seedStaffApp();
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        { applicationId: application.id },
      );

      await expect(
        staffCaller().documents.getScanStatusForStaff({
          documentId: document.id,
        }),
      ).resolves.toEqual({ scanStatus: "CLEAN" });
    });

    it("does not expose scan status for another staff member's document", async () => {
      const { application } = await seedStaffApp("other-staff");
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        { applicationId: application.id },
      );

      await expect(
        staffCaller().documents.getScanStatusForStaff({
          documentId: document.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("getScanStatusForProvider", () => {
    it("returns the scan status for a shared document visible to the provider", async () => {
      const { application } = await seedProviderApp();
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        { applicationId: application.id },
      );

      await expect(
        providerCaller().documents.getScanStatusForProvider({
          documentId: document.id,
        }),
      ).resolves.toEqual({ scanStatus: "CLEAN" });
    });

    it("does not expose scan status to a provider not on the application", async () => {
      const { application } = await seedForeignProviderApp();
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        { applicationId: application.id },
      );

      await expect(
        providerCaller().documents.getScanStatusForProvider({
          documentId: document.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("deleteForStaff", () => {
    it("deletes the staff member's own attachment", async () => {
      const { application } = await seedStaffApp();
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        {
          applicationId: application.id,
          documentType: HousingApplicationDocumentType.ATTACHMENT,
        },
      );

      await expect(
        staffCaller().documents.deleteForStaff({ documentId: document.id }),
      ).resolves.toEqual({ id: document.id });
      await expect(findDocument(document.id)).resolves.toBeNull();
    });

    it("does not delete an attachment uploaded by another staff member", async () => {
      const { application } = await seedStaffApp();
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        {
          applicationId: application.id,
          documentType: HousingApplicationDocumentType.ATTACHMENT,
          uploadedByPseudonymizedId: "other-staff",
        },
      );

      await expect(
        staffCaller().documents.deleteForStaff({ documentId: document.id }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(findDocument(document.id)).resolves.not.toBeNull();
    });
  });

  describe("deleteForProvider", () => {
    it("deletes the provider's own attachment", async () => {
      const { application, housingProvider } = await seedProviderApp();
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        {
          applicationId: application.id,
          documentType: HousingApplicationDocumentType.ATTACHMENT,
          uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
          uploadedByPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
          scopedProviderId: housingProvider.id,
        },
      );

      await expect(
        providerCaller().documents.deleteForProvider({
          documentId: document.id,
        }),
      ).resolves.toEqual({ id: document.id });
      await expect(findDocument(document.id)).resolves.toBeNull();
    });

    it("does not delete an attachment scoped to another provider", async () => {
      const { application } = await seedProviderApp();
      const otherHousingProvider =
        await createHousingProvider(testPrismaClient);
      const document = await createHousingApplicationDocument(
        testPrismaClient,
        {
          applicationId: application.id,
          documentType: HousingApplicationDocumentType.ATTACHMENT,
          uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
          uploadedByPseudonymizedId: "other-housing-provider-user",
          scopedProviderId: otherHousingProvider.id,
        },
      );

      await expect(
        providerCaller().documents.deleteForProvider({
          documentId: document.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(findDocument(document.id)).resolves.not.toBeNull();
    });
  });
  describe("one shared file set per provider", () => {
    const COLLEAGUE_PSEUDONYMIZED_ID = "provider-colleague-1";

    /** Two colleagues signed in to the same organization. */
    async function seedColleagues() {
      const seeded = await seedProviderApp();
      await seedDocumentsProviderUser(testPrismaClient, {
        providerId: seeded.housingProvider.id,
        pseudonymizedId: COLLEAGUE_PSEUDONYMIZED_ID,
      });
      return seeded;
    }

    function colleagueCaller(housingProviderId: string) {
      return providerCaller({
        providerPseudonymizedId: COLLEAGUE_PSEUDONYMIZED_ID,
        requestedProviderId: housingProviderId,
      });
    }

    function createHousingProviderAttachment(
      applicationId: string,
      housingProviderId: string,
      uploadedByPseudonymizedId: string,
    ) {
      return createHousingApplicationDocument(testPrismaClient, {
        applicationId,
        documentType: HousingApplicationDocumentType.ATTACHMENT,
        uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
        uploadedByPseudonymizedId,
        scopedProviderId: housingProviderId,
      });
    }

    it("lets one user delete an attachment a colleague uploaded", async () => {
      const { application, housingProvider } = await seedColleagues();
      // Uploaded by the colleague — who may since have left the organization.
      const document = await createHousingProviderAttachment(
        application.id,
        housingProvider.id,
        COLLEAGUE_PSEUDONYMIZED_ID,
      );

      await expect(
        providerCaller().documents.deleteForProvider({
          documentId: document.id,
        }),
      ).resolves.toEqual({ id: document.id });
      await expect(findDocument(document.id)).resolves.toBeNull();
    });

    it("does not let a user at a different provider delete it", async () => {
      const { application, housingProvider } = await seedColleagues();
      const document = await createHousingProviderAttachment(
        application.id,
        housingProvider.id,
        COLLEAGUE_PSEUDONYMIZED_ID,
      );
      const outsiderHousingProvider =
        await createHousingProvider(testPrismaClient);
      await seedDocumentsProviderUser(testPrismaClient, {
        providerId: outsiderHousingProvider.id,
        pseudonymizedId: "provider-outsider-1",
      });

      await expect(
        providerCaller({
          providerPseudonymizedId: "provider-outsider-1",
          requestedProviderId: outsiderHousingProvider.id,
        }).documents.deleteForProvider({ documentId: document.id }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(findDocument(document.id)).resolves.not.toBeNull();
    });

    it("hides a document another provider scoped privately to itself", async () => {
      const { application } = await seedProviderApp();
      const otherHousingProvider = await seedApplicationProvider(
        testPrismaClient,
        application.id,
      );
      const privateDocument = await createHousingProviderAttachment(
        application.id,
        otherHousingProvider.provider.id,
        "other-housing-provider-user",
      );

      const documents = await providerCaller().documents.listForProvider({
        applicationId: application.id,
      });

      expect(documents.map((document) => document.id)).not.toContain(
        privateDocument.id,
      );
    });

    it("does not expose another provider's private document for download", async () => {
      const { application } = await seedProviderApp();
      const otherHousingProvider = await seedApplicationProvider(
        testPrismaClient,
        application.id,
      );
      const privateDocument = await createHousingProviderAttachment(
        application.id,
        otherHousingProvider.provider.id,
        "other-housing-provider-user",
      );

      await expect(
        providerCaller().documents.getDownloadUrlForProvider({
          documentId: privateDocument.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("leaves system-generated document types undeletable by the provider", async () => {
      const { application, housingProvider } = await seedProviderApp();
      const digitized = await createHousingApplicationDocument(
        testPrismaClient,
        {
          applicationId: application.id,
          documentType: HousingApplicationDocumentType.DIGITIZED,
          uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
          uploadedByPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
          scopedProviderId: housingProvider.id,
        },
      );

      await expect(
        providerCaller().documents.deleteForProvider({
          documentId: digitized.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(findDocument(digitized.id)).resolves.not.toBeNull();
    });

    // The capability flag on a list row and the ownership clause in the
    // deletion lookup are two readings of one rule. Asserting them against
    // *each other*, rather than each against a hard-coded expectation, is what
    // makes this fail if either one is changed on its own.
    it("gives every listed row a canDelete flag that matches what deleting it does", async () => {
      const { application, housingProvider } = await seedColleagues();
      // A row for each side of the rule: a colleague's attachment (deletable),
      // a system-generated type and a case manager's upload (both not).
      await createHousingProviderAttachment(
        application.id,
        housingProvider.id,
        COLLEAGUE_PSEUDONYMIZED_ID,
      );
      await createHousingApplicationDocument(testPrismaClient, {
        applicationId: application.id,
        documentType: HousingApplicationDocumentType.DIGITIZED,
        uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
        uploadedByPseudonymizedId: COLLEAGUE_PSEUDONYMIZED_ID,
        scopedProviderId: housingProvider.id,
      });
      await createHousingApplicationDocument(testPrismaClient, {
        applicationId: application.id,
        documentType: HousingApplicationDocumentType.ATTACHMENT,
      });

      const documents = await colleagueCaller(
        housingProvider.id,
      ).documents.listForProvider({ applicationId: application.id });

      expect(
        documents.filter((document) => document.canDelete),
      ).not.toHaveLength(0);
      expect(
        documents.filter((document) => !document.canDelete),
      ).not.toHaveLength(0);

      const outcomes = await Promise.all(
        documents.map(async (document) => ({
          canDelete: document.canDelete,
          deleted: await colleagueCaller(housingProvider.id)
            .documents.deleteForProvider({ documentId: document.id })
            .then(() => true)
            .catch(() => false),
        })),
      );

      expect(
        outcomes.filter((outcome) => outcome.canDelete !== outcome.deleted),
      ).toEqual([]);
    });
  });
});
