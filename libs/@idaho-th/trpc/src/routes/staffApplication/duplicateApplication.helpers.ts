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

import {
  ApplicationStage,
  type ApplicationStatus,
  type ApplicationSubStage,
  type ClosedOutcome,
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  type Prisma,
} from "~@idaho-th/prisma/client";
import { PREFERRED_PROVIDERS_SELECT } from "~@idaho-th/trpc/routes/housing-common/preferredProviders.helpers";

import {
  HOUSING_PLAN_REJECTED_CLOSED_CASE_WHERE,
  REVOKED_CLOSED_CASE_WHERE,
} from "./staffApplication.constants";
import type { DbClient } from "./staffApplication.types";

const DUPLICATE_SOURCE_DOCUMENT_TYPES: HousingApplicationDocumentType[] = [
  HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
  HousingApplicationDocumentType.DIGITIZED,
];

export const DUPLICATE_SOURCE_SELECT = {
  formData: true,
  preferredProviders: PREFERRED_PROVIDERS_SELECT,
  staffApplication: {
    select: { stage: true, subStage: true, status: true, closedOutcome: true },
  },
  documents: {
    where: {
      documentType: { in: DUPLICATE_SOURCE_DOCUMENT_TYPES },
      status: HousingApplicationDocumentStatus.CONFIRMED,
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
    },
    orderBy: { createdAt: "desc" },
    select: {
      documentType: true,
      bucketName: true,
      objectKey: true,
      contentType: true,
      fileSizeBytes: true,
      fileName: true,
      scanStatus: true,
    },
  },
} as const satisfies Prisma.HousingApplicationSelect;

export type DuplicateSourceApplication = Prisma.HousingApplicationGetPayload<{
  select: typeof DUPLICATE_SOURCE_SELECT;
}>;

export type DuplicateSourceDocument =
  DuplicateSourceApplication["documents"][number];

export function findLatestDuplicateSourceDocument(
  documents: DuplicateSourceDocument[],
  documentType: HousingApplicationDocumentType,
): DuplicateSourceDocument | undefined {
  return documents.find((document) => document.documentType === documentType);
}

export async function findDuplicateSourceApplication(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
): Promise<DuplicateSourceApplication | null> {
  return client.housingApplication.findFirst({
    where: {
      id: applicationId,
      duplicates: { none: {} },
      staffApplication: {
        staffPseudonymizedId,
        OR: [
          { stage: { not: ApplicationStage.CLOSED } },
          REVOKED_CLOSED_CASE_WHERE,
          HOUSING_PLAN_REJECTED_CLOSED_CASE_WHERE,
        ],
      },
    },
    select: DUPLICATE_SOURCE_SELECT,
  });
}

/**
 * Safe to read before the lock: a revoked, closed case never changes stage or
 * sub-stage again, and a live one that closes meanwhile is caught by the close
 * step's own check.
 */
export function isRevokedClosedCase(
  staffApplication: {
    stage: ApplicationStage;
    subStage: ApplicationSubStage | null;
    status: ApplicationStatus;
  } | null,
): boolean {
  return (
    staffApplication != null &&
    staffApplication.stage === REVOKED_CLOSED_CASE_WHERE.stage &&
    staffApplication.subStage === REVOKED_CLOSED_CASE_WHERE.subStage &&
    REVOKED_CLOSED_CASE_WHERE.status.in.includes(staffApplication.status)
  );
}

/** Already closed by a rejected home plan, so nothing closes it again. */
export function isHousingPlanRejectedClosedCase(
  staffApplication: {
    stage: ApplicationStage;
    closedOutcome: ClosedOutcome | null;
  } | null,
): boolean {
  return (
    staffApplication != null &&
    staffApplication.stage === HOUSING_PLAN_REJECTED_CLOSED_CASE_WHERE.stage &&
    staffApplication.closedOutcome ===
      HOUSING_PLAN_REJECTED_CLOSED_CASE_WHERE.closedOutcome
  );
}

export async function countApplicationDuplicates(
  client: DbClient,
  applicationId: string,
): Promise<number> {
  return client.housingApplication.count({
    where: { duplicatedFromId: applicationId },
  });
}

export function buildDuplicateDocumentCreate(
  staffPseudonymizedId: string,
  source: DuplicateSourceDocument,
): Prisma.HousingApplicationDocumentCreateWithoutApplicationInput {
  return {
    uploadedByType: HousingApplicationDocumentUploader.STAFF,
    uploadedByPseudonymizedId: staffPseudonymizedId,
    documentType: source.documentType,
    fileName: source.fileName,
    bucketName: source.bucketName,
    objectKey: source.objectKey,
    contentType: source.contentType,
    fileSizeBytes: source.fileSizeBytes,
    status: HousingApplicationDocumentStatus.CONFIRMED,
    confirmedAt: new Date(),
    scanStatus: source.scanStatus,
  };
}
