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

import { PDF_OUTPUT_MODE } from "~@idaho-th/trpc/pdfSorter/constants";
import { PdfProcessingError } from "~@idaho-th/trpc/pdfSorter/errors";
import { VERTEX_UPLOAD_ORDERING_TIMEOUT_MS } from "~@idaho-th/trpc/routes/vertexUpload/vertexUpload.constants";
import {
  createAiExtractionMetrics,
  createHousingApplication,
  createHousingProvider,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { buildExtracted } from "./vertex.fixtures";

const prepareMocks = vi.hoisted(() => ({
  preparePdfSafely: vi.fn(),
  compressPreparedPdfSafely: vi.fn(),
}));
const draftIntakeMocks = vi.hoisted(() => ({
  claimApplicationForExtraction: vi.fn(),
  finalizeDraftIntakeApplicationData: vi.fn(),
  tryCleanupIntakeShell: vi.fn(),
}));
const helperMocks = vi.hoisted(() => ({
  findCleanStaffDocumentForExtraction: vi.fn(),
}));
const gcsMocks = vi.hoisted(() => ({
  decodeBase64ToBuffer: vi.fn((value: string) => Buffer.from(value, "base64")),
  downloadBufferFromGcs: vi.fn(),
  GCS_PDF_CONTENT_TYPE: "application/pdf" as const,
  generateSignedReadUrl: vi.fn(),
  resolveUnscannedUploadBucketName: vi.fn(() => "upload-bucket"),
  signingFailureTrpcError: vi.fn(
    (error: unknown) =>
      new TRPCError({ code: "PRECONDITION_FAILED", cause: error }),
  ),
  upsertBufferInGcs: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/pdfSorter/prepare/preparePdfSafely", () => ({
  ...prepareMocks,
}));

vi.mock("~@idaho-th/trpc/routes/draftIntake/draftIntake.service", () => ({
  ...draftIntakeMocks,
}));

vi.mock("~@idaho-th/trpc/routes/vertex/vertex.fromDocument.helpers", () => ({
  ...helperMocks,
}));

vi.mock("~@idaho-th/trpc/storage/gcs", () => ({ ...gcsMocks }));

const { extractWithVertexAIFromDocumentService } = await import(
  "~@idaho-th/trpc/routes/vertex/vertex.fromDocument.extractor"
);

const DOCUMENT_ID = "22222222-2222-4222-8222-222222222222";
const COMBINED_BASE64 = Buffer.from("%PDF-1.7 combined").toString("base64");

/**
 * AiExtractionMetrics.applicationId is a foreign key, so the marker write only
 * succeeds against a real application row — seeded per test below.
 */
let applicationId: string;

function buildDocument() {
  return {
    applicationId,
    bucketName: "clean-bucket",
    objectKey: "applications/app-1/documents/doc-1.pdf",
    fileName: "doc-1.pdf",
  };
}

const META = {
  traceId: "trace-1",
  procedureName: "vertex.extractWithVertexAIFromDocument",
  staffPseudonymizedId: "staff-1",
};

const PAGE_DATA = buildExtracted();

function buildDeps(
  analyzeApplicationPdf = vi.fn().mockResolvedValue({ data: PAGE_DATA }),
) {
  return {
    analyzeApplicationPdf,
    deps: {
      extractor: { analyzeApplicationPdf } as never,
      prisma: testPrismaClient,
      log: { info: vi.fn(), error: vi.fn() },
    },
  };
}

function buildPrepared(overrides = {}) {
  return {
    perPageBase64: [
      COMBINED_BASE64,
      COMBINED_BASE64,
      COMBINED_BASE64,
      COMBINED_BASE64,
    ],
    combinedBase64: COMBINED_BASE64,
    missingPageNumbers: [],
    ...overrides,
  };
}

beforeEach(async () => {
  await createHousingProvider(testPrismaClient, { name: "Sunrise House" });
  ({ id: applicationId } = await createHousingApplication(testPrismaClient));
  helperMocks.findCleanStaffDocumentForExtraction.mockResolvedValue(
    buildDocument(),
  );
  draftIntakeMocks.claimApplicationForExtraction.mockResolvedValue(true);
  gcsMocks.downloadBufferFromGcs.mockResolvedValue(
    Buffer.from(COMBINED_BASE64, "base64"),
  );
  gcsMocks.generateSignedReadUrl.mockResolvedValue("https://signed-url");
  gcsMocks.upsertBufferInGcs.mockResolvedValue(undefined);
  gcsMocks.decodeBase64ToBuffer.mockImplementation((value: string) =>
    Buffer.from(value, "base64"),
  );
  gcsMocks.resolveUnscannedUploadBucketName.mockReturnValue("upload-bucket");
  gcsMocks.signingFailureTrpcError.mockImplementation(
    (error: unknown) =>
      new TRPCError({ code: "PRECONDITION_FAILED", cause: error }),
  );
  prepareMocks.preparePdfSafely.mockResolvedValue(buildPrepared());
  prepareMocks.compressPreparedPdfSafely.mockResolvedValue(COMBINED_BASE64);
});

function run(deps = buildDeps().deps, input = { documentId: DOCUMENT_ID }) {
  return extractWithVertexAIFromDocumentService(input, META, deps);
}

/** The TRPCError the service rejects with, narrowed for `cause` assertions. */
async function runExpectingError(): Promise<TRPCError> {
  try {
    await run();
  } catch (error) {
    expect(error).toBeInstanceOf(TRPCError);
    return error as TRPCError;
  }
  throw new Error("expected the service to reject");
}

describe("document gating", () => {
  it("refuses a document that is not a clean staff upload", async () => {
    helperMocks.findCleanStaffDocumentForExtraction.mockResolvedValue(null);

    await expect(run()).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Document not found",
    });
    expect(prepareMocks.preparePdfSafely).not.toHaveBeenCalled();
  });

  it("scopes the lookup to the calling staff member", async () => {
    await run();

    expect(
      helperMocks.findCleanStaffDocumentForExtraction,
    ).toHaveBeenCalledWith(
      expect.anything(),
      DOCUMENT_ID,
      META.staffPseudonymizedId,
    );
  });

  it("does not clean up a shell it never claimed", async () => {
    helperMocks.findCleanStaffDocumentForExtraction.mockResolvedValue(null);

    await expect(run()).rejects.toBeInstanceOf(TRPCError);
    expect(draftIntakeMocks.tryCleanupIntakeShell).not.toHaveBeenCalled();
  });

  it("claims the shell before starting the pipeline", async () => {
    await run();

    expect(draftIntakeMocks.claimApplicationForExtraction).toHaveBeenCalledWith(
      expect.anything(),
      applicationId,
    );
  });

  it("rejects a concurrent duplicate call with CONFLICT instead of racing it", async () => {
    draftIntakeMocks.claimApplicationForExtraction.mockResolvedValue(false);

    await expect(run()).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Extraction is already in progress for this document",
    });
    expect(prepareMocks.preparePdfSafely).not.toHaveBeenCalled();
  });

  it("does not clean up the shell it lost the claim race on", async () => {
    draftIntakeMocks.claimApplicationForExtraction.mockResolvedValue(false);

    await expect(run()).rejects.toBeInstanceOf(TRPCError);
    // The other in-flight call still owns this shell — deleting it here would
    // pull the row out from under a request that hasn't finished yet.
    expect(draftIntakeMocks.tryCleanupIntakeShell).not.toHaveBeenCalled();
  });
});

describe("the happy path", () => {
  it("orders without compressing, extracts, and returns the up-front signed URL", async () => {
    const result = await run();

    expect(result).toMatchObject({
      applicationId,
      preparedPdf: { signedUrl: "https://signed-url" },
    });

    expect(prepareMocks.preparePdfSafely).toHaveBeenCalledWith(
      COMBINED_BASE64,
      expect.objectContaining({
        outputMode: PDF_OUTPUT_MODE.BOTH,
        skipCompression: true,
        signal: expect.any(AbortSignal),
      }),
    );
    expect(
      draftIntakeMocks.finalizeDraftIntakeApplicationData,
    ).toHaveBeenCalledTimes(1);
  });

  it("re-uploads the compressed copy to the upload bucket at the same key", async () => {
    await run();

    expect(gcsMocks.upsertBufferInGcs).toHaveBeenCalledWith({
      bucketName: "upload-bucket",
      objectKey: buildDocument().objectKey,
      buffer: Buffer.from(COMBINED_BASE64, "base64"),
      contentType: "application/pdf",
    });
  });

  it("reports the pages the ordering step could not find", async () => {
    prepareMocks.preparePdfSafely.mockResolvedValue(
      buildPrepared({
        perPageBase64: [
          COMBINED_BASE64,
          undefined,
          COMBINED_BASE64,
          COMBINED_BASE64,
        ],
        missingPageNumbers: [2],
      }),
    );

    await expect(run()).resolves.toMatchObject({ missingPages: [2] });
  });

  it("records the AI extraction marker exactly once", async () => {
    const result = await run();

    await vi.waitFor(async () => {
      const markers = await testPrismaClient.aiExtractionMetrics.findMany({
        where: { applicationId: result.applicationId },
      });
      expect(markers).toHaveLength(1);
    });
  });

  it("still succeeds when the marker write fails", async () => {
    const { deps } = buildDeps();
    // applicationId is unique on the marker table, so a pre-existing row makes
    // the write fail without stubbing Prisma.
    await createAiExtractionMetrics(testPrismaClient, { applicationId });

    await expect(run(deps)).resolves.toMatchObject({ applicationId });
    expect(deps.log.error).toHaveBeenCalledWith(
      "Failed to record AI extraction marker",
      expect.objectContaining({ documentId: DOCUMENT_ID }),
    );
  });
});

describe("failure handling", () => {
  it("surfaces a signing failure as a client error and cleans up the shell", async () => {
    gcsMocks.generateSignedReadUrl.mockRejectedValue(
      new Error("no client_email"),
    );

    await expect(run()).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    expect(draftIntakeMocks.tryCleanupIntakeShell).toHaveBeenCalledWith(
      expect.anything(),
      applicationId,
      META.staffPseudonymizedId,
    );
  });

  it("unwraps the abort reason when ordering times out", async () => {
    const reason = new PdfProcessingError(
      `PDF ordering/orientation timed out after ${VERTEX_UPLOAD_ORDERING_TIMEOUT_MS}ms`,
    );
    const abortError = Object.assign(new Error("The task has been aborted"), {
      name: "AbortError",
      cause: reason,
    });
    prepareMocks.preparePdfSafely.mockRejectedValue(abortError);

    // The generic Piscina wrapper would tell a reader nothing; the reason does.
    const error = await runExpectingError();
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.cause).toBe(reason);
  });

  it("rethrows an abort error that carries no reason", async () => {
    const abortError = Object.assign(new Error("aborted"), {
      name: "AbortError",
    });
    prepareMocks.preparePdfSafely.mockRejectedValue(abortError);

    expect((await runExpectingError()).cause).toBe(abortError);
  });

  it("clears the ordering timer once preparation settles", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    await run();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("fails when ordering produced no combined PDF", async () => {
    prepareMocks.preparePdfSafely.mockResolvedValue(
      buildPrepared({ combinedBase64: undefined }),
    );

    await expect(run()).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("logs but survives a compression or re-upload failure", async () => {
    prepareMocks.compressPreparedPdfSafely.mockRejectedValue(
      new Error("compressor pool exhausted"),
    );
    const { deps } = buildDeps();

    await expect(run(deps)).resolves.toMatchObject({
      applicationId,
    });
    expect(deps.log.error).toHaveBeenCalledWith(
      "Post-extraction PDF compression/re-upload failed",
      expect.objectContaining({ documentId: DOCUMENT_ID }),
    );
    expect(
      draftIntakeMocks.finalizeDraftIntakeApplicationData,
    ).toHaveBeenCalledTimes(1);
  });

  it("cleans up the shell and maps the error when extraction fails", async () => {
    const { deps } = buildDeps(
      vi.fn().mockRejectedValue(new PdfProcessingError("page unreadable")),
    );

    await expect(run(deps)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(draftIntakeMocks.tryCleanupIntakeShell).toHaveBeenCalledWith(
      expect.anything(),
      applicationId,
      META.staffPseudonymizedId,
    );
    expect(
      draftIntakeMocks.finalizeDraftIntakeApplicationData,
    ).not.toHaveBeenCalled();
  });
});
