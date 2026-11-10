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
  PreparedPdfGcsUploadResult,
} from "~@idaho-th/trpc/routes/vertex/vertex.types";

const gcsMocks = vi.hoisted(() => ({ deleteGcsObject: vi.fn() }));
const staffPdfMocks = vi.hoisted(() => ({
  uploadPdfToGcsWithReadAccess: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/storage/gcs", () => ({ ...gcsMocks }));
vi.mock("~@idaho-th/trpc/storage/staffPdf", () => ({ ...staffPdfMocks }));

const { toPreparedPdfForClient, uploadPreparedCombinedPdfToGcs } = await import(
  "~@idaho-th/trpc/routes/vertex/vertex.preparedPdf.upload"
);

const COMBINED_BASE64 = Buffer.from("%PDF-1.7 combined").toString("base64");

const PREPARED: PreparedPdf = {
  perPageBase64: [],
  combinedBase64: COMBINED_BASE64,
  missingPageNumbers: [],
};

const PROCEDURE_META = {
  traceId: "trace-1",
  procedureName: "vertex.extractWithVertexAI.uploadPreparedPdf",
  prisma: {} as never,
  staffPseudonymizedId: "staff-1",
} as ProcedureMeta;

const UPLOAD = {
  objectKey: "applications/staff/staff-1/HANDWRITTEN_SOURCE/obj.pdf",
  bucketName: "quarantine-bucket",
  contentType: "application/pdf",
  fileName: "obj.pdf",
  sizeInBytes: 4096,
  updatedAt: "2026-07-08T00:00:00.000Z",
  signedUrl: "https://signed-url",
  pdfBase64: null,
};

beforeEach(() => {
  staffPdfMocks.uploadPdfToGcsWithReadAccess.mockResolvedValue(UPLOAD);
  // The subject chains .catch() onto the delete, so it must return a promise.
  gcsMocks.deleteGcsObject.mockResolvedValue(undefined);
});

describe("toPreparedPdfForClient", () => {
  it("exposes only the three client-facing fields", () => {
    const upload: PreparedPdfGcsUploadResult = {
      objectKey: UPLOAD.objectKey,
      bucketName: UPLOAD.bucketName,
      contentType: UPLOAD.contentType,
      fileName: UPLOAD.fileName,
      sizeInBytes: UPLOAD.sizeInBytes,
      updatedAt: UPLOAD.updatedAt,
      signedUrl: UPLOAD.signedUrl,
    };

    // The bucket name and object key are server-side detail; leaking them
    // would hand a client the storage layout.
    expect(toPreparedPdfForClient(upload)).toEqual({
      signedUrl: UPLOAD.signedUrl,
      sizeInBytes: UPLOAD.sizeInBytes,
      updatedAt: UPLOAD.updatedAt,
    });
  });

  it("keeps optional fields undefined rather than inventing values", () => {
    expect(
      toPreparedPdfForClient({
        objectKey: UPLOAD.objectKey,
        bucketName: UPLOAD.bucketName,
        contentType: UPLOAD.contentType,
        fileName: UPLOAD.fileName,
        signedUrl: UPLOAD.signedUrl,
      }),
    ).toEqual({
      signedUrl: UPLOAD.signedUrl,
      sizeInBytes: undefined,
      updatedAt: undefined,
    });
  });
});

describe("uploadPreparedCombinedPdfToGcs", () => {
  it("uploads the combined PDF with the inline fallback disabled", async () => {
    await expect(
      uploadPreparedCombinedPdfToGcs(PREPARED, {
        procedureMeta: PROCEDURE_META,
      }),
    ).resolves.toEqual({
      objectKey: UPLOAD.objectKey,
      bucketName: UPLOAD.bucketName,
      contentType: UPLOAD.contentType,
      sizeInBytes: UPLOAD.sizeInBytes,
      updatedAt: UPLOAD.updatedAt,
      fileName: UPLOAD.fileName,
      signedUrl: UPLOAD.signedUrl,
    });

    expect(staffPdfMocks.uploadPdfToGcsWithReadAccess).toHaveBeenCalledWith(
      {
        pdfBase64: COMBINED_BASE64,
        documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
      },
      PROCEDURE_META,
      // Inlining a whole application PDF as base64 is never acceptable here.
      { devInlineReadFallback: false },
    );
  });

  it("honours an explicit document type", async () => {
    await uploadPreparedCombinedPdfToGcs(PREPARED, {
      procedureMeta: PROCEDURE_META,
      documentType: HousingApplicationDocumentType.DIGITIZED,
    });

    expect(
      staffPdfMocks.uploadPdfToGcsWithReadAccess.mock.calls[0]?.[0],
    ).toMatchObject({
      documentType: HousingApplicationDocumentType.DIGITIZED,
    });
  });

  it("refuses to upload when no combined PDF was prepared", async () => {
    await expect(
      uploadPreparedCombinedPdfToGcs(
        { ...PREPARED, combinedBase64: undefined },
        { procedureMeta: PROCEDURE_META },
      ),
    ).rejects.toThrow(VertexExtractionError);
    expect(staffPdfMocks.uploadPdfToGcsWithReadAccess).not.toHaveBeenCalled();
  });

  it("deletes the object and fails when no signed URL came back", async () => {
    staffPdfMocks.uploadPdfToGcsWithReadAccess.mockResolvedValue({
      ...UPLOAD,
      signedUrl: null,
    });

    await expect(
      uploadPreparedCombinedPdfToGcs(PREPARED, {
        procedureMeta: PROCEDURE_META,
      }),
    ).rejects.toThrow("Expected a signed read URL");

    // Leaving the object behind would orphan it in the quarantine bucket.
    expect(gcsMocks.deleteGcsObject).toHaveBeenCalledWith({
      bucketName: UPLOAD.bucketName,
      objectKey: UPLOAD.objectKey,
    });
  });

  it("still reports the missing signed URL when the cleanup delete fails", async () => {
    staffPdfMocks.uploadPdfToGcsWithReadAccess.mockResolvedValue({
      ...UPLOAD,
      signedUrl: null,
    });
    gcsMocks.deleteGcsObject.mockRejectedValue(new Error("delete failed"));

    await expect(
      uploadPreparedCombinedPdfToGcs(PREPARED, {
        procedureMeta: PROCEDURE_META,
      }),
    ).rejects.toThrow("Expected a signed read URL");
  });
});
