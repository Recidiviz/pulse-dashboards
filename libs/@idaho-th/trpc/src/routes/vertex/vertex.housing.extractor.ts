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
  type PrismaClient,
} from "~@idaho-th/prisma/client";
import { Prisma } from "~@idaho-th/prisma/client";
import {
  DEFAULT_TOTAL_PAGES,
  PDF_OUTPUT_MODE,
  type PdfOutputMode,
} from "~@idaho-th/trpc/pdfSorter/constants";
import { PdfProcessingError } from "~@idaho-th/trpc/pdfSorter/errors";
import { preparePdfSafely as preparePdfForExtractionSafely } from "~@idaho-th/trpc/pdfSorter/prepare/preparePdfSafely";
import type { ProcedureMeta } from "~@idaho-th/trpc/routes/common/procedureMeta";
import { segment } from "~@idaho-th/trpc/routes/common/segment";
import {
  createDraftIntakeApplication,
  createDraftIntakeApplicationShell,
  finalizeDraftIntakeApplicationData,
  getDocumentScanState,
  tryCleanupIntakeShell,
} from "~@idaho-th/trpc/routes/draftIntake/draftIntake.service";
import {
  getHousingProviderNameOptions,
  resolveProviderIdsByExactName,
} from "~@idaho-th/trpc/routes/providerMatching/providerMatching.service";
import {
  VERTEX_HOUSING_EXTRACTION_BUDGET_MS,
  VERTEX_HOUSING_PAGE_FIRST_ATTEMPT_MS,
  VERTEX_HOUSING_PAGE_MAX_EXTRACTION_ATTEMPTS,
} from "~@idaho-th/trpc/routes/vertex/constants";
import {
  formatVertexErrorForLog,
  isNonRetryableVertexExtractionError,
  VertexExtractionError,
  VertexExtractionTimeoutError,
  VertexQuotaExceededError,
  VertexResponseValidationError,
  VertexSafetyBlockedError,
} from "~@idaho-th/trpc/routes/vertex/vertex.errors";
import { mergeHousingPartials } from "~@idaho-th/trpc/routes/vertex/vertex.pdf.utils";
import { uploadPreparedCombinedPdfToGcs } from "~@idaho-th/trpc/routes/vertex/vertex.preparedPdf.upload";
import {
  buildHousingApplicationPageUserPrompts,
  buildSystemPrompt,
  HOUSING_APPLICATION_USER_PROMPT,
} from "~@idaho-th/trpc/routes/vertex/vertex.prompt";
import {
  buildVertexExtractionSchemas,
  type VertexExtractionSchemas,
} from "~@idaho-th/trpc/routes/vertex/vertex.schema";
import { resolveResponseSchema } from "~@idaho-th/trpc/routes/vertex/vertex.schema.confidence";
import { toFlatHousingApplicationData } from "~@idaho-th/trpc/routes/vertex/vertex.schema.mapper";
import type {
  AnalyzePdfOptions,
  FlatHousingApplicationExtractedData,
  HousingApplicationExtractedData,
  HousingApplicationPageExtractedData,
  HousingVertexExtractionOptions,
  HousingVertexExtractResult,
  HousingVertexProcedureDeps,
  HousingVertexProcedureMeta,
  PreparedPdf,
  PreparedPdfForClient,
  PreparedPdfGcsUploadResult,
  ResolvedExtractionConfig,
  VertexExtractedApplicationData,
} from "~@idaho-th/trpc/routes/vertex/vertex.types";
import {
  deleteGcsObject,
  generateSignedReadUrl,
  signingFailureTrpcError,
} from "~@idaho-th/trpc/storage/gcs";
import { contentDispositionAttachment } from "~@idaho-th/trpc/storage/gcs/contentDisposition";
import { generateUuid } from "~@idaho-th/trpc/utils/common";
import { serverFaultTrpcError } from "~@idaho-th/trpc/utils/serverFaultTrpcError";
import { withTimeout } from "~@idaho-th/trpc/utils/withTimeout";

// Failures are reported to Sentry unless the uploaded document caused them
// (the safety block, or an error flagged `userCaused`).
export function mapVertexProcedureError(error: unknown): TRPCError {
  if (error instanceof VertexExtractionTimeoutError) {
    return serverFaultTrpcError({
      code: "TIMEOUT",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof VertexResponseValidationError) {
    return serverFaultTrpcError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof VertexQuotaExceededError) {
    return serverFaultTrpcError({
      code: "TOO_MANY_REQUESTS",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof VertexSafetyBlockedError) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  if (
    error instanceof VertexExtractionError ||
    error instanceof PdfProcessingError
  ) {
    const options = {
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    } as const;
    return error.userCaused
      ? new TRPCError(options)
      : serverFaultTrpcError(options);
  }
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: error });
}

function resolvePdfOutputMode(
  extraction: HousingVertexExtractionOptions | undefined,
): PdfOutputMode {
  if (extraction?.pdfOutputMode) return extraction.pdfOutputMode;
  return extraction?.perPageExtraction !== false
    ? PDF_OUTPUT_MODE.PER_PAGE
    : PDF_OUTPUT_MODE.COMBINED;
}

function resolvePreparationOutputMode(
  usePerPage: boolean,
  requested: PdfOutputMode,
): PdfOutputMode {
  if (usePerPage) {
    return requested === PDF_OUTPUT_MODE.COMBINED
      ? PDF_OUTPUT_MODE.BOTH
      : requested;
  }
  return requested === PDF_OUTPUT_MODE.PER_PAGE
    ? PDF_OUTPUT_MODE.COMBINED
    : requested;
}

function resolvePreparationOutputModeForExtraction(
  usePerPage: boolean,
  pdfOutputMode: PdfOutputMode,
  uploadPreparedPdf: boolean,
): PdfOutputMode {
  if (uploadPreparedPdf) {
    return usePerPage ? PDF_OUTPUT_MODE.BOTH : PDF_OUTPUT_MODE.COMBINED;
  }
  return resolvePreparationOutputMode(usePerPage, pdfOutputMode);
}

function buildGcsProcedureMeta(
  meta: HousingVertexProcedureMeta,
  prisma: PrismaClient,
  staffPseudonymizedId: string,
): ProcedureMeta {
  return {
    traceId: meta.traceId,
    procedureName: `${meta.procedureName}.uploadPreparedPdf`,
    prisma,
    staffPseudonymizedId,
  };
}

function mapPdfProcessingError(error: unknown): never {
  if (error instanceof PdfProcessingError) {
    throw new VertexExtractionError(error.message, {
      cause: error,
      userCaused: error.userCaused,
    });
  }
  throw error;
}

type AnalyzePdfResult<T extends object> = {
  data: T;
};

async function extractSinglePdf(
  pdfBase64: string,
  baseOptions: AnalyzePdfOptions,
  deps: HousingVertexProcedureDeps,
): Promise<FlatHousingApplicationExtractedData> {
  const extraction =
    await deps.extractor.analyzeApplicationPdf<HousingApplicationExtractedData>(
      pdfBase64,
      baseOptions,
    );
  return toFlatHousingApplicationData(extraction.data);
}

async function extractPagePdf(
  pagePdfBase64: string,
  idx: number,
  meta: HousingVertexProcedureMeta,
  deps: HousingVertexProcedureDeps,
  includeConfidence: boolean,
  pageSchemas: VertexExtractionSchemas["pageSchemas"],
  pageUserPrompts: readonly string[],
): Promise<AnalyzePdfResult<HousingApplicationPageExtractedData>> {
  const pageNumber = idx + 1;
  const pageSchema = pageSchemas[pageNumber];
  const pageUserPrompt = pageUserPrompts[idx];
  if (!pageSchema || !pageUserPrompt) {
    throw new VertexExtractionError(
      `Missing schema/prompt for page ${pageNumber}`,
    );
  }
  const pageStartedAtMs = Date.now();
  try {
    return await deps.extractor.analyzeApplicationPdf<HousingApplicationPageExtractedData>(
      pagePdfBase64,
      {
        systemPrompt: buildSystemPrompt(includeConfidence),
        userPrompt: pageUserPrompt,
        responseSchema: resolveResponseSchema(pageSchema, includeConfidence),
      },
    );
  } finally {
    deps.log.info("Vertex extraction page completed", {
      ...meta,
      pageNumber,
      elapsedMs: Date.now() - pageStartedAtMs,
    });
  }
}

type PageExtractSlotResult =
  AnalyzePdfResult<HousingApplicationPageExtractedData>;

function requirePagePdfBase64(
  perPageBase64: readonly (string | undefined)[],
  idx: number,
): string {
  const pagePdfBase64 = perPageBase64[idx];
  if (pagePdfBase64 === undefined) {
    throw new VertexExtractionError(`Missing prepared PDF for page ${idx + 1}`);
  }
  return pagePdfBase64;
}

function getPresentPageIndices(
  perPageBase64: readonly (string | undefined)[],
): number[] {
  const present: number[] = [];
  for (let idx = 0; idx < perPageBase64.length; idx++) {
    if (perPageBase64[idx] !== undefined) present.push(idx);
  }
  return present;
}

function collectExtractedPageResults(
  pageResults: Array<PageExtractSlotResult | undefined>,
  presentIndices: readonly number[],
): PageExtractSlotResult[] {
  const completed: PageExtractSlotResult[] = [];
  for (const idx of presentIndices) {
    const result = pageResults[idx];
    if (result === undefined) {
      throw new VertexExtractionError(
        `Missing extraction result for page ${idx + 1}`,
      );
    }
    completed.push(result);
  }
  return completed;
}

async function runPageExtractionWave(
  pendingIndices: readonly number[],
  perPageBase64: readonly (string | undefined)[],
  attemptTimeoutMs: number,
  meta: HousingVertexProcedureMeta,
  deps: HousingVertexProcedureDeps,
  includeConfidence: boolean,
  pageSchemas: VertexExtractionSchemas["pageSchemas"],
  pageUserPrompts: readonly string[],
  wave: "initial" | "retry",
): Promise<PromiseSettledResult<PageExtractSlotResult>[]> {
  return Promise.allSettled(
    pendingIndices.map((idx) =>
      withTimeout(
        extractPagePdf(
          requirePagePdfBase64(perPageBase64, idx),
          idx,
          meta,
          deps,
          includeConfidence,
          pageSchemas,
          pageUserPrompts,
        ),
        attemptTimeoutMs,
        () =>
          new VertexExtractionTimeoutError(
            `Page ${idx + 1} timed out after ${attemptTimeoutMs}ms (${wave} wave)`,
          ),
      ),
    ),
  );
}

async function extractAllPages(
  perPageBase64: readonly (string | undefined)[],
  missingPageNumbers: readonly number[],
  meta: HousingVertexProcedureMeta,
  deps: HousingVertexProcedureDeps,
  includeConfidence: boolean,
  pageSchemas: VertexExtractionSchemas["pageSchemas"],
  pageUserPrompts: readonly string[],
): Promise<{
  flat: FlatHousingApplicationExtractedData;
  perPagePartials: HousingApplicationPageExtractedData[];
}> {
  if (perPageBase64.length !== DEFAULT_TOTAL_PAGES) {
    throw new VertexExtractionError(
      `Expected ${DEFAULT_TOTAL_PAGES} prepared page slots for extraction, got ${perPageBase64.length}`,
    );
  }

  const presentIndices = getPresentPageIndices(perPageBase64);
  if (presentIndices.length === 0) {
    const missingList =
      missingPageNumbers.length > 0
        ? missingPageNumbers.join(", ")
        : `1-${DEFAULT_TOTAL_PAGES}`;
    throw new VertexExtractionError(
      `PDF is missing all required form pages (${missingList} of ${DEFAULT_TOTAL_PAGES})`,
      { userCaused: true },
    );
  }

  if (missingPageNumbers.length > 0) {
    deps.log.info("PDF missing form pages; extracting present pages only", {
      ...meta,
      missingPageNumbers,
      presentPageNumbers: presentIndices.map((idx) => idx + 1),
    });
  }

  const startedVertexAtMs = Date.now();
  const deadlineMs = startedVertexAtMs + VERTEX_HOUSING_EXTRACTION_BUDGET_MS;
  const pageResults: Array<PageExtractSlotResult | undefined> = Array.from(
    { length: DEFAULT_TOTAL_PAGES },
    () => undefined,
  );
  const pending = new Set(presentIndices);
  const pageAttemptCounts = new Map<number, number>(
    presentIndices.map((idx) => [idx, 0]),
  );
  const retryExhaustedPageNumbers: number[] = [];

  const runNextExtractionWave = async (
    isInitialWave: boolean,
  ): Promise<void> => {
    if (pending.size === 0) return;

    const remainingMs = deadlineMs - Date.now();
    if (remainingMs <= 0) return;

    const attemptTimeoutMs = isInitialWave
      ? Math.min(VERTEX_HOUSING_PAGE_FIRST_ATTEMPT_MS, remainingMs)
      : remainingMs;

    const pendingIndices = [...pending].sort((a, b) => a - b);
    const settled = await runPageExtractionWave(
      pendingIndices,
      perPageBase64,
      attemptTimeoutMs,
      meta,
      deps,
      includeConfidence,
      pageSchemas,
      pageUserPrompts,
      isInitialWave ? "initial" : "retry",
    );

    for (const [waveIndex, outcome] of settled.entries()) {
      const idx = pendingIndices[waveIndex];
      if (idx === undefined) continue;

      if (outcome.status === "fulfilled") {
        pageResults[idx] = outcome.value;
        pending.delete(idx);
        continue;
      }

      const attemptNumber = (pageAttemptCounts.get(idx) ?? 0) + 1;
      pageAttemptCounts.set(idx, attemptNumber);

      deps.log.info("Vertex extraction page failed or timed out", {
        ...meta,
        pageNumber: idx + 1,
        wave: isInitialWave ? "initial" : "retry",
        attemptNumber,
        maxAttempts: VERTEX_HOUSING_PAGE_MAX_EXTRACTION_ATTEMPTS,
        ...formatVertexErrorForLog(outcome.reason),
      });

      if (isNonRetryableVertexExtractionError(outcome.reason)) {
        pending.delete(idx);
        throw outcome.reason;
      }

      if (attemptNumber >= VERTEX_HOUSING_PAGE_MAX_EXTRACTION_ATTEMPTS) {
        pending.delete(idx);
        retryExhaustedPageNumbers.push(idx + 1);
      }
    }

    await runNextExtractionWave(false);
  };

  await runNextExtractionWave(true);

  if (retryExhaustedPageNumbers.length > 0) {
    const failedPages = [...retryExhaustedPageNumbers]
      .sort((a, b) => a - b)
      .join(", ");
    throw new VertexExtractionError(
      `Vertex extraction failed for page(s) ${failedPages} after ${VERTEX_HOUSING_PAGE_MAX_EXTRACTION_ATTEMPTS} attempts`,
    );
  }

  if (pending.size > 0) {
    const incompletePages = [...pending].map((idx) => idx + 1).join(", ");
    throw new VertexExtractionTimeoutError(
      `Vertex extraction exceeded ${VERTEX_HOUSING_EXTRACTION_BUDGET_MS}ms; incomplete pages: ${incompletePages}`,
    );
  }

  deps.log.info("Vertex extraction all pages completed", {
    ...meta,
    elapsedMs: Date.now() - startedVertexAtMs,
  });

  const completed = collectExtractedPageResults(pageResults, presentIndices);
  const merged = mergeHousingPartials(completed.map((r) => r.data));
  return {
    flat: toFlatHousingApplicationData(merged),
    perPagePartials: completed.map((r) => r.data),
  };
}

export function resolveExtractionConfig(
  extraction?: HousingVertexExtractionOptions,
): ResolvedExtractionConfig {
  const usePerPage = extraction?.perPageExtraction !== false;
  const uploadPreparedPdf = extraction?.uploadPreparedPdf !== false;
  const pdfOutputMode = resolvePdfOutputMode(extraction);
  return {
    usePerPage,
    includePerPagePartials: extraction?.includePerPagePartials === true,
    includeConfidence: extraction?.includeConfidence === true,
    uploadPreparedPdf,
    pdfOutputMode,
    preparationOutputMode: resolvePreparationOutputModeForExtraction(
      usePerPage,
      pdfOutputMode,
      uploadPreparedPdf,
    ),
  };
}

export async function loadProviderCatalog(
  prisma: PrismaClient,
): Promise<string[]> {
  const providerNames = await getHousingProviderNameOptions(prisma);
  if (providerNames.length === 0) {
    throw new VertexExtractionError(
      "Housing provider catalog is empty; seed HousingProvider before extracting",
    );
  }
  return providerNames;
}

/**
 * Post-processing step run immediately after extraction, before anything is
 * persisted: the model returns provider names (constrained to the canonical
 * list built moments earlier), and both formData and the rawAiResponse
 * snapshot must store IDs instead. A name that no longer resolves — e.g. a
 * rename race — is dropped rather than persisted as a name, matching the
 * "never guess" rule for preferred providers.
 */
export async function resolveExtractedPreferredProviders(
  prisma: PrismaClient,
  data: VertexExtractedApplicationData,
): Promise<VertexExtractedApplicationData> {
  const preferredProvidersIds = await resolveProviderIdsByExactName(
    prisma,
    data.preferredProviders,
  );
  return { ...data, preferredProviders: preferredProvidersIds };
}

async function preparePdfSafely(
  pdfBase64: string,
  config: ResolvedExtractionConfig,
): Promise<PreparedPdf> {
  try {
    return await preparePdfForExtractionSafely(pdfBase64, {
      outputMode: config.preparationOutputMode,
    });
  } catch (error) {
    mapPdfProcessingError(error);
  }
}

async function extractCombined(
  prepared: PreparedPdf,
  baseOptions: AnalyzePdfOptions,
  deps: HousingVertexProcedureDeps,
): Promise<VertexExtractedApplicationData> {
  const combinedBase64 = prepared.combinedBase64;
  if (!combinedBase64) {
    throw new VertexExtractionError(
      `Combined PDF was not prepared; set pdfOutputMode to '${PDF_OUTPUT_MODE.COMBINED}' or '${PDF_OUTPUT_MODE.BOTH}'`,
    );
  }
  return extractSinglePdf(combinedBase64, baseOptions, deps);
}

async function extractPerPage(
  prepared: PreparedPdf,
  config: ResolvedExtractionConfig,
  vertexSchemas: VertexExtractionSchemas,
  providerNames: readonly string[],
  meta: HousingVertexProcedureMeta,
  deps: HousingVertexProcedureDeps,
): Promise<VertexExtractedApplicationData> {
  const pageUserPrompts = buildHousingApplicationPageUserPrompts(providerNames);
  const { flat, perPagePartials } = await extractAllPages(
    prepared.perPageBase64,
    prepared.missingPageNumbers,
    meta,
    deps,
    config.includeConfidence,
    vertexSchemas.pageSchemas,
    pageUserPrompts,
  );
  return config.includePerPagePartials ? { ...flat, perPagePartials } : flat;
}

export async function runExtraction(
  prepared: PreparedPdf,
  config: ResolvedExtractionConfig,
  vertexSchemas: VertexExtractionSchemas,
  providerNames: readonly string[],
  baseOptions: AnalyzePdfOptions,
  meta: HousingVertexProcedureMeta,
  deps: HousingVertexProcedureDeps,
): Promise<VertexExtractedApplicationData> {
  if (config.usePerPage) {
    return extractPerPage(
      prepared,
      config,
      vertexSchemas,
      providerNames,
      meta,
      deps,
    );
  }
  return extractCombined(prepared, baseOptions, deps);
}

function objectKeyFileName(objectKey: string): string {
  const fileName = objectKey.split("/").pop();
  return fileName && fileName.length > 0 ? fileName : "application.pdf";
}

async function cleanupOrphanedPreparedPdf(
  uploadPromise: Promise<PreparedPdfGcsUploadResult | undefined>,
  meta: HousingVertexProcedureMeta,
  deps: HousingVertexProcedureDeps,
): Promise<void> {
  let upload: PreparedPdfGcsUploadResult | undefined;
  try {
    upload = await uploadPromise;
  } catch {
    // Upload failed before returning a result. Post-write failures delete their
    // own GCS object inside the upload helpers, so there is nothing left to
    // clean up here. The original extraction error is the one we surface.
    return;
  }
  if (!upload) return;

  try {
    await deleteGcsObject({
      bucketName: upload.bucketName,
      objectKey: upload.objectKey,
    });
  } catch (cleanupError) {
    deps.log.error(
      "Failed to clean up orphaned prepared PDF after extraction error",
      {
        ...meta,
        objectKey: upload.objectKey,
        ...formatVertexErrorForLog(cleanupError),
      },
    );
  }
}

async function uploadPreparedPdfIfEnabled(
  prepared: PreparedPdf,
  config: ResolvedExtractionConfig,
  meta: HousingVertexProcedureMeta,
  deps: HousingVertexProcedureDeps,
): Promise<PreparedPdfGcsUploadResult | undefined> {
  if (!config.uploadPreparedPdf) {
    return undefined;
  }

  const startedAtMs = Date.now();
  try {
    const upload = await uploadPreparedCombinedPdfToGcs(prepared, {
      procedureMeta: buildGcsProcedureMeta(
        meta,
        deps.prisma,
        meta.staffPseudonymizedId,
      ),
    });
    deps.log.info("Prepared PDF uploaded to GCS", {
      ...meta,
      objectKey: upload.objectKey,
      elapsedMs: Date.now() - startedAtMs,
    });
    return upload;
  } catch (error) {
    deps.log.error("Prepared PDF GCS upload failed", {
      ...meta,
      elapsedMs: Date.now() - startedAtMs,
      ...formatVertexErrorForLog(error),
    });
    throw error;
  }
}

/**
 * Once the prepared PDF is uploaded to the quarantine bucket, immediately
 * create the shell application + PENDING document row (see
 * createDraftIntakeApplicationShell) so the real ClamAV scan webhook has
 * something to flip. Chained onto the upload promise so both run in parallel
 * with Vertex extraction, ahead of the ~20s extraction latency.
 */
function createDraftIntakeShellIfUploaded(
  preparedPdfUploadPromise: Promise<PreparedPdfGcsUploadResult | undefined>,
  applicationId: string,
  meta: HousingVertexProcedureMeta,
  deps: HousingVertexProcedureDeps,
): Promise<PreparedPdfGcsUploadResult | undefined> {
  return preparedPdfUploadPromise.then(async (preparedPdf) => {
    if (!preparedPdf) return undefined;

    await createDraftIntakeApplicationShell(deps.prisma, {
      applicationId,
      staffPseudonymizedId: meta.staffPseudonymizedId,
      document: {
        bucketName: preparedPdf.bucketName,
        objectKey: preparedPdf.objectKey,
        contentType: preparedPdf.contentType,
        fileSizeBytes: preparedPdf.sizeInBytes,
        fileName: objectKeyFileName(preparedPdf.objectKey),
      },
    });

    return preparedPdf;
  });
}

async function cleanupOrphanedDraftIntakeShell(
  draftIntakeShellPromise: Promise<PreparedPdfGcsUploadResult | undefined>,
  applicationId: string,
  meta: HousingVertexProcedureMeta,
  deps: HousingVertexProcedureDeps,
): Promise<void> {
  let created: PreparedPdfGcsUploadResult | undefined;
  try {
    created = await draftIntakeShellPromise;
  } catch {
    // Shell creation itself failed; it already cleaned up its own GCS object.
    return;
  }
  if (!created) return;

  await tryCleanupIntakeShell(
    deps.prisma,
    applicationId,
    meta.staffPseudonymizedId,
  );
}

/**
 * Resolves the client-facing prepared-PDF field: a fresh signed URL against
 * the document's current bucket once ClamAV has cleared it (CLEAN moves the
 * object into gcsConfig.cleanBucketName), or a pending flag while the scan is
 * still in flight. Never reuses the upload-time signed URL, which pointed at
 * the quarantine bucket.
 */
export async function resolvePreparedPdfForClient(
  preparedPdf: PreparedPdfGcsUploadResult,
  deps: HousingVertexProcedureDeps,
): Promise<{
  preparedPdf?: PreparedPdfForClient;
  preparedPdfPending: boolean;
}> {
  const scanState = await getDocumentScanState(
    deps.prisma,
    preparedPdf.objectKey,
  );

  if (scanState?.scanStatus !== HousingApplicationDocumentScanStatus.CLEAN) {
    return { preparedPdfPending: true };
  }

  let signedUrl: string;
  try {
    signedUrl = await generateSignedReadUrl({
      bucketName: scanState.bucketName,
      objectKey: preparedPdf.objectKey,
      responseDisposition: contentDispositionAttachment(preparedPdf.fileName),
    });
  } catch (error) {
    throw signingFailureTrpcError(error);
  }

  return {
    preparedPdf: {
      signedUrl,
      sizeInBytes: preparedPdf.sizeInBytes,
      updatedAt: preparedPdf.updatedAt,
    },
    preparedPdfPending: false,
  };
}

export async function extractWithVertexAIService(
  pdfBase64: string,
  meta: HousingVertexProcedureMeta,
  deps: HousingVertexProcedureDeps,
  extraction?: HousingVertexExtractionOptions,
): Promise<HousingVertexExtractResult> {
  const { log, prisma } = deps;
  let applicationId: string | undefined;
  const startedAtMs = Date.now();
  try {
    const config = resolveExtractionConfig(extraction);

    applicationId = generateUuid();

    const [providerNames, prepared] = await Promise.all([
      loadProviderCatalog(prisma),
      preparePdfSafely(pdfBase64, config),
    ]);
    const vertexSchemas = buildVertexExtractionSchemas(providerNames);

    log.info("Extracting housing application from PDF", {
      ...meta,
      providerNameCount: providerNames.length,
    });

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

    log.info("PDF prepared for Vertex extraction", {
      ...meta,
      applicationId,
      pdfOutputMode: config.pdfOutputMode,
      preparationOutputMode: config.preparationOutputMode,
      uploadPreparedPdf: config.uploadPreparedPdf,
      pageCount: prepared.perPageBase64.filter((page) => page !== undefined)
        .length,
      missingPageNumbers: prepared.missingPageNumbers,
      hasCombined: Boolean(prepared.combinedBase64),
    });

    // Kick the prepared-PDF upload off in parallel with extraction. The prepared
    // combined PDF is fully built above and does not depend on the extraction
    // result, so awaiting the upload only after extraction needlessly stacks the
    // ~18s upload latency on top of the ~21s extraction latency. The shell
    // application + PENDING document row is created as soon as the upload
    // lands, so the real ClamAV scan webhook (which typically completes well
    // before the ~20s extraction call does) has something to flip to CLEAN.
    const preparedPdfUploadPromise = uploadPreparedPdfIfEnabled(
      prepared,
      config,
      meta,
      deps,
    );
    const draftIntakeShellPromise = createDraftIntakeShellIfUploaded(
      preparedPdfUploadPromise,
      applicationId,
      meta,
      deps,
    );

    let result: VertexExtractedApplicationData;
    try {
      result = await runExtraction(
        prepared,
        config,
        vertexSchemas,
        providerNames,
        baseOptions,
        meta,
        deps,
      );
    } catch (extractionError) {
      // Extraction failed: clean up the (possibly in-flight) upload and shell
      // application so a failed run never leaves an orphaned GCS object or
      // draft application behind. This preserves the original
      // upload-only-on-success guarantee while still running them concurrently.
      await cleanupOrphanedPreparedPdf(preparedPdfUploadPromise, meta, deps);
      await cleanupOrphanedDraftIntakeShell(
        draftIntakeShellPromise,
        applicationId,
        meta,
        deps,
      );
      throw extractionError;
    }

    result = await resolveExtractedPreferredProviders(prisma, result);

    const preparedPdf = await draftIntakeShellPromise;

    let preparedPdfForClient: PreparedPdfForClient | undefined;
    let preparedPdfPending = false;

    if (preparedPdf) {
      // Shell + document already exist. Filling in the real extracted data
      // and resolving the scan-gated signed URL touch unrelated rows, so run
      // them in parallel rather than stacking their latency.
      const [, scanResolution] = await Promise.all([
        finalizeDraftIntakeApplicationData(prisma, {
          applicationId,
          formData: result as unknown as Prisma.InputJsonValue,
        }),
        resolvePreparedPdfForClient(preparedPdf, deps),
      ]);
      ({ preparedPdf: preparedPdfForClient, preparedPdfPending } =
        scanResolution);
    } else {
      // No document to scan-gate; create the draft application directly.
      await createDraftIntakeApplication(prisma, {
        applicationId,
        staffPseudonymizedId: meta.staffPseudonymizedId,
        formData: result as unknown as Prisma.InputJsonValue,
      });
    }

    log.info("Housing extraction completed", {
      ...meta,
      applicationId,
      elapsedMs: Date.now() - startedAtMs,
      uploadedPreparedPdf: preparedPdf !== undefined,
      preparedPdfPending,
    });
    segment.track("backend_idaho_th_application_scan_completed", {
      applicationId,
      success: true,
      elapsedMs: Date.now() - startedAtMs,
      staffPseudonymizedId: meta.staffPseudonymizedId,
    });
    return {
      applicationId,
      application: result,
      ...(prepared.missingPageNumbers.length > 0
        ? { missingPages: [...prepared.missingPageNumbers] }
        : {}),
      ...(preparedPdfForClient !== undefined
        ? { preparedPdf: preparedPdfForClient }
        : {}),
      ...(preparedPdfPending ? { preparedPdfPending: true } : {}),
    };
  } catch (error) {
    log.error("extractWithVertexAI failed", {
      ...meta,
      ...formatVertexErrorForLog(error),
    });
    segment.track("backend_idaho_th_application_scan_completed", {
      applicationId,
      success: false,
      failureReason:
        error instanceof Error ? error.constructor.name : "UnknownError",
      elapsedMs: Date.now() - startedAtMs,
      staffPseudonymizedId: meta.staffPseudonymizedId,
    });
    throw mapVertexProcedureError(error);
  }
}
