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

import { captureException, captureMessage } from "@sentry/node";
import { TRPCError } from "@trpc/server";

import {
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  type Prisma,
  type PrismaClient,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { getDisplayFileName } from "~@idaho-th/shared";
import { getLogger } from "~@idaho-th/trpc/routes/common/logger";
import {
  DAILY_UPLOAD_QUOTA_PER_UPLOADER,
  DOCUMENT_DOWNLOAD_URL_TTL_MS,
  DOCUMENT_UPLOAD_ERROR,
  type DocumentUploadErrorCode,
  MAX_DOCUMENT_BYTES,
  startOfUtcCalendarDay,
} from "~@idaho-th/trpc/routes/documents/documents.constants";
import {
  extensionForMimeType,
  isAllowedMimeType,
} from "~@idaho-th/trpc/routes/documents/documents.fileTypes";
import {
  actingPersonPseudonymizedId,
  APPLICATION_NOT_FOUND,
  assertUploaderCanAccessApplication,
  countUploaderDocumentsSince,
  createPendingDocument,
  deleteDocumentRow,
  findDeletableDocument,
  findOwnedPendingDocument,
  findProviderApplicationDocuments,
  findProviderDocumentForScanStatus,
  findProviderDownloadableDocument,
  findProviderIdentityForDocumentEvent,
  findStaffApplicationDocuments,
  findStaffDocumentForScanStatus,
  findStaffDownloadableDocument,
  findStaffDraftPreviewDocument,
  isDocumentVisibleForCutoff,
  lockUploaderDailyUploadQuota,
  markDocumentConfirmed,
  staffApplicationHasDigitizedDocument,
  staffUploader,
  updateDocumentScanStatus,
} from "~@idaho-th/trpc/routes/documents/documents.helpers";
import {
  deletableDocumentOwnershipWhere,
  documentMatchesOwnership,
} from "~@idaho-th/trpc/routes/documents/documents.selects";
import type {
  DeleteDocumentResult,
  DocumentDownloadResult,
  DocumentListItem,
  DocumentListRow,
  DocumentScanResultBody,
  DocumentScanStatusResult,
  ProviderUploaderDescriptor,
  RequestDocumentUploadInput,
  RequestDocumentUploadResult,
  UpdateDocumentScanStatusOutcome,
  UploaderDescriptor,
} from "~@idaho-th/trpc/routes/documents/documents.types";
import { resolveOrRejectUpload } from "~@idaho-th/trpc/routes/documents/documents.verifyUpload";
import {
  findProviderClosedEventAt,
  resolveClosedProviderCutoff,
} from "~@idaho-th/trpc/routes/housing-common/providerVisibility";
import {
  recordTimelineEvent,
  updateApplicationLastActivityAt,
  withTimelineAnalytics,
} from "~@idaho-th/trpc/routes/timeline/timeline.events";
import {
  buildApplicationDocumentObjectKey,
  sanitizeDisplayFileName,
} from "~@idaho-th/trpc/storage/applicationDocument/applicationDocumentObjectKey.builder";
import {
  assertScanPipelineConfigured,
  deleteGcsObject,
  gcsConfig,
  type GcsObjectRef,
  generateResumableUploadUrl,
  isGcsNotFoundError,
  resolveGcsReadAccess,
  resolveUnscannedUploadBucketName,
} from "~@idaho-th/trpc/storage/gcs";
import { contentDispositionAttachment } from "~@idaho-th/trpc/storage/gcs/contentDisposition";
import { formatErrorForLog } from "~@idaho-th/trpc/utils/errorText";

const log = getLogger("documents.service");

const DOCUMENT_NOT_FOUND = "Document not found";
const DIGITIZED_DOCUMENT_ALREADY_EXISTS =
  "This application already has a digitized document";

const UPLOAD_ERROR_TRPC_CODE: Record<
  DocumentUploadErrorCode,
  TRPCError["code"]
> = {
  [DOCUMENT_UPLOAD_ERROR.UNSUPPORTED_FILE_TYPE]: "BAD_REQUEST",
  [DOCUMENT_UPLOAD_ERROR.FILE_TOO_LARGE]: "BAD_REQUEST",
  [DOCUMENT_UPLOAD_ERROR.UPLOAD_FAILED]: "BAD_REQUEST",
  [DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH]: "BAD_REQUEST",
  [DOCUMENT_UPLOAD_ERROR.UPLOAD_NOT_FOUND]: "NOT_FOUND",
  [DOCUMENT_UPLOAD_ERROR.DAILY_UPLOAD_QUOTA_EXCEEDED]: "TOO_MANY_REQUESTS",
};

function uploadError(code: DocumentUploadErrorCode): TRPCError {
  return new TRPCError({ code: UPLOAD_ERROR_TRPC_CODE[code], message: code });
}

async function assertDailyUploadQuotaAvailable(
  client: Prisma.TransactionClient | PrismaClient,
  uploader: UploaderDescriptor,
): Promise<void> {
  const uploadCount = await countUploaderDocumentsSince(
    client,
    uploader,
    startOfUtcCalendarDay(),
  );
  if (uploadCount >= DAILY_UPLOAD_QUOTA_PER_UPLOADER) {
    throw uploadError(DOCUMENT_UPLOAD_ERROR.DAILY_UPLOAD_QUOTA_EXCEEDED);
  }
}

function mapDocumentListItem(
  row: DocumentListRow,
  caller: UploaderDescriptor,
): DocumentListItem {
  return {
    id: row.id,
    fileName: row.fileName,
    documentType: row.documentType,
    uploadedByType: row.uploadedByType,
    fileSizeBytes: row.fileSizeBytes,
    contentType: row.contentType,
    createdAt: row.createdAt,
    // Reads the very clause findDeletableDocument filters on, so the flag
    // cannot promise a delete the enforcement point would refuse.
    canDelete: documentMatchesOwnership(
      row,
      deletableDocumentOwnershipWhere(caller),
    ),
    scanStatus: row.scanStatus,
  };
}

export async function listStaffDocuments(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  applicationId: string,
): Promise<DocumentListItem[]> {
  const application = await findStaffApplicationDocuments(
    prisma,
    applicationId,
    staffPseudonymizedId,
  );

  if (!application) {
    throw new TRPCError({ code: "NOT_FOUND", message: APPLICATION_NOT_FOUND });
  }

  return application.documents.map((row) =>
    mapDocumentListItem(row, staffUploader(staffPseudonymizedId)),
  );
}

export async function listProviderDocuments(
  prisma: PrismaClient,
  provider: ProviderUploaderDescriptor,
  applicationId: string,
): Promise<DocumentListItem[]> {
  const application = await findProviderApplicationDocuments(
    prisma,
    applicationId,
    provider.providerId,
  );

  const providerApplication = application?.providerApplications[0];
  if (!application || !providerApplication) {
    throw new TRPCError({ code: "NOT_FOUND", message: APPLICATION_NOT_FOUND });
  }

  const cutoff = resolveClosedProviderCutoff(
    providerApplication.stage,
    findProviderClosedEventAt(
      application.timelineEvents,
      providerApplication.providerId,
    ),
  );

  return application.documents
    .filter((row) =>
      isDocumentVisibleForCutoff(row, provider.providerId, cutoff),
    )
    .map((row) => mapDocumentListItem(row, provider));
}

export async function requestDocumentUpload(
  prisma: PrismaClient,
  uploader: UploaderDescriptor,
  input: RequestDocumentUploadInput,
): Promise<RequestDocumentUploadResult> {
  assertScanPipelineConfigured();
  if (!isAllowedMimeType(input.mimeType)) {
    throw uploadError(DOCUMENT_UPLOAD_ERROR.UNSUPPORTED_FILE_TYPE);
  }
  if (input.sizeBytes > MAX_DOCUMENT_BYTES) {
    throw uploadError(DOCUMENT_UPLOAD_ERROR.FILE_TOO_LARGE);
  }

  await assertUploaderCanAccessApplication(
    prisma,
    input.applicationId,
    uploader,
  );

  await assertDailyUploadQuotaAvailable(prisma, uploader);

  const documentId = crypto.randomUUID();
  const bucketName = gcsConfig.bucketName;
  const objectKey = buildApplicationDocumentObjectKey({
    applicationId: input.applicationId,
    documentId,
    extension: extensionForMimeType(input.mimeType),
  });

  const uploadUrl = await generateResumableUploadUrl({
    bucketName,
    objectKey,
    contentType: input.mimeType,
  });

  await prisma.$transaction(async (tx) => {
    await lockUploaderDailyUploadQuota(tx, uploader);
    await assertDailyUploadQuotaAvailable(tx, uploader);
    await createPendingDocument(tx, {
      documentId,
      applicationId: input.applicationId,
      uploader,
      documentType: HousingApplicationDocumentType.ATTACHMENT,
      fileName: sanitizeDisplayFileName(input.fileName),
      bucketName,
      objectKey,
      contentType: input.mimeType,
      fileSizeBytes: input.sizeBytes,
    });
  });

  return { documentId, uploadUrl };
}

// Server-chosen documentType, never client input (see #15219/#15293): this is
// the one legitimate path that creates a DIGITIZED document, used right after
// intake to store the freshly generated digitized PDF. Limited to exactly one
// per application, and otherwise goes through the same daily-quota check,
// resumable-upload, and malware-scan flow as a regular attachment — finalized
// via the same confirmUploadForStaff.
export async function requestDigitizedDocumentUploadForStaff(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: RequestDocumentUploadInput,
): Promise<RequestDocumentUploadResult> {
  assertScanPipelineConfigured();
  if (input.mimeType !== "application/pdf") {
    throw uploadError(DOCUMENT_UPLOAD_ERROR.UNSUPPORTED_FILE_TYPE);
  }
  if (input.sizeBytes > MAX_DOCUMENT_BYTES) {
    throw uploadError(DOCUMENT_UPLOAD_ERROR.FILE_TOO_LARGE);
  }

  const uploader = staffUploader(staffPseudonymizedId);

  await assertUploaderCanAccessApplication(
    prisma,
    input.applicationId,
    uploader,
  );

  if (
    await staffApplicationHasDigitizedDocument(
      prisma,
      input.applicationId,
      staffPseudonymizedId,
    )
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: DIGITIZED_DOCUMENT_ALREADY_EXISTS,
    });
  }

  await assertDailyUploadQuotaAvailable(prisma, uploader);

  const documentId = crypto.randomUUID();
  const bucketName = resolveUnscannedUploadBucketName();
  const objectKey = buildApplicationDocumentObjectKey({
    applicationId: input.applicationId,
    documentId,
    extension: extensionForMimeType(input.mimeType),
  });

  const uploadUrl = await generateResumableUploadUrl({
    bucketName,
    objectKey,
    contentType: input.mimeType,
  });

  await prisma.$transaction(async (tx) => {
    await lockUploaderDailyUploadQuota(tx, uploader);
    if (
      await staffApplicationHasDigitizedDocument(
        tx,
        input.applicationId,
        staffPseudonymizedId,
      )
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: DIGITIZED_DOCUMENT_ALREADY_EXISTS,
      });
    }
    await assertDailyUploadQuotaAvailable(tx, uploader);
    await createPendingDocument(tx, {
      documentId,
      applicationId: input.applicationId,
      uploader,
      documentType: HousingApplicationDocumentType.DIGITIZED,
      fileName: sanitizeDisplayFileName(input.fileName),
      bucketName,
      objectKey,
      contentType: input.mimeType,
      fileSizeBytes: input.sizeBytes,
    });
  });

  return { documentId, uploadUrl };
}

async function recordDocumentUploadedTimelineEvent(
  tx: Prisma.TransactionClient,
  applicationId: string,
  uploader: UploaderDescriptor,
  fileName: string,
): Promise<void> {
  const providerScope =
    uploader.audience === HousingApplicationDocumentUploader.PROVIDER
      ? await findProviderIdentityForDocumentEvent(
          tx,
          applicationId,
          uploader.providerId,
        )
      : null;
  const isStaffUpload =
    uploader.audience === HousingApplicationDocumentUploader.STAFF;

  if (!isStaffUpload && !providerScope) {
    // The document is already confirmed at this point; only the timeline
    // event is lost, so this can't fail the upload — but it's a real audit
    // gap otherwise invisible outside this function.
    captureMessage("Provider upload could not resolve a timeline scope", {
      level: "warning",
      // IDs only — never add fileName, objectKey, or other PII here.
      extra: {
        applicationId,
        uploaderPseudonymizedId: actingPersonPseudonymizedId(uploader),
      },
    });
    return;
  }

  await recordTimelineEvent(tx, {
    applicationId,
    actor: {
      role: isStaffUpload
        ? TimelineActorRole.STAFF
        : TimelineActorRole.PROVIDER,
      pseudonymizedId: actingPersonPseudonymizedId(uploader),
    },
    type: TimelineEventType.DOCUMENT_UPLOADED,
    fileName,
    ...(providerScope
      ? {
          scopedProviderId: providerScope.providerId,
          providerName: providerScope.providerName,
        }
      : { scopedProviderId: null }),
  });
  await updateApplicationLastActivityAt(tx, applicationId);
}

async function promotePendingDocumentUpload(
  tx: Prisma.TransactionClient,
  documentId: string,
  applicationId: string,
  uploader: UploaderDescriptor,
  bucketName: string,
  displayFileName: string,
): Promise<DocumentListRow> {
  const confirmed = await markDocumentConfirmed(tx, documentId, {
    bucketName,
    scanStatus: gcsConfig.skipDocumentScan
      ? HousingApplicationDocumentScanStatus.CLEAN
      : undefined,
  });
  await recordDocumentUploadedTimelineEvent(
    tx,
    applicationId,
    uploader,
    displayFileName,
  );
  return confirmed;
}

export async function confirmDocumentUpload(
  prisma: PrismaClient,
  uploader: UploaderDescriptor,
  documentId: string,
): Promise<DocumentListItem> {
  const pending = await findOwnedPendingDocument(
    prisma,
    documentId,
    actingPersonPseudonymizedId(uploader),
  );
  if (!pending) {
    throw uploadError(DOCUMENT_UPLOAD_ERROR.UPLOAD_NOT_FOUND);
  }

  await assertUploaderCanAccessApplication(
    prisma,
    pending.applicationId,
    uploader,
  );

  const objectRef = await resolveOrRejectUpload(prisma, documentId, pending);
  const displayFileName = sanitizeDisplayFileName(
    getDisplayFileName(
      pending.documentType,
      pending.fileName,
      pending.application.clientName,
    ),
  );

  const row = await withTimelineAnalytics(prisma, async (tx) => {
    await lockUploaderDailyUploadQuota(tx, uploader);
    await assertDailyUploadQuotaAvailable(tx, uploader);
    return promotePendingDocumentUpload(
      tx,
      documentId,
      pending.applicationId,
      uploader,
      objectRef.bucketName,
      displayFileName,
    );
  });

  return mapDocumentListItem(row, uploader);
}

async function buildDownloadResult(
  ref: GcsObjectRef,
  fileName: string,
): Promise<DocumentDownloadResult> {
  const access = await resolveGcsReadAccess(ref, {
    expiresMs: DOCUMENT_DOWNLOAD_URL_TTL_MS,
    responseDisposition: contentDispositionAttachment(fileName),
  });
  return {
    fileName,
    downloadUrl: access.signedUrl,
    contentBase64: access.contentBase64,
  };
}

async function recordDocumentDownloadedTimelineEvent(
  tx: Prisma.TransactionClient,
  applicationId: string,
  rawFileName: string,
  documentType: HousingApplicationDocumentType,
  clientName: string,
  scopedProviderId: string | null,
  downloader: UploaderDescriptor,
): Promise<void> {
  const fileName = sanitizeDisplayFileName(
    getDisplayFileName(documentType, rawFileName, clientName),
  );
  const isStaffDownload =
    downloader.audience === HousingApplicationDocumentUploader.STAFF;

  // A provider's download is scoped to the organization that downloaded it; a
  // case manager's inherits whatever organization the document belongs to.
  const scopeProviderId = isStaffDownload
    ? scopedProviderId
    : downloader.providerId;

  const providerScope = scopeProviderId
    ? await findProviderIdentityForDocumentEvent(
        tx,
        applicationId,
        scopeProviderId,
      )
    : null;

  if (!isStaffDownload && !providerScope) {
    // The download was already granted at this point; only the timeline
    // event is lost, so this can't fail the download — but it's a real audit
    // gap otherwise invisible outside this function.
    captureMessage("Provider download could not resolve a timeline scope", {
      level: "warning",
      // IDs only — never add fileName, objectKey, or other PII here.
      extra: {
        applicationId,
        downloaderPseudonymizedId: actingPersonPseudonymizedId(downloader),
      },
    });
    return;
  }

  await recordTimelineEvent(tx, {
    applicationId,
    actor: {
      role: isStaffDownload
        ? TimelineActorRole.STAFF
        : TimelineActorRole.PROVIDER,
      pseudonymizedId: actingPersonPseudonymizedId(downloader),
    },
    type: TimelineEventType.DOCUMENT_DOWNLOADED,
    fileName,
    downloadedByRole: isStaffDownload ? "CM" : "Provider",
    scopedProviderId: providerScope?.providerId ?? null,
  });
}

export async function getStaffDocumentDownload(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  documentId: string,
): Promise<DocumentDownloadResult> {
  const document = await findStaffDownloadableDocument(
    prisma,
    documentId,
    staffPseudonymizedId,
  );
  if (!document) {
    throw new TRPCError({ code: "NOT_FOUND", message: DOCUMENT_NOT_FOUND });
  }

  const result = await buildDownloadResult(
    { bucketName: document.bucketName, objectKey: document.objectKey },
    document.fileName,
  );

  await withTimelineAnalytics(prisma, async (tx) => {
    await recordDocumentDownloadedTimelineEvent(
      tx,
      document.applicationId,
      document.fileName,
      document.documentType,
      document.application.clientName,
      document.scopedProviderId,
      staffUploader(staffPseudonymizedId),
    );
  });

  return result;
}

export async function getStaffDocumentPreview(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  documentId: string,
): Promise<DocumentDownloadResult> {
  const document = await findStaffDraftPreviewDocument(
    prisma,
    documentId,
    staffPseudonymizedId,
  );
  if (!document) {
    throw new TRPCError({ code: "NOT_FOUND", message: DOCUMENT_NOT_FOUND });
  }

  return buildDownloadResult(
    { bucketName: document.bucketName, objectKey: document.objectKey },
    document.fileName,
  );
}

export async function getProviderDocumentDownload(
  prisma: PrismaClient,
  provider: ProviderUploaderDescriptor,
  documentId: string,
): Promise<DocumentDownloadResult> {
  const document = await findProviderDownloadableDocument(
    prisma,
    documentId,
    provider.providerId,
  );
  if (!document) {
    throw new TRPCError({ code: "NOT_FOUND", message: DOCUMENT_NOT_FOUND });
  }

  const result = await buildDownloadResult(
    { bucketName: document.bucketName, objectKey: document.objectKey },
    document.fileName,
  );

  await withTimelineAnalytics(prisma, async (tx) => {
    await recordDocumentDownloadedTimelineEvent(
      tx,
      document.applicationId,
      document.fileName,
      document.documentType,
      document.application.clientName,
      document.scopedProviderId,
      provider,
    );
  });

  return result;
}

function toDocumentScanStatusResult(document: {
  scanStatus: HousingApplicationDocumentScanStatus;
}): DocumentScanStatusResult {
  return {
    scanStatus: document.scanStatus,
  };
}

export async function getStaffDocumentScanStatus(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  documentId: string,
): Promise<DocumentScanStatusResult> {
  const document = await findStaffDocumentForScanStatus(
    prisma,
    documentId,
    staffPseudonymizedId,
  );
  if (!document) {
    throw new TRPCError({ code: "NOT_FOUND", message: DOCUMENT_NOT_FOUND });
  }

  return toDocumentScanStatusResult(document);
}

export async function getProviderDocumentScanStatus(
  prisma: PrismaClient,
  provider: ProviderUploaderDescriptor,
  documentId: string,
): Promise<DocumentScanStatusResult> {
  const document = await findProviderDocumentForScanStatus(
    prisma,
    documentId,
    provider.providerId,
  );
  if (!document) {
    throw new TRPCError({ code: "NOT_FOUND", message: DOCUMENT_NOT_FOUND });
  }

  return toDocumentScanStatusResult(document);
}

export async function deleteDocument(
  prisma: PrismaClient,
  caller: UploaderDescriptor,
  documentId: string,
): Promise<DeleteDocumentResult> {
  // Permission is part of this filter, not a condition after the read: a
  // document the caller may not delete never comes back at all.
  const document = await findDeletableDocument(prisma, documentId, caller);
  if (!document) {
    throw new TRPCError({ code: "NOT_FOUND", message: DOCUMENT_NOT_FOUND });
  }

  await assertUploaderCanAccessApplication(
    prisma,
    document.applicationId,
    caller,
  );

  await deleteDocumentRow(prisma, documentId);
  await deleteGcsObject({
    bucketName: document.bucketName,
    objectKey: document.objectKey,
  }).catch((error: unknown) => {
    // The DB row is already gone at this point, so a failure here leaves a
    // dangling GCS object with nothing pointing at it — worth surfacing even
    // though it can't undo the delete.
    // IDs only — never add fileName, objectKey, or other PII here.
    captureException(error, { extra: { documentId } });
  });

  return { id: documentId };
}

// Bounds a single sweep so an unexpectedly large backlog can't blow past the
// job's own timeout in one run; any remainder is picked up next run.
const PENDING_DOCUMENT_SWEEP_BATCH_SIZE = 500;

/**
 * Deletes the GCS object before the row: a row whose object delete failed
 * stays put and is retried next run, whereas deleting the row first would
 * leave an object no row points to and nothing would ever retry it.
 */
async function sweepStalePendingDocument(
  prisma: PrismaClient,
  document: { id: string; bucketName: string; objectKey: string },
  stalePendingWhere: Prisma.HousingApplicationDocumentWhereInput,
): Promise<"deleted" | "skipped" | "failed"> {
  try {
    // Confirmed or scanned INFECTED since the batch find: its object is no
    // longer the janitor's to delete.
    const stillStale = await prisma.housingApplicationDocument.count({
      where: { id: document.id, ...stalePendingWhere },
    });
    if (stillStale === 0) return "skipped";
  } catch (error) {
    log.error("Failed to re-check stale pending document", {
      documentId: document.id,
      ...formatErrorForLog(error),
    });
    return "failed";
  }

  try {
    await deleteGcsObject(document);
  } catch (error) {
    if (!isGcsNotFoundError(error)) {
      log.error("Failed to delete GCS object for stale pending document", {
        documentId: document.id,
        objectKey: document.objectKey,
        ...formatErrorForLog(error),
      });
      return "failed";
    }
  }

  try {
    const result = await prisma.housingApplicationDocument.deleteMany({
      where: { id: document.id, ...stalePendingWhere },
    });
    if (result.count > 0) return "deleted";
    // Changed in the gap between the re-check and this delete, after its
    // object was already gone.
    log.error(
      "Stale pending document changed after its GCS object was deleted",
      {
        documentId: document.id,
      },
    );
    return "failed";
  } catch (error) {
    log.error("Failed to delete stale pending document", {
      documentId: document.id,
      ...formatErrorForLog(error),
    });
    return "failed";
  }
}

/**
 * Deletes PENDING uploads abandoned before confirmDocumentUpload was ever
 * called (browser drop, tab close), which otherwise sit unconfirmed forever.
 */
export async function sweepStalePendingDocuments(
  prisma: PrismaClient,
  olderThan: Date,
): Promise<{ deleted: number; failed: number }> {
  const stalePendingWhere: Prisma.HousingApplicationDocumentWhereInput = {
    status: HousingApplicationDocumentStatus.PENDING,
    createdAt: { lt: olderThan },
    // INFECTED uploads are retained for forensics regardless of confirm
    // status; this sweep is for abandoned uploads, not scan verdicts.
    scanStatus: { not: HousingApplicationDocumentScanStatus.INFECTED },
    // Same guard as the shell sweep: an extraction claimed recently is still
    // in flight, so its document is never swept out from under it.
    application: {
      OR: [
        { extractionClaimedAt: null },
        { extractionClaimedAt: { lt: olderThan } },
      ],
    },
  };

  const stale = await prisma.housingApplicationDocument.findMany({
    where: stalePendingWhere,
    select: { id: true, bucketName: true, objectKey: true },
    take: PENDING_DOCUMENT_SWEEP_BATCH_SIZE,
  });

  let deleted = 0;
  let failed = 0;

  for (const document of stale) {
    // eslint-disable-next-line no-await-in-loop -- sequential, low-volume sweep
    const outcome = await sweepStalePendingDocument(
      prisma,
      document,
      stalePendingWhere,
    );
    if (outcome === "deleted") deleted += 1;
    if (outcome === "failed") failed += 1;
  }

  return { deleted, failed };
}

/**
 * Confirmed uploads still awaiting a scan verdict, uploaded between newerThan
 * and olderThan; the lower bound keeps pre-scanner uploads, which never get
 * one, from alerting every run. Count only: rescan or removal is a human call.
 */
export async function countStuckScanDocuments(
  prisma: PrismaClient,
  olderThan: Date,
  newerThan: Date,
): Promise<number> {
  return prisma.housingApplicationDocument.count({
    where: {
      status: HousingApplicationDocumentStatus.CONFIRMED,
      scanStatus: HousingApplicationDocumentScanStatus.PENDING,
      createdAt: { lt: olderThan, gte: newerThan },
    },
  });
}

/**
 * CLEAN and INFECTED are reported by separate GCS Eventarc triggers on the
 * clean and quarantine buckets respectively — ClamAV moves the object into
 * one of those buckets, so which bucket the finalize event fired in *is* the
 * verdict. FAILED scans have no corresponding bucket/trigger and are out of
 * scope for this webhook, so they're never derived here; a FAILED verdict
 * only validates if bucketName happens to already equal cleanBucketName or
 * quarantinedBucketName, which none should — this rejects it as not_found
 * rather than silently trusting a caller-supplied FAILED verdict.
 *
 * With the scan flag off, uploads land in the clean bucket unscanned, so an
 * event there yields no CLEAN. Only the scanner writes the quarantine bucket
 * (malware-scanning/malware-bucket-iam.tf), so INFECTED is always honoured.
 */
export function deriveVerdictFromBucket(
  bucketName: string,
):
  | Extract<DocumentScanResultBody["verdict"], "CLEAN" | "INFECTED">
  | undefined {
  if (bucketName === gcsConfig.cleanBucketName) {
    return gcsConfig.malwareScanEnabled ? "CLEAN" : undefined;
  }
  if (
    gcsConfig.quarantinedBucketName !== undefined &&
    bucketName === gcsConfig.quarantinedBucketName
  ) {
    return "INFECTED";
  }
  return undefined;
}

/**
 * True for a clean-bucket event that deriveVerdictFromBucket drops only
 * because scanning is off, so the webhook can log that instead of calling
 * the bucket unrecognized.
 */
export function isCleanBucketWithScanDisabled(bucketName: string): boolean {
  return (
    !gcsConfig.malwareScanEnabled && bucketName === gcsConfig.cleanBucketName
  );
}

function isBucketValidForVerdict(
  verdict: DocumentScanResultBody["verdict"],
  bucketName: string,
): boolean {
  return deriveVerdictFromBucket(bucketName) === verdict;
}

export async function applyDocumentScanResult(
  prisma: PrismaClient,
  body: DocumentScanResultBody,
): Promise<UpdateDocumentScanStatusOutcome> {
  if (!isBucketValidForVerdict(body.verdict, body.bucketName)) {
    return "not_found";
  }

  const objectRef: GcsObjectRef = {
    bucketName: body.bucketName,
    objectKey: body.objectKey,
  };
  // INFECTED objects are left in the quarantine bucket for the GCS lifecycle
  // policy (90d) to expire rather than actively deleted here, so they remain
  // available for security investigation/audit in the meantime. Empty draft
  // shells are not deleted here either — the client polls getScanStatus, then
  // calls cancelUpload after INFECTED so the document row still exists for
  // that poll.
  return updateDocumentScanStatus(prisma, objectRef, body.verdict);
}
