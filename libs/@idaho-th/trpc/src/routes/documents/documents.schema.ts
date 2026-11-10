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

import { z } from "zod";

import { HousingApplicationDocumentScanStatus } from "~@idaho-th/prisma/client";

// Derived from the Prisma enum (minus PENDING, which only the initial upload
// sets) so a future scan-status variant fails typecheck here instead of being
// silently accepted as an unhandled string.
const scanVerdicts = Object.values(HousingApplicationDocumentScanStatus).filter(
  (status) => status !== HousingApplicationDocumentScanStatus.PENDING,
) as [
  Exclude<HousingApplicationDocumentScanStatus, "PENDING">,
  ...Exclude<HousingApplicationDocumentScanStatus, "PENDING">[],
];

export const listDocumentsSchema = z.object({
  applicationId: z.string().uuid(),
});

// documentType is intentionally not client-settable here: HANDWRITTEN_SOURCE
// is created by the internal AI-extraction pipeline (staffPdfUpload.service.ts,
// vertexUpload.upload.service.ts, draftIntake.service.ts,
// duplicateApplication.helpers.ts), and DIGITIZED by
// requestDigitizedDocumentUploadForStaff right after intake. Both are blocked
// from deletion by findOwnDeletableDocument. Accepting either value from this
// generic upload endpoint let any staff or provider caller create an
// undeletable document row that still counted against their daily upload
// quota (see #15219/#15293). The service layer always creates documents from
// this endpoint as ATTACHMENT.
export const requestDocumentUploadSchema = z.object({
  applicationId: z.string().uuid(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

export const confirmDocumentUploadSchema = z.object({
  documentId: z.string().uuid(),
});

export const getDocumentDownloadUrlSchema = z.object({
  documentId: z.string().uuid(),
});

export const getDocumentScanStatusSchema = z.object({
  documentId: z.string().uuid(),
});

export const deleteDocumentSchema = z.object({
  documentId: z.string().uuid(),
});

// Webhook ingress: accepts any non-empty GCS object name. Key shape rules
// for newly created objects are enforced in the object-key builders.
export const documentScanResultBodySchema = z.object({
  bucketName: z.string().trim().min(1),
  objectKey: z.string().trim().min(1),
  verdict: z.enum(scanVerdicts),
});
