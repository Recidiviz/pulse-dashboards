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
import { VertexExtractionError } from "~@idaho-th/trpc/routes/vertex/vertex.errors";
import type {
  PreparedPdf,
  PreparedPdfForClient,
  PreparedPdfGcsUploadResult,
} from "~@idaho-th/trpc/routes/vertex/vertex.types";
import { deleteGcsObject } from "~@idaho-th/trpc/storage/gcs";
import { uploadPdfToGcsWithReadAccess } from "~@idaho-th/trpc/storage/staffPdf";

export function toPreparedPdfForClient(
  upload: PreparedPdfGcsUploadResult,
): PreparedPdfForClient {
  return {
    signedUrl: upload.signedUrl,
    sizeInBytes: upload.sizeInBytes,
    updatedAt: upload.updatedAt,
  };
}

export type UploadPreparedCombinedPdfOptions = {
  documentType?: HousingApplicationDocumentType;
  procedureMeta: ProcedureMeta;
};

export async function uploadPreparedCombinedPdfToGcs(
  prepared: PreparedPdf,
  options: UploadPreparedCombinedPdfOptions,
): Promise<PreparedPdfGcsUploadResult> {
  const combinedBase64 = prepared.combinedBase64;
  if (!combinedBase64) {
    throw new VertexExtractionError(
      "Prepared combined PDF is missing; preparation must include combined output",
    );
  }

  const upload = await uploadPdfToGcsWithReadAccess(
    {
      pdfBase64: combinedBase64,
      documentType:
        options.documentType ??
        HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
    },
    options.procedureMeta,
    { devInlineReadFallback: false },
  );

  if (!upload.signedUrl) {
    await deleteGcsObject({
      bucketName: upload.bucketName,
      objectKey: upload.objectKey,
    }).catch(() => undefined);
    throw new VertexExtractionError(
      "Expected a signed read URL after uploading the prepared PDF; inline base64 fallback is disabled for this flow",
    );
  }

  return {
    objectKey: upload.objectKey,
    bucketName: upload.bucketName,
    contentType: upload.contentType,
    sizeInBytes: upload.sizeInBytes,
    updatedAt: upload.updatedAt,
    fileName: upload.fileName,
    signedUrl: upload.signedUrl,
  };
}
