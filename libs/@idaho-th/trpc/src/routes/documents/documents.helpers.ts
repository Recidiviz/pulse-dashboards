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
  ApplicationIntakeStatus,
  ApplicationStage,
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  type Prisma,
} from "~@idaho-th/prisma/client";
import type {
  CreatePendingDocumentInput,
  DbClient,
  DeletableDocument,
  DocumentListRow,
  DocumentScanStatusRow,
  DownloadableDocument,
  PendingDocument,
  ProviderDocumentScanStatusRow,
  ProviderDocumentVisibilityFields,
  ProviderDownloadableDocument,
  ProviderUploaderDescriptor,
  StaffUploaderDescriptor,
  UpdateDocumentScanStatusOutcome,
  UploaderDescriptor,
} from "~@idaho-th/trpc/routes/documents/documents.types";
import {
  assertStaffCaseModifiable,
  HOUSING_APPLICATION_NOT_FOUND,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import {
  buildApplicationWhereForProvider,
  buildApplicationWhereForStaff,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";
import {
  findProviderClosedEventAt,
  isVisibleForCutoff,
  resolveClosedProviderCutoff,
} from "~@idaho-th/trpc/routes/housing-common/providerVisibility";
import type { GcsObjectRef } from "~@idaho-th/trpc/storage/gcs";

import {
  confirmedDocumentsWhere,
  deletableDocumentOwnershipWhere,
  DOCUMENT_LIST_ORDER_BY,
  DOCUMENT_LIST_SELECT,
  DOCUMENT_SCAN_STATUS_SELECT,
  DOWNLOADABLE_DOCUMENT_SELECT,
  listableProviderDocumentsWhere,
  listableStaffDocumentsWhere,
  providerDocumentScanStatusSelect,
  providerDownloadableDocumentSelect,
  providerVisibilityApplicationSelect,
  providerVisibleDocumentsWhere,
} from "./documents.selects";

export const APPLICATION_NOT_FOUND = HOUSING_APPLICATION_NOT_FOUND.APPLICATION;
const PROVIDER_ACCESS_LOST =
  "Provider no longer has access to this application";

export function staffUploader(
  staffPseudonymizedId: string,
): StaffUploaderDescriptor {
  return {
    audience: HousingApplicationDocumentUploader.STAFF,
    staffPseudonymizedId,
  };
}

export function providerUploader(
  providerId: string,
  uploadedByPseudonymizedId: string,
): ProviderUploaderDescriptor {
  return {
    audience: HousingApplicationDocumentUploader.PROVIDER,
    providerId,
    uploadedByPseudonymizedId,
  };
}

/**
 * The person who acted. Attribution and audit only — a provider's visibility
 * and permissions come from their organization, never from this value.
 */
export function actingPersonPseudonymizedId(
  uploader: UploaderDescriptor,
): string {
  return uploader.audience === HousingApplicationDocumentUploader.PROVIDER
    ? uploader.uploadedByPseudonymizedId
    : uploader.staffPseudonymizedId;
}

/** Attribution plus the visibility scope written onto a new document row. */
function newDocumentOwnershipFields(uploader: UploaderDescriptor) {
  return {
    uploadedByType: uploader.audience,
    uploadedByPseudonymizedId: actingPersonPseudonymizedId(uploader),
    // Set for a provider so every colleague at the organization sees the
    // upload; null for staff, which means shared with everyone on the case.
    scopedProviderId:
      uploader.audience === HousingApplicationDocumentUploader.PROVIDER
        ? uploader.providerId
        : null,
  };
}

const QUOTA_LOCK_PREFIX = "idaho-th:doc-upload-quota";

/**
 * The subject the daily upload allowance is counted and locked against: the
 * organization for a provider, the person for staff. Colleagues therefore
 * share one allowance, so it means the same thing whatever the headcount.
 *
 * The count filter and the advisory lock key are both built here from one
 * `subjectId`, so they cannot drift apart. They are not interchangeable — an
 * organization-keyed count filters `scopedProviderId` where a person-keyed one
 * filters `uploadedByPseudonymizedId` — and leaving the lock on the person
 * while counting the organization would let two colleagues take separate locks
 * and both pass the same check.
 */
function uploaderQuotaIdentity(uploader: UploaderDescriptor): {
  countWhere: Prisma.HousingApplicationDocumentWhereInput;
  lockKey: string;
} {
  const isProvider =
    uploader.audience === HousingApplicationDocumentUploader.PROVIDER;
  const subjectId = isProvider
    ? uploader.providerId
    : uploader.staffPseudonymizedId;

  return {
    countWhere: {
      uploadedByType: uploader.audience,
      // Only the column differs by audience; the subject is the same id the
      // lock key below is formatted from.
      ...(isProvider
        ? { scopedProviderId: subjectId }
        : { uploadedByPseudonymizedId: subjectId }),
    },
    lockKey: `${QUOTA_LOCK_PREFIX}:${uploader.audience}:${subjectId}`,
  };
}

export async function findStaffApplicationDocuments(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
) {
  return client.housingApplication.findFirst({
    where: buildApplicationWhereForStaff(applicationId, staffPseudonymizedId),
    select: {
      documents: {
        where: listableStaffDocumentsWhere(),
        select: DOCUMENT_LIST_SELECT,
        orderBy: DOCUMENT_LIST_ORDER_BY,
      },
    },
  });
}

export async function findProviderApplicationDocuments(
  client: DbClient,
  applicationId: string,
  providerId: string,
) {
  return client.housingApplication.findFirst({
    where: buildApplicationWhereForProvider(applicationId, providerId),
    select: {
      ...providerVisibilityApplicationSelect(providerId),
      documents: {
        where: listableProviderDocumentsWhere(providerId),
        select: DOCUMENT_LIST_SELECT,
        orderBy: DOCUMENT_LIST_ORDER_BY,
      },
    },
  });
}

export function isDocumentVisibleForCutoff(
  document: {
    scopedProviderId: string | null;
    createdAt: Date;
  },
  providerId: string,
  cutoff: Date | null,
): boolean {
  return isVisibleForCutoff(
    document.createdAt,
    document.scopedProviderId === providerId,
    cutoff,
  );
}

/**
 * Applies closed-provider cutoff (§7.1) after a Prisma match. The documentId +
 * providerId query alone does not encode this rule — shared docs uploaded
 * after a provider is closed must still be hidden. The organization's own
 * uploads always pass (isDocumentVisibleForCutoff).
 */
export function resolveProviderVisibleDocument<
  T extends ProviderDocumentVisibilityFields,
>(document: T | null, providerId: string): T | null {
  const providerApplication = document?.application.providerApplications[0];
  if (!document || !providerApplication) {
    return null;
  }

  const cutoff = resolveClosedProviderCutoff(
    providerApplication.stage,
    findProviderClosedEventAt(
      document.application.timelineEvents,
      providerApplication.providerId,
    ),
  );
  if (!isDocumentVisibleForCutoff(document, providerId, cutoff)) {
    return null;
  }

  return document;
}

export async function assertUploaderCanAccessApplication(
  client: DbClient,
  applicationId: string,
  uploader: UploaderDescriptor,
): Promise<void> {
  if (uploader.audience === HousingApplicationDocumentUploader.STAFF) {
    const owned = await client.housingApplication.findFirst({
      where: buildApplicationWhereForStaff(
        applicationId,
        uploader.staffPseudonymizedId,
      ),
      select: {
        staffApplication: { select: { stage: true } },
      },
    });
    if (!owned?.staffApplication) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: APPLICATION_NOT_FOUND,
      });
    }
    // Draft-intake documents are created by the draft intake service, not
    // this route, so DRAFT applications are blocked here alongside CLOSED.
    assertStaffCaseModifiable(owned.staffApplication.stage);
    return;
  }

  const application = await client.housingApplication.findFirst({
    where: buildApplicationWhereForProvider(applicationId, uploader.providerId),
    select: {
      providerApplications: {
        where: { providerId: uploader.providerId },
        select: { stage: true },
        take: 1,
      },
    },
  });

  const providerApplication = application?.providerApplications[0];
  if (!providerApplication) {
    throw new TRPCError({ code: "NOT_FOUND", message: APPLICATION_NOT_FOUND });
  }
  if (providerApplication.stage === ApplicationStage.CLOSED) {
    throw new TRPCError({ code: "FORBIDDEN", message: PROVIDER_ACCESS_LOST });
  }
}

export async function countUploaderDocumentsSince(
  client: DbClient,
  uploader: UploaderDescriptor,
  since: Date,
): Promise<number> {
  return client.housingApplicationDocument.count({
    where: {
      ...uploaderQuotaIdentity(uploader).countWhere,
      status: HousingApplicationDocumentStatus.CONFIRMED,
      confirmedAt: { gte: since },
    },
  });
}

export async function lockUploaderDailyUploadQuota(
  client: DbClient,
  uploader: UploaderDescriptor,
): Promise<void> {
  const { lockKey } = uploaderQuotaIdentity(uploader);
  await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
}

export async function createPendingDocument(
  client: DbClient,
  input: CreatePendingDocumentInput,
): Promise<void> {
  await client.housingApplicationDocument.create({
    data: {
      id: input.documentId,
      applicationId: input.applicationId,
      ...newDocumentOwnershipFields(input.uploader),
      // documentType is chosen by the calling service function, never by
      // client input (see #15219/#15293) — requestDocumentUpload always
      // passes ATTACHMENT; requestDigitizedDocumentUploadForStaff is the only
      // other caller and always passes DIGITIZED.
      documentType: input.documentType,
      fileName: input.fileName,
      bucketName: input.bucketName,
      objectKey: input.objectKey,
      contentType: input.contentType,
      fileSizeBytes: input.fileSizeBytes,
    },
  });
}

/**
 * An upload is finished by the person who started it: the signed URL was
 * handed to them, and confirming is the tail of their own request. Sharing
 * across the organization starts once the row is confirmed.
 */
export async function findOwnedPendingDocument(
  client: DbClient,
  documentId: string,
  uploaderPseudonymizedId: string,
): Promise<PendingDocument | null> {
  return client.housingApplicationDocument.findFirst({
    where: {
      id: documentId,
      uploadedByPseudonymizedId: uploaderPseudonymizedId,
      status: HousingApplicationDocumentStatus.PENDING,
    },
    select: {
      id: true,
      applicationId: true,
      bucketName: true,
      objectKey: true,
      contentType: true,
      fileName: true,
      documentType: true,
      application: { select: { clientName: true } },
    },
  });
}

export async function findProviderIdentityForDocumentEvent(
  client: DbClient,
  applicationId: string,
  providerId: string,
): Promise<{ providerId: string; providerName: string } | null> {
  const application = await client.housingApplication.findFirst({
    where: buildApplicationWhereForProvider(applicationId, providerId),
    select: {
      providerApplications: {
        where: { providerId },
        select: { providerId: true, provider: { select: { name: true } } },
        take: 1,
      },
    },
  });

  const providerApplication = application?.providerApplications[0];
  if (!providerApplication) {
    return null;
  }
  return {
    providerId: providerApplication.providerId,
    providerName: providerApplication.provider.name,
  };
}

export async function markDocumentConfirmed(
  client: DbClient,
  documentId: string,
  options?: {
    scanStatus?: HousingApplicationDocumentScanStatus;
    bucketName?: string;
  },
): Promise<DocumentListRow> {
  return client.housingApplicationDocument.update({
    where: { id: documentId },
    data: {
      status: HousingApplicationDocumentStatus.CONFIRMED,
      confirmedAt: new Date(),
      ...(options?.scanStatus !== undefined
        ? { scanStatus: options.scanStatus }
        : {}),
      ...(options?.bucketName !== undefined
        ? { bucketName: options.bucketName }
        : {}),
    },
    select: DOCUMENT_LIST_SELECT,
  });
}

export async function markDocumentRejected(
  client: DbClient,
  documentId: string,
  rejectionReason: string,
): Promise<void> {
  await client.housingApplicationDocument.update({
    where: { id: documentId },
    data: {
      status: HousingApplicationDocumentStatus.REJECTED,
      rejectionReason,
    },
  });
}

export async function findStaffDownloadableDocument(
  client: DbClient,
  documentId: string,
  staffPseudonymizedId: string,
): Promise<DownloadableDocument | null> {
  return client.housingApplicationDocument.findFirst({
    where: {
      id: documentId,
      ...confirmedDocumentsWhere(),
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
      application: { staffApplication: { staffPseudonymizedId } },
    },
    select: DOWNLOADABLE_DOCUMENT_SELECT,
  });
}

export async function findStaffDraftPreviewDocument(
  client: DbClient,
  documentId: string,
  staffPseudonymizedId: string,
): Promise<DownloadableDocument | null> {
  return client.housingApplicationDocument.findFirst({
    where: {
      id: documentId,
      ...confirmedDocumentsWhere(),
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
      application: {
        staffApplication: {
          staffPseudonymizedId,
          intakeStatus: ApplicationIntakeStatus.DRAFT,
        },
      },
    },
    select: DOWNLOADABLE_DOCUMENT_SELECT,
  });
}

export async function findStaffDocumentForScanStatus(
  client: DbClient,
  documentId: string,
  staffPseudonymizedId: string,
): Promise<DocumentScanStatusRow | null> {
  return client.housingApplicationDocument.findFirst({
    where: {
      id: documentId,
      ...confirmedDocumentsWhere(),
      application: { staffApplication: { staffPseudonymizedId } },
    },
    select: DOCUMENT_SCAN_STATUS_SELECT,
  });
}

export async function findProviderDownloadableDocument(
  client: DbClient,
  documentId: string,
  providerId: string,
): Promise<ProviderDownloadableDocument | null> {
  const document = await client.housingApplicationDocument.findFirst({
    where: {
      id: documentId,
      ...confirmedDocumentsWhere(),
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
      OR: [{ scopedProviderId: providerId }, { scopedProviderId: null }],
      application: { providerApplications: { some: { providerId } } },
    },
    select: providerDownloadableDocumentSelect(providerId),
  });
  return resolveProviderVisibleDocument(document, providerId);
}

export async function findProviderDocumentForScanStatus(
  client: DbClient,
  documentId: string,
  providerId: string,
): Promise<ProviderDocumentScanStatusRow | null> {
  const document = await client.housingApplicationDocument.findFirst({
    where: {
      id: documentId,
      ...providerVisibleDocumentsWhere(providerId),
      application: { providerApplications: { some: { providerId } } },
    },
    select: providerDocumentScanStatusSelect(providerId),
  });
  return resolveProviderVisibleDocument(document, providerId);
}

export async function updateDocumentScanStatus(
  client: DbClient,
  ref: GcsObjectRef,
  verdict: Exclude<HousingApplicationDocumentScanStatus, "PENDING">,
): Promise<UpdateDocumentScanStatusOutcome> {
  // Matched on objectKey alone (not bucketName): a CLEAN verdict reports the
  // clean bucket the scan job just moved the object into, which never
  // matches the quarantine bucketName still stored on the PENDING row.
  // objectKey is stable across that move, so it's the identity to key off;
  // bucketName is instead written here to record the object's new location.
  const { count } = await client.housingApplicationDocument.updateMany({
    where: {
      objectKey: { equals: ref.objectKey },
      scanStatus: HousingApplicationDocumentScanStatus.PENDING,
    },
    data: { scanStatus: verdict, bucketName: ref.bucketName },
  });

  if (count > 0) {
    return "updated";
  }

  // findFirst, not findUnique: objectKey isn't unique anymore, but at scan time
  // only one row has this key. Just checks whether the key is known at all.
  // This holds because a duplicate can only be created from an already-
  // CONFIRMED (already-scanned) document, so the scan webhook for a given key
  // always resolves before any duplicate reusing that key can exist.
  const existing = await client.housingApplicationDocument.findFirst({
    where: { objectKey: { equals: ref.objectKey } },
    select: { id: true },
  });
  return existing ? "already_resolved" : "not_found";
}

export async function staffApplicationHasDigitizedDocument(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
): Promise<boolean> {
  const existing = await client.housingApplicationDocument.findFirst({
    where: {
      applicationId,
      documentType: HousingApplicationDocumentType.DIGITIZED,
      status: { not: HousingApplicationDocumentStatus.REJECTED },
      scanStatus: { not: HousingApplicationDocumentScanStatus.INFECTED },
      application: { staffApplication: { staffPseudonymizedId } },
    },
    select: { id: true },
  });
  return existing !== null;
}

/**
 * The enforcement point for deletion. Ownership is part of the filter, so a
 * document the caller may not delete simply does not come back — there is no
 * post-read check to forget.
 */
export async function findDeletableDocument(
  client: DbClient,
  documentId: string,
  uploader: UploaderDescriptor,
): Promise<DeletableDocument | null> {
  return client.housingApplicationDocument.findFirst({
    where: {
      id: documentId,
      ...deletableDocumentOwnershipWhere(uploader),
    },
    select: {
      id: true,
      applicationId: true,
      bucketName: true,
      objectKey: true,
    },
  });
}

export async function deleteDocumentRow(
  client: DbClient,
  documentId: string,
): Promise<void> {
  await client.housingApplicationDocument.delete({ where: { id: documentId } });
}
