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

import type { FakeGcsStorage } from "../../gcs/__tests__/gcs.fake";
import {
  createFakeGcsStorage,
  DEFAULT_SIGNED_URL,
} from "../../gcs/__tests__/gcs.fake";

const holder = vi.hoisted(() => ({ current: null as unknown }));

// Plain class, not vi.fn: the config-level mockReset would empty a mocked
// constructor's implementation between tests.
vi.mock("@google-cloud/storage", () => ({
  Storage: class {
    bucket(bucketName: string) {
      return (holder.current as FakeGcsStorage).bucket(bucketName);
    }
  },
}));

const { ensureGcsStorageInitialized } = await import(
  "~@idaho-th/trpc/storage/gcs/gcs.client"
);
const { gcsConfig } = await import("~@idaho-th/trpc/storage/gcs/gcs.config");
const { uploadPdfToGcsWithReadAccess } = await import(
  "../staffPdfUpload.service"
);

const STAFF_PSEUDONYMIZED_ID = "staff-1";
const PDF_BASE64 = Buffer.from("%PDF-1.7 fake").toString("base64");

const procedureMeta = {
  traceId: "trace-1",
  procedureName: "staffPdf.upload",
  staffPseudonymizedId: STAFF_PSEUDONYMIZED_ID,
} as ProcedureMeta;

let fake: FakeGcsStorage;

beforeEach(async () => {
  fake = createFakeGcsStorage();
  holder.current = fake;
  await ensureGcsStorageInitialized();
});

/** The single file the upload created, whatever random object id it chose. */
function uploadedFile() {
  const entries = [...fake.files.entries()];
  expect(entries).toHaveLength(1);

  const [entry] = entries;
  if (!entry) {
    throw new Error("the upload created no file");
  }

  const [objectKey, file] = entry;
  return { objectKey, file };
}

describe("uploadPdfToGcsWithReadAccess", () => {
  beforeEach(() => {
    // uploadBufferToGcs refuses to overwrite, so the key must read as absent.
    fake.onFileCreated = (file) => file.exists.mockResolvedValue([false]);
  });

  it("stores the PDF under a staff-scoped key carrying no PII", async () => {
    const result = await uploadPdfToGcsWithReadAccess(
      { pdfBase64: PDF_BASE64 },
      procedureMeta,
    );

    const { objectKey, file } = uploadedFile();
    expect(objectKey).toStartWith(
      `${gcsConfig.bucketName}/applications/staff/${STAFF_PSEUDONYMIZED_ID}/HANDWRITTEN_SOURCE/`,
    );
    expect(file.save).toHaveBeenCalledWith(
      Buffer.from(PDF_BASE64, "base64"),
      expect.objectContaining({ contentType: "application/pdf" }),
    );

    expect(result).toMatchObject({
      bucketName: gcsConfig.bucketName,
      contentType: "application/pdf",
      signedUrl: DEFAULT_SIGNED_URL,
      pdfBase64: null,
    });
    expect(result.fileName).toEndWith("_handwritten-application.pdf");
  });

  it("uses the requested document type", async () => {
    await uploadPdfToGcsWithReadAccess(
      {
        pdfBase64: PDF_BASE64,
        documentType: HousingApplicationDocumentType.DIGITIZED,
      },
      procedureMeta,
    );

    expect(uploadedFile().objectKey).toContain("/DIGITIZED/");
  });

  it("gives every upload its own opaque object id", async () => {
    const first = await uploadPdfToGcsWithReadAccess(
      { pdfBase64: PDF_BASE64 },
      procedureMeta,
    );
    const second = await uploadPdfToGcsWithReadAccess(
      { pdfBase64: PDF_BASE64 },
      procedureMeta,
    );

    expect(first.objectKey).not.toBe(second.objectKey);
  });

  it("deletes the orphaned object when read access cannot be resolved", async () => {
    const signingError = new Error("bucket does not exist");
    fake.onFileCreated = (file) => {
      file.exists.mockResolvedValue([false]);
      file.getSignedUrl.mockRejectedValue(signingError);
    };

    await expect(
      uploadPdfToGcsWithReadAccess({ pdfBase64: PDF_BASE64 }, procedureMeta),
    ).rejects.toBe(signingError);

    // An upload that cannot be handed back must not stay in the bucket.
    expect(uploadedFile().file.delete).toHaveBeenCalledTimes(1);
  });

  it("still surfaces the original error when the cleanup delete fails", async () => {
    const signingError = new Error("bucket does not exist");
    fake.onFileCreated = (file) => {
      file.exists.mockResolvedValue([false]);
      file.getSignedUrl.mockRejectedValue(signingError);
      file.delete.mockRejectedValue(new Error("delete failed"));
    };

    await expect(
      uploadPdfToGcsWithReadAccess({ pdfBase64: PDF_BASE64 }, procedureMeta),
    ).rejects.toBe(signingError);
  });
});
