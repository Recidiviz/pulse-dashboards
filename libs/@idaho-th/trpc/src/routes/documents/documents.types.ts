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

import type { z } from "zod";

import {
  type ApplicationStage,
  type HousingApplicationDocumentScanStatus,
  type HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  type Prisma,
  type PrismaClient,
} from "~@idaho-th/prisma/client";
import type { DocumentUploadErrorCode } from "~@idaho-th/trpc/routes/documents/documents.constants";
import type {
  documentScanResultBodySchema,
  requestDocumentUploadSchema,
} from "~@idaho-th/trpc/routes/documents/documents.schema";
import {
  DOCUMENT_LIST_SELECT,
  DOCUMENT_SCAN_STATUS_SELECT,
  providerDocumentScanStatusSelect,
  providerDownloadableDocumentSelect,
} from "~@idaho-th/trpc/routes/documents/documents.selects";
import type { findProviderClosedEventAt } from "~@idaho-th/trpc/routes/housing-common/providerVisibility";

export type DocumentListItem = {
  id: string;
  fileName: string;
  documentType: HousingApplicationDocumentType;
  uploadedByType: HousingApplicationDocumentUploader;
  fileSizeBytes: number | null;
  contentType: string;
  createdAt: Date;
  canDelete: boolean;
  scanStatus: HousingApplicationDocumentScanStatus;
};

/**
 * A provider acting for the organization resolved by the provider middleware.
 * `providerId` is the verified organization and is what every provider-scoped
 * document filter uses; `uploadedByPseudonymizedId` only attributes the action
 * to the person and never controls visibility or permission.
 */
export type ProviderUploaderDescriptor = {
  audience: typeof HousingApplicationDocumentUploader.PROVIDER;
  providerId: string;
  uploadedByPseudonymizedId: string;
};

/** A case manager acting for themselves; staff have no organization. */
export type StaffUploaderDescriptor = {
  audience: typeof HousingApplicationDocumentUploader.STAFF;
  staffPseudonymizedId: string;
};

/**
 * Who is acting on a document, resolved from the authenticated tRPC context.
 *
 * Discriminated by `audience` rather than carrying one pseudonymized
 * identifier, because the identifier used to be two different things: a
 * provider's organization and a staff member's person. Keeping them as
 * separate, named fields is what stops an organization filter from being fed a
 * person's identifier.
 */
export type UploaderDescriptor =
  | ProviderUploaderDescriptor
  | StaffUploaderDescriptor;

export type RequestDocumentUploadResult = {
  documentId: string;
  uploadUrl: string;
};

export type DocumentDownloadResult = {
  fileName: string;
  /** Signed read URL; null only in local dev when inline base64 is returned. */
  downloadUrl: string | null;
  /** Inline content fallback for local dev without signing credentials. */
  contentBase64: string | null;
};

export type DocumentScanStatusResult = {
  scanStatus: HousingApplicationDocumentScanStatus;
};

export type DeleteDocumentResult = {
  id: string;
};

// documents.schema.ts input/body types

export type RequestDocumentUploadInput = z.infer<
  typeof requestDocumentUploadSchema
>;

export type DocumentScanResultBody = z.infer<
  typeof documentScanResultBodySchema
>;

export type DocumentListRow = Prisma.HousingApplicationDocumentGetPayload<{
  select: typeof DOCUMENT_LIST_SELECT;
}>;

/**
 * The columns the "may this caller delete this document" rule is written over.
 * Every list row carries all of them, which is what lets the capability flag
 * evaluate the very same clause the deletion query filters on.
 */
export type DocumentOwnershipFields = {
  documentType: HousingApplicationDocumentType;
  uploadedByType: HousingApplicationDocumentUploader;
  uploadedByPseudonymizedId: string;
  scopedProviderId: string | null;
};

/**
 * The rule itself: scalar equalities only, so it is both a valid Prisma filter
 * and something that can be checked against a row already in memory.
 */
export type DocumentOwnershipWhere = Partial<DocumentOwnershipFields> &
  Pick<DocumentOwnershipFields, "documentType">;

export type ProviderDocumentVisibilityFields = {
  createdAt: Date;
  scopedProviderId: string | null;
  application: {
    providerApplications: Array<{
      providerId: string;
      stage: ApplicationStage;
    }>;
    timelineEvents: Parameters<typeof findProviderClosedEventAt>[0];
  };
};

export type DownloadableDocument = {
  applicationId: string;
  bucketName: string;
  objectKey: string;
  fileName: string;
  documentType: HousingApplicationDocumentType;
  scopedProviderId: string | null;
  application: { clientName: string };
};

export type ProviderDownloadableDocument =
  Prisma.HousingApplicationDocumentGetPayload<{
    select: ReturnType<typeof providerDownloadableDocumentSelect>;
  }>;

export type DocumentScanStatusRow =
  Prisma.HousingApplicationDocumentGetPayload<{
    select: typeof DOCUMENT_SCAN_STATUS_SELECT;
  }>;

export type ProviderDocumentScanStatusRow =
  Prisma.HousingApplicationDocumentGetPayload<{
    select: ReturnType<typeof providerDocumentScanStatusSelect>;
  }>;

export type DbClient = Prisma.TransactionClient | PrismaClient;

export type CreatePendingDocumentInput = {
  documentId: string;
  applicationId: string;
  uploader: UploaderDescriptor;
  documentType: HousingApplicationDocumentType;
  fileName: string;
  bucketName: string;
  objectKey: string;
  contentType: string;
  fileSizeBytes: number;
};

export type PendingDocument = {
  id: string;
  applicationId: string;
  bucketName: string;
  objectKey: string;
  contentType: string;
  fileName: string;
  documentType: HousingApplicationDocumentType;
  application: { clientName: string };
};

export type UpdateDocumentScanStatusOutcome =
  | "updated"
  | "already_resolved"
  | "not_found";

export type DeletableDocument = {
  id: string;
  applicationId: string;
  bucketName: string;
  objectKey: string;
};

export type UploadVerificationResult =
  | { ok: true }
  | { ok: false; code: DocumentUploadErrorCode };

export type FileTypeSpec = {
  mimeTypes: readonly string[];
  extension: string;
  matchesMagicBytes: (bytes: Buffer) => boolean;
};
