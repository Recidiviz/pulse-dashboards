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
  DOCUMENT_UPLOAD_ERROR,
  type DocumentUploadErrorCode,
  MAX_DOCUMENT_BYTES,
} from "~@idaho-th/trpc/routes/documents/documents.constants";
import {
  MAGIC_BYTES_READ_LENGTH,
  magicBytesMatchMimeType,
} from "~@idaho-th/trpc/routes/documents/documents.fileTypes";
import { markDocumentRejected } from "~@idaho-th/trpc/routes/documents/documents.helpers";
import type {
  DbClient,
  PendingDocument,
  UploadVerificationResult,
} from "~@idaho-th/trpc/routes/documents/documents.types";
import {
  deleteGcsObject,
  downloadGcsObjectHead,
  gcsConfig,
  type GcsObjectRef,
  getGcsObjectMetadata,
  isGcsNotFoundError,
  toFiniteNumber,
} from "~@idaho-th/trpc/storage/gcs";

function uploadVerificationError(code: DocumentUploadErrorCode): never {
  throw new TRPCError({ code: "BAD_REQUEST", message: code });
}

async function rejectInvalidUpload(
  client: DbClient,
  documentId: string,
  objectRef: GcsObjectRef,
  reason: DocumentUploadErrorCode,
): Promise<never> {
  await markDocumentRejected(client, documentId, reason);
  await deleteGcsObject(objectRef).catch(() => undefined);
  throw uploadVerificationError(reason);
}

export async function verifyUploadedDocument(
  ref: GcsObjectRef,
  declaredContentType: string,
): Promise<UploadVerificationResult> {
  const metadata = await getGcsObjectMetadata(ref);
  const sizeBytes = toFiniteNumber(metadata.size);
  if (sizeBytes == null || sizeBytes > MAX_DOCUMENT_BYTES) {
    return { ok: false, code: DOCUMENT_UPLOAD_ERROR.FILE_TOO_LARGE };
  }

  const head = await downloadGcsObjectHead(ref, MAGIC_BYTES_READ_LENGTH);
  if (!magicBytesMatchMimeType(head, declaredContentType)) {
    return { ok: false, code: DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH };
  }

  return { ok: true };
}

export type ResolveConfirmableUploadResult =
  | { ok: true; ref: GcsObjectRef }
  | { ok: false; ref?: GcsObjectRef; code: DocumentUploadErrorCode };

export async function resolveConfirmableUploadRef(input: {
  bucketName: string;
  objectKey: string;
  contentType: string;
}): Promise<ResolveConfirmableUploadResult> {
  const candidateBucketNames = [
    ...new Set([input.bucketName, gcsConfig.cleanBucketName]),
  ];

  for (const bucketName of candidateBucketNames) {
    const ref: GcsObjectRef = { bucketName, objectKey: input.objectKey };

    let verification: UploadVerificationResult;
    try {
      // Candidates must be tried in order, not concurrently: the clean
      // bucket should only be checked once the stored bucket is confirmed
      // missing, so a real invalid-file verdict there is never masked by a
      // stray hit in the other bucket.
      // eslint-disable-next-line no-await-in-loop
      verification = await verifyUploadedDocument(ref, input.contentType);
    } catch (error) {
      if (isGcsNotFoundError(error)) {
        continue;
      }
      throw error;
    }

    if (!verification.ok) {
      return { ok: false, ref, code: verification.code };
    }
    return { ok: true, ref };
  }

  return { ok: false, code: DOCUMENT_UPLOAD_ERROR.UPLOAD_FAILED };
}

export async function resolveOrRejectUpload(
  client: DbClient,
  documentId: string,
  pending: Pick<PendingDocument, "bucketName" | "objectKey" | "contentType">,
): Promise<GcsObjectRef> {
  const resolved = await resolveConfirmableUploadRef({
    bucketName: pending.bucketName,
    objectKey: pending.objectKey,
    contentType: pending.contentType,
  });
  if (resolved.ok) {
    return resolved.ref;
  }
  if (resolved.ref) {
    await rejectInvalidUpload(client, documentId, resolved.ref, resolved.code);
  }
  throw uploadVerificationError(resolved.code);
}
