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
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  type Prisma,
} from "~@idaho-th/prisma/client";
import type {
  DocumentOwnershipFields,
  DocumentOwnershipWhere,
  UploaderDescriptor,
} from "~@idaho-th/trpc/routes/documents/documents.types";
import { PROVIDER_CLOSED_EVENT_TYPES } from "~@idaho-th/trpc/routes/housing-common/providerVisibility";

export const PROVIDER_CLOSED_EVENT_SELECT = {
  eventType: true,
  scopedProviderId: true,
  createdAt: true,
} satisfies Prisma.HousingApplicationTimelineEventSelect;

export const DOCUMENT_LIST_SELECT = {
  id: true,
  fileName: true,
  documentType: true,
  uploadedByType: true,
  uploadedByPseudonymizedId: true,
  scopedProviderId: true,
  fileSizeBytes: true,
  contentType: true,
  createdAt: true,
  scanStatus: true,
} satisfies Prisma.HousingApplicationDocumentSelect;

export const DOCUMENT_LIST_ORDER_BY = {
  createdAt: "desc",
} satisfies Prisma.HousingApplicationDocumentOrderByWithRelationInput;

export function confirmedDocumentsWhere(): Prisma.HousingApplicationDocumentWhereInput {
  return {
    status: HousingApplicationDocumentStatus.CONFIRMED,
  };
}

export function providerVisibleDocumentsWhere(
  providerId: string,
): Prisma.HousingApplicationDocumentWhereInput {
  return {
    ...confirmedDocumentsWhere(),
    OR: [{ scopedProviderId: providerId }, { scopedProviderId: null }],
  };
}

const NOT_INFECTED_WHERE = {
  scanStatus: { not: HousingApplicationDocumentScanStatus.INFECTED },
} satisfies Prisma.HousingApplicationDocumentWhereInput;

export function listableStaffDocumentsWhere(): Prisma.HousingApplicationDocumentWhereInput {
  return {
    ...confirmedDocumentsWhere(),
    ...NOT_INFECTED_WHERE,
  };
}

export function listableProviderDocumentsWhere(
  providerId: string,
): Prisma.HousingApplicationDocumentWhereInput {
  return {
    ...providerVisibleDocumentsWhere(providerId),
    ...NOT_INFECTED_WHERE,
  };
}

/**
 * The single definition of "this caller may delete this document".
 *
 * `findDeletableDocument` spreads it into the deletion lookup's `where`, and
 * `documentMatchesOwnership` evaluates the same object against a list row to
 * produce `canDelete`. Both read this function, so the flag shown to the user
 * cannot promise something the deletion filter would refuse.
 *
 * For a provider the clause is the organization, not the uploader: colleagues
 * share one file set, so an attachment stays deletable after the person who
 * uploaded it has left.
 */
export function deletableDocumentOwnershipWhere(
  uploader: UploaderDescriptor,
): DocumentOwnershipWhere {
  // System-generated types are undeletable for every caller.
  const documentType = HousingApplicationDocumentType.ATTACHMENT;

  if (uploader.audience === HousingApplicationDocumentUploader.PROVIDER) {
    return {
      documentType,
      uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
      scopedProviderId: uploader.providerId,
    };
  }

  return {
    documentType,
    uploadedByType: HousingApplicationDocumentUploader.STAFF,
    uploadedByPseudonymizedId: uploader.staffPseudonymizedId,
  };
}

/**
 * Evaluates a `DocumentOwnershipWhere` against a row already in memory. Only
 * scalar equality appears in that clause, so comparing each named column is
 * exactly what the database does with the same object.
 */
export function documentMatchesOwnership(
  row: DocumentOwnershipFields,
  where: DocumentOwnershipWhere,
): boolean {
  return Object.entries(where).every(
    ([column, value]) => row[column as keyof DocumentOwnershipFields] === value,
  );
}

// Selects the fields resolveClosedProviderCutoff/findProviderClosedEventAt
// need to compute a closed-provider's visibility cutoff. Shared by every
// query that returns provider-scoped application/document data.
export function providerVisibilityApplicationSelect(providerId: string) {
  return {
    providerApplications: {
      where: { providerId },
      select: { providerId: true, stage: true },
      take: 1,
    },
    timelineEvents: {
      where: { eventType: { in: [...PROVIDER_CLOSED_EVENT_TYPES] } },
      select: PROVIDER_CLOSED_EVENT_SELECT,
      orderBy: { createdAt: "asc" },
    },
  } satisfies Prisma.HousingApplicationSelect;
}

export const DOWNLOADABLE_DOCUMENT_SELECT = {
  applicationId: true,
  bucketName: true,
  objectKey: true,
  fileName: true,
  documentType: true,
  scopedProviderId: true,
  application: { select: { clientName: true } },
} satisfies Prisma.HousingApplicationDocumentSelect;

export function providerDownloadableDocumentSelect(providerId: string) {
  return {
    ...DOWNLOADABLE_DOCUMENT_SELECT,
    createdAt: true,
    application: {
      select: {
        clientName: true,
        ...providerVisibilityApplicationSelect(providerId),
      },
    },
  } satisfies Prisma.HousingApplicationDocumentSelect;
}

export const DOCUMENT_SCAN_STATUS_SELECT = {
  id: true,
  scanStatus: true,
} satisfies Prisma.HousingApplicationDocumentSelect;

export function providerDocumentScanStatusSelect(providerId: string) {
  return {
    ...DOCUMENT_SCAN_STATUS_SELECT,
    createdAt: true,
    scopedProviderId: true,
    application: {
      select: providerVisibilityApplicationSelect(providerId),
    },
  } satisfies Prisma.HousingApplicationDocumentSelect;
}
