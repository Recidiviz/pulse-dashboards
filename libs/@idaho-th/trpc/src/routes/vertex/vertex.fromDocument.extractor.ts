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

import type { Prisma, PrismaClient } from "~@idaho-th/prisma/client";
import { PDF_OUTPUT_MODE } from "~@idaho-th/trpc/pdfSorter/constants";
import { PdfProcessingError } from "~@idaho-th/trpc/pdfSorter/errors";
import {
  compressPreparedPdfSafely,
  preparePdfSafely,
} from "~@idaho-th/trpc/pdfSorter/prepare/preparePdfSafely";
import { segment } from "~@idaho-th/trpc/routes/common/segment";
import {
  claimApplicationForExtraction,
  finalizeDraftIntakeApplicationData,
  tryCleanupIntakeShell,
} from "~@idaho-th/trpc/routes/draftIntake/draftIntake.service";
import { formatVertexErrorForLog } from "~@idaho-th/trpc/routes/vertex/vertex.errors";
import { findCleanStaffDocumentForExtraction } from "~@idaho-th/trpc/routes/vertex/vertex.fromDocument.helpers";
import type { ExtractWithVertexAIFromDocumentInput } from "~@idaho-th/trpc/routes/vertex/vertex.fromDocument.schema";
import {
  loadProviderCatalog,
  mapVertexProcedureError,
  resolveExtractedPreferredProviders,
  resolveExtractionConfig,
  runExtraction,
} from "~@idaho-th/trpc/routes/vertex/vertex.housing.extractor";
import {
  buildSystemPrompt,
  HOUSING_APPLICATION_USER_PROMPT,
} from "~@idaho-th/trpc/routes/vertex/vertex.prompt";
import { buildVertexExtractionSchemas } from "~@idaho-th/trpc/routes/vertex/vertex.schema";
import { resolveResponseSchema } from "~@idaho-th/trpc/routes/vertex/vertex.schema.confidence";
import type {
  AnalyzePdfOptions,
  HousingVertexExtractResult,
  HousingVertexProcedureDeps,
  HousingVertexProcedureMeta,
} from "~@idaho-th/trpc/routes/vertex/vertex.types";
import { VERTEX_UPLOAD_ORDERING_TIMEOUT_MS } from "~@idaho-th/trpc/routes/vertexUpload/vertexUpload.constants";
import {
  decodeBase64ToBuffer,
  downloadBufferFromGcs,
  GCS_PDF_CONTENT_TYPE,
  generateSignedReadUrl,
  resolveUnscannedUploadBucketName,
  signingFailureTrpcError,
  upsertBufferInGcs,
} from "~@idaho-th/trpc/storage/gcs";
import { contentDispositionAttachment } from "~@idaho-th/trpc/storage/gcs/contentDisposition";

const DOCUMENT_NOT_FOUND_OR_NOT_CLEAN = "Document not found";
const EXTRACTION_ALREADY_IN_PROGRESS =
  "Extraction is already in progress for this document";

/**
 * Builds an AbortController that self-aborts with a PdfProcessingError after
 * `timeoutMs`, plus a `clear()` to cancel that timer once the guarded work
 * finishes (success or failure) so it doesn't fire after the fact.
 */
function createAbortTimeout(
  timeoutMs: number,
  buildMessage: () => string,
): { controller: AbortController; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new PdfProcessingError(buildMessage()));
  }, timeoutMs);
  return { controller, clear: () => clearTimeout(timer) };
}

/**
 * Creates a scan marker so override-rate metrics can count this application
 * once extraction completes. This runs at most once per application: it
 * happens only on the signed-URL upload path, once, right after the CLEAN
 * re-check confirms the document hasn't already been processed.
 */
async function recordAiExtractionMarker(
  prisma: PrismaClient,
  applicationId: string,
  meta: HousingVertexProcedureMeta,
  documentId: string,
  log: HousingVertexProcedureDeps["log"],
): Promise<void> {
  await prisma.aiExtractionMetrics
    .create({
      data: { applicationId },
    })
    .catch((error: unknown) => {
      log.error("Failed to record AI extraction marker", {
        ...meta,
        applicationId,
        documentId,
        ...formatVertexErrorForLog(error),
      });
    });
}

/**
 * Extraction path for the signed-URL upload flow: the stored document is the
 * raw, unordered upload (the browser PUT it directly to GCS; nothing derived
 * from its bytes ran before the scan cleared it), so mupdf ordering/
 * orientation happens here, after the CLEAN re-check below, not before it.
 * The resulting ordered/compressed PDF is re-uploaded to the same bucket the
 * raw upload went through (gcsConfig.bucketName — the only bucket the app SA
 * can write to), at the same objectKey. Because bucketName/objectKey are
 * stable across that round trip, the signed read URL is generated up front
 * (concurrently with the download below) and stays valid throughout — V4
 * signed URLs sign the object path, not a specific generation.
 * Unlike extractWithVertexAIService, there is no preparedPdfPending case: a
 * document only reaches this call once the frontend has already observed a
 * CLEAN scanStatus via polling, and the check below independently confirms
 * that from the DB rather than trusting the client.
 *
 * Compression (downsampling oversized embedded scan images) is deliberately
 * NOT part of the ordering step above: Vertex only needs correct page
 * order/rotation, so `prepared` is built with skipCompression and handed to
 * Vertex immediately. The compressed copy — needed only for GCS storage/
 * view size — is produced afterward via compressPreparedPdfSafely, running
 * concurrently with the Vertex call rather than blocking it.
 */
export async function extractWithVertexAIFromDocumentService(
  input: ExtractWithVertexAIFromDocumentInput,
  meta: HousingVertexProcedureMeta,
  deps: HousingVertexProcedureDeps,
): Promise<HousingVertexExtractResult> {
  const { log, prisma } = deps;
  let applicationIdForCleanup: string | undefined;
  const startedAtMs = Date.now();
  try {
    const document = await findCleanStaffDocumentForExtraction(
      prisma,
      input.documentId,
      meta.staffPseudonymizedId,
    );
    if (!document) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: DOCUMENT_NOT_FOUND_OR_NOT_CLEAN,
      });
    }

    const claimed = await claimApplicationForExtraction(
      prisma,
      document.applicationId,
    );
    if (!claimed) {
      throw new TRPCError({
        code: "CONFLICT",
        message: EXTRACTION_ALREADY_IN_PROGRESS,
      });
    }
    applicationIdForCleanup = document.applicationId;

    const config = resolveExtractionConfig({
      perPageExtraction: input.perPageExtraction,
      includePerPagePartials: input.includePerPagePartials,
      includeConfidence: input.includeConfidence,
    });

    // The signed read URL is generated here, up front, rather than after
    // extraction: the clean object already exists at this exact path (it's
    // what the download below fetches), and the compressed re-upload lands
    // back at the same bucketName/objectKey via the scan pipeline, so the
    // URL never has to wait on any of the later work.
    const [providerNames, pdfBuffer, signedUrl] = await Promise.all([
      loadProviderCatalog(prisma),
      downloadBufferFromGcs({
        bucketName: document.bucketName,
        objectKey: document.objectKey,
      }),
      generateSignedReadUrl({
        bucketName: document.bucketName,
        objectKey: document.objectKey,
        responseDisposition: contentDispositionAttachment(document.fileName),
      }).catch((error: unknown) => {
        throw signingFailureTrpcError(error);
      }),
    ]);
    const vertexSchemas = buildVertexExtractionSchemas(providerNames);

    log.info("Extracting housing application from stored document", {
      ...meta,
      applicationId: document.applicationId,
      documentId: input.documentId,
      providerNameCount: providerNames.length,
    });

    const ordering = createAbortTimeout(
      VERTEX_UPLOAD_ORDERING_TIMEOUT_MS,
      () =>
        `PDF ordering/orientation timed out after ${String(VERTEX_UPLOAD_ORDERING_TIMEOUT_MS)}ms`,
    );

    let prepared: Awaited<ReturnType<typeof preparePdfSafely>>;
    try {
      // skipCompression: Vertex only needs correct page order/rotation, not
      // the downsampled/recompressed bytes (that's a GCS-storage/view size
      // concern only) — so the compression pass runs afterward, off this
      // critical path, via compressPreparedPdfSafely below.
      prepared = await preparePdfSafely(pdfBuffer.toString("base64"), {
        outputMode: PDF_OUTPUT_MODE.BOTH,
        skipCompression: true,
        signal: ordering.controller.signal,
      });
    } catch (error) {
      // Piscina rejects an aborted run() with an AbortError wrapping our
      // reason in `cause` (see pdfSorterPool.ts) — surface that reason (the
      // PdfProcessingError built above) instead of the generic wrapper.
      if (
        error instanceof Error &&
        error.name === "AbortError" &&
        error.cause instanceof Error
      ) {
        throw error.cause;
      }
      throw error;
    } finally {
      ordering.clear();
    }

    if (!prepared.combinedBase64) {
      throw new PdfProcessingError(
        "Combined PDF was not produced after ordering",
      );
    }

    const baseOptions: AnalyzePdfOptions = {
      systemPrompt: buildSystemPrompt(config.includeConfidence),
      userPrompt: HOUSING_APPLICATION_USER_PROMPT,
      responseSchema: resolveResponseSchema(
        vertexSchemas.responseSchema,
        config.includeConfidence,
      ),
      perPageExtraction: config.usePerPage,
      includeConfidence: config.includeConfidence,
    };

    // The compressed PDF is uploaded to gcsConfig.bucketName at the same
    // objectKey as the raw upload (the only bucket the app SA can write to).
    // Nothing user-facing waits on that upload — the signed URL was
    // generated up front and serves the original upload until the compressed
    // version lands. Extraction only touches the in-memory `prepared` pages,
    // so both run concurrently rather than paying for compression + the GCS
    // round-trip on top of the (much slower) extraction call.
    // bucketName/objectKey don't change, so there's no DB row to update
    // here, and the DB's fileSizeBytes isn't read by anything that needs it
    // to be exact (the download flow re-reads live GCS metadata instead), so
    // leaving it as the original upload size isn't a correctness issue, just
    // a cosmetic one in the Document Tab list.
    //
    // Compression failure must never fail (or outlive) the request: it's
    // storage/view-size polish, not extraction correctness (worst case the
    // clean bucket keeps serving the raw upload), so a failure here is
    // caught and logged rather than rejecting the Promise.all (which would
    // both discard a successful Vertex result and — since nothing would
    // otherwise await this branch after Promise.all settles — risk an
    // unhandled rejection if it failed after extraction already resolved).
    //
    // No caller-side timeout here (unlike the ordering step above): the
    // pool bounds compression itself — queue wait via its slot gate and
    // execution via its per-job timeout, which starts only once the task
    // actually runs (see pdfSorterPool.ts). A submission-time timer here
    // would double-count queue wait against the execution budget, making
    // compression spuriously time out under concurrent load, and nothing
    // user-facing waits on this branch beyond the (much slower) extraction
    // call it runs alongside.
    const [result] = await Promise.all([
      runExtraction(
        prepared,
        config,
        vertexSchemas,
        providerNames,
        baseOptions,
        meta,
        deps,
      ),
      compressPreparedPdfSafely(prepared.combinedBase64)
        .then((compressedBase64) =>
          upsertBufferInGcs({
            bucketName: resolveUnscannedUploadBucketName(),
            objectKey: document.objectKey,
            buffer: decodeBase64ToBuffer(compressedBase64),
            contentType: GCS_PDF_CONTENT_TYPE,
          }),
        )
        .catch((error: unknown) => {
          log.error("Post-extraction PDF compression/re-upload failed", {
            ...meta,
            applicationId: document.applicationId,
            documentId: input.documentId,
            ...formatVertexErrorForLog(error),
          });
        }),
    ]);

    const formData = await resolveExtractedPreferredProviders(prisma, result);

    await finalizeDraftIntakeApplicationData(prisma, {
      applicationId: document.applicationId,
      formData: formData as unknown as Prisma.InputJsonValue,
    });

    await recordAiExtractionMarker(
      prisma,
      document.applicationId,
      meta,
      input.documentId,
      log,
    );

    log.info("Vertex extraction from document completed", {
      ...meta,
      applicationId: document.applicationId,
      documentId: input.documentId,
      elapsedMs: Date.now() - startedAtMs,
    });
    segment.track("backend_idaho_th_application_scan_completed", {
      applicationId: document.applicationId,
      success: true,
      elapsedMs: Date.now() - startedAtMs,
      staffPseudonymizedId: meta.staffPseudonymizedId,
    });

    return {
      applicationId: document.applicationId,
      application: formData,
      preparedPdf: { signedUrl },
      ...(prepared.missingPageNumbers.length > 0
        ? { missingPages: [...prepared.missingPageNumbers] }
        : {}),
    };
  } catch (error) {
    if (applicationIdForCleanup) {
      await tryCleanupIntakeShell(
        prisma,
        applicationIdForCleanup,
        meta.staffPseudonymizedId,
      );
    }

    log.error("extractWithVertexAIFromDocument failed", {
      ...meta,
      ...formatVertexErrorForLog(error),
    });
    segment.track("backend_idaho_th_application_scan_completed", {
      applicationId: applicationIdForCleanup,
      success: false,
      failureReason:
        error instanceof Error ? error.constructor.name : "UnknownError",
      elapsedMs: Date.now() - startedAtMs,
      staffPseudonymizedId: meta.staffPseudonymizedId,
    });
    if (error instanceof TRPCError) throw error;
    throw mapVertexProcedureError(error);
  }
}
