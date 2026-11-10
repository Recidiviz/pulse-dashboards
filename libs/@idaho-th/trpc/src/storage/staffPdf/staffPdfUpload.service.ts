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

import { HousingApplicationDocumentType } from "~@idaho-th/prisma/client";
import type { ProcedureMeta } from "~@idaho-th/trpc/routes/common/procedureMeta";
import { buildApplicationDocumentFileName } from "~@idaho-th/trpc/storage/applicationDocument/applicationDocumentObjectKey.builder";
import {
  decodeBase64ToBuffer,
  deleteGcsObject,
  GCS_PDF_CONTENT_TYPE,
  gcsConfig,
  getGcsObjectMetadata,
  resolveGcsReadAccess,
  toObjectMetadata,
  uploadBufferToGcs,
} from "~@idaho-th/trpc/storage/gcs";
import type {
  StaffPdfReadAccessOptions,
  StaffPdfUploadInput,
  StaffPdfUploadWithReadAccess,
} from "~@idaho-th/trpc/storage/staffPdf/staffPdf.types";
import { buildStaffUploadObjectKey } from "~@idaho-th/trpc/storage/staffPdf/staffPdfObjectKey.builder";
import { generateUuid } from "~@idaho-th/trpc/utils/common";

/**
 * Uploads a staff-supplied PDF to GCS under a staff-scoped object key keyed on a
 * random, opaque object id (never client PII). Persistence of a
 * HousingApplicationDocument row is handled by the draft-intake service after
 * extraction completes.
 */
export async function uploadPdfToGcsWithReadAccess(
  input: StaffPdfUploadInput,
  procedureMeta: ProcedureMeta,
  readAccessOptions?: StaffPdfReadAccessOptions,
): Promise<StaffPdfUploadWithReadAccess> {
  const documentType =
    input.documentType ?? HousingApplicationDocumentType.HANDWRITTEN_SOURCE;
  // Random, opaque object id so the GCS path/filename carries no PII and is not
  // derivable from the application; the mapping is recorded in the DB objectKey.
  const objectId = generateUuid();
  const fileName = buildApplicationDocumentFileName(objectId, documentType);
  const objectKey = buildStaffUploadObjectKey(
    procedureMeta.staffPseudonymizedId,
    objectId,
    documentType,
  );
  const ref = { bucketName: gcsConfig.bucketName, objectKey };

  await uploadBufferToGcs({
    ...ref,
    buffer: decodeBase64ToBuffer(input.pdfBase64),
    contentType: GCS_PDF_CONTENT_TYPE,
  });

  try {
    const metadataSource = await getGcsObjectMetadata(ref);
    const metadata = toObjectMetadata(
      ref,
      metadataSource,
      GCS_PDF_CONTENT_TYPE,
    );

    const readAccess = await resolveGcsReadAccess(ref, {
      devInlineReadFallback: readAccessOptions?.devInlineReadFallback,
      fileMetadata: metadataSource,
    });

    return {
      ...metadata,
      fileName,
      signedUrl: readAccess.signedUrl,
      pdfBase64: readAccess.contentBase64,
    };
  } catch (error) {
    await deleteGcsObject(ref).catch(() => undefined);
    throw error;
  }
}
