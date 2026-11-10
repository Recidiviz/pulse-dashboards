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
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  type PrismaClient,
} from "~@idaho-th/prisma/client";
import { DOCUMENT_UPLOAD_ERROR } from "~@idaho-th/shared";
import type { DocumentUploadErrorCode } from "~@idaho-th/trpc/routes/documents/documents.constants";
import {
  findOwnedPendingDocument,
  findStaffDocumentForScanStatus,
  markDocumentConfirmed,
} from "~@idaho-th/trpc/routes/documents/documents.helpers";
import { resolveConfirmableUploadRef } from "~@idaho-th/trpc/routes/documents/documents.verifyUpload";
import {
  cleanupIntakeShell,
  tryCleanupIntakeShell,
} from "~@idaho-th/trpc/routes/draftIntake/draftIntake.cleanup";
import { createDraftIntakeApplicationShell } from "~@idaho-th/trpc/routes/draftIntake/draftIntake.service";
import { MAX_VERTEX_UPLOAD_BYTES } from "~@idaho-th/trpc/routes/vertexUpload/vertexUpload.constants";
import type {
  RequestVertexUploadInput,
  RequestVertexUploadResult,
  VertexUploadScanStatusResult,
} from "~@idaho-th/trpc/routes/vertexUpload/vertexUpload.upload.types";
import {
  buildStaffApplicationDocumentObjectKey,
  sanitizeDisplayFileName,
} from "~@idaho-th/trpc/storage/applicationDocument/applicationDocumentObjectKey.builder";
import {
  assertScanPipelineConfigured,
  deleteGcsObject,
  gcsConfig,
  type GcsObjectRef,
  generateResumableUploadUrl,
  resolveUnscannedUploadBucketName,
} from "~@idaho-th/trpc/storage/gcs";
import { generateUuid } from "~@idaho-th/trpc/utils/common";

const DOCUMENT_NOT_FOUND = "Document not found";

function uploadError(code: DocumentUploadErrorCode): TRPCError {
  return new TRPCError({ code: "BAD_REQUEST", message: code });
}

/**
 * Requests a signed upload URL for a new vertex-intake PDF and creates the
 * shell application + PENDING document row up front, mirroring
 * requestDocumentUpload in documents.service.ts. Unlike that flow, there is
 * no pre-existing applicationId: one is minted here since a vertex upload
 * always starts a brand-new draft application.
 *
 * Raw bytes land directly in gcsConfig.bucketName (the only bucket the app
 * service account can write to — see resolveUnscannedUploadBucketName), and
 * extraction later downloads the object and re-uploads its ordered/
 * compressed version to the same bucket/objectKey — see
 * vertex.fromDocument.extractor.ts.
 */
export async function requestVertexUpload(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: RequestVertexUploadInput,
): Promise<RequestVertexUploadResult> {
  assertScanPipelineConfigured();
  if (input.sizeBytes > MAX_VERTEX_UPLOAD_BYTES) {
    throw uploadError(DOCUMENT_UPLOAD_ERROR.FILE_TOO_LARGE);
  }

  const bucketName = resolveUnscannedUploadBucketName();

  const applicationId = generateUuid();
  const objectId = generateUuid();
  const objectKey = buildStaffApplicationDocumentObjectKey({
    staffPseudonymizedId,
    objectId,
    documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
  });

  const uploadUrl = await generateResumableUploadUrl({
    bucketName,
    objectKey,
    contentType: input.mimeType,
  });

  const shell = await createDraftIntakeApplicationShell(prisma, {
    applicationId,
    staffPseudonymizedId,
    document: {
      bucketName,
      objectKey,
      contentType: input.mimeType,
      fileSizeBytes: input.sizeBytes,
      fileName: sanitizeDisplayFileName(input.fileName),
    },
    documentStatus: HousingApplicationDocumentStatus.PENDING,
  });

  if (!shell.documentId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create document row for vertex upload",
    });
  }

  return { applicationId, documentId: shell.documentId, uploadUrl };
}

/**
 * Vertex-intake uploads create a temporary empty shell application (there is
 * no pre-existing case to keep). On verification failure we cascade-delete
 * that shell rather than soft-rejecting the document with markDocumentRejected
 * — leaving REJECTED + empty DRAFT is the orphan this flow is designed to
 * avoid. Document-tab uploads still use markDocumentRejected because they
 * attach to a real existing application.
 */
async function rejectInvalidUpload(
  prisma: PrismaClient,
  pending: { applicationId: string },
  staffPseudonymizedId: string,
  objectRef: GcsObjectRef | undefined,
  reason: DocumentUploadErrorCode,
): Promise<never> {
  // objectRef is absent only when the object was never found in either bucket
  // (UPLOAD_FAILED); otherwise remove the rejected upload from GCS.
  if (objectRef) {
    await deleteGcsObject(objectRef).catch(() => undefined);
  }
  await tryCleanupIntakeShell(
    prisma,
    pending.applicationId,
    staffPseudonymizedId,
  );
  throw uploadError(reason);
}

/**
 * Confirms a vertex-intake upload once the browser has PUT bytes directly to
 * GCS: verifies the object actually landed and matches the declared content
 * type, then flips PENDING -> CONFIRMED. scanStatus is left PENDING (or
 * flipped to CLEAN by markDocumentConfirmed's skipDocumentScan escape hatch)
 * for the existing /internal/gcs-object-scanned webhook to resolve, exactly
 * as it does for Document Tab uploads.
 */
export async function confirmVertexUpload(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  documentId: string,
): Promise<void> {
  const pending = await findOwnedPendingDocument(
    prisma,
    documentId,
    staffPseudonymizedId,
  );
  if (!pending) {
    throw uploadError(DOCUMENT_UPLOAD_ERROR.UPLOAD_NOT_FOUND);
  }

  // Resolve which bucket now holds the object (the scan may already have moved
  // it to the clean bucket). On failure, cascade-delete the empty intake shell
  // rather than soft-rejecting the document — a REJECTED + empty DRAFT is the
  // orphan this flow exists to avoid (see rejectInvalidUpload).
  const resolved = await resolveConfirmableUploadRef({
    bucketName: pending.bucketName,
    objectKey: pending.objectKey,
    contentType: pending.contentType,
  });
  if (!resolved.ok) {
    return rejectInvalidUpload(
      prisma,
      pending,
      staffPseudonymizedId,
      resolved.ref,
      resolved.code,
    );
  }
  const ref = resolved.ref;

  await markDocumentConfirmed(prisma, documentId, {
    bucketName: ref.bucketName,
    scanStatus: gcsConfig.skipDocumentScan
      ? HousingApplicationDocumentScanStatus.CLEAN
      : undefined,
  });
}

export async function getVertexUploadScanStatus(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  documentId: string,
): Promise<VertexUploadScanStatusResult> {
  const document = await findStaffDocumentForScanStatus(
    prisma,
    documentId,
    staffPseudonymizedId,
  );
  if (!document) {
    throw new TRPCError({ code: "NOT_FOUND", message: DOCUMENT_NOT_FOUND });
  }

  return { scanStatus: document.scanStatus };
}

/**
 * Cancels a failed vertex-intake upload by deleting the empty shell
 * application created at requestUpload time. Safe to call multiple times.
 */
export async function cancelVertexUpload(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  applicationId: string,
): Promise<{ deleted: boolean }> {
  const deleted = await cleanupIntakeShell(
    prisma,
    applicationId,
    staffPseudonymizedId,
  );
  return { deleted };
}
