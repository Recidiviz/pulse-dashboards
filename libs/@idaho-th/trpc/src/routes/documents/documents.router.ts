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
  providerProcedure,
  router,
  staffProcedure,
} from "~@idaho-th/trpc/init";
import {
  providerUploader,
  staffUploader,
} from "~@idaho-th/trpc/routes/documents/documents.helpers";
import {
  confirmDocumentUploadSchema,
  deleteDocumentSchema,
  getDocumentDownloadUrlSchema,
  getDocumentScanStatusSchema,
  listDocumentsSchema,
  requestDocumentUploadSchema,
} from "~@idaho-th/trpc/routes/documents/documents.schema";
import {
  confirmDocumentUpload,
  deleteDocument,
  getProviderDocumentDownload,
  getProviderDocumentScanStatus,
  getStaffDocumentDownload,
  getStaffDocumentPreview,
  getStaffDocumentScanStatus,
  listProviderDocuments,
  listStaffDocuments,
  requestDigitizedDocumentUploadForStaff,
  requestDocumentUpload,
} from "~@idaho-th/trpc/routes/documents/documents.service";

export const documentsRouter = router({
  listForStaff: staffProcedure
    .input(listDocumentsSchema)
    .query(({ ctx, input }) =>
      listStaffDocuments(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.applicationId,
      ),
    ),

  listForProvider: providerProcedure
    .input(listDocumentsSchema)
    .query(({ ctx, input }) =>
      listProviderDocuments(
        ctx.prisma,
        providerUploader(ctx.providerId, ctx.providerPseudonymizedId),
        input.applicationId,
      ),
    ),

  requestUploadForStaff: staffProcedure
    .input(requestDocumentUploadSchema)
    .mutation(({ ctx, input }) =>
      requestDocumentUpload(
        ctx.prisma,
        staffUploader(ctx.staffPseudonymizedId),
        input,
      ),
    ),

  requestUploadForProvider: providerProcedure
    .input(requestDocumentUploadSchema)
    .mutation(({ ctx, input }) =>
      requestDocumentUpload(
        ctx.prisma,
        providerUploader(ctx.providerId, ctx.providerPseudonymizedId),
        input,
      ),
    ),

  confirmUploadForStaff: staffProcedure
    .input(confirmDocumentUploadSchema)
    .mutation(({ ctx, input }) =>
      confirmDocumentUpload(
        ctx.prisma,
        staffUploader(ctx.staffPseudonymizedId),
        input.documentId,
      ),
    ),

  confirmUploadForProvider: providerProcedure
    .input(confirmDocumentUploadSchema)
    .mutation(({ ctx, input }) =>
      confirmDocumentUpload(
        ctx.prisma,
        providerUploader(ctx.providerId, ctx.providerPseudonymizedId),
        input.documentId,
      ),
    ),

  getDownloadUrlForStaff: staffProcedure
    .input(getDocumentDownloadUrlSchema)
    .mutation(({ ctx, input }) =>
      getStaffDocumentDownload(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.documentId,
      ),
    ),

  getDownloadUrlForProvider: providerProcedure
    .input(getDocumentDownloadUrlSchema)
    .mutation(({ ctx, input }) =>
      getProviderDocumentDownload(
        ctx.prisma,
        providerUploader(ctx.providerId, ctx.providerPseudonymizedId),
        input.documentId,
      ),
    ),

  getPreviewUrlForStaff: staffProcedure
    .input(getDocumentDownloadUrlSchema)
    .mutation(({ ctx, input }) =>
      getStaffDocumentPreview(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.documentId,
      ),
    ),

  getScanStatusForStaff: staffProcedure
    .input(getDocumentScanStatusSchema)
    .query(({ ctx, input }) =>
      getStaffDocumentScanStatus(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.documentId,
      ),
    ),

  getScanStatusForProvider: providerProcedure
    .input(getDocumentScanStatusSchema)
    .query(({ ctx, input }) =>
      getProviderDocumentScanStatus(
        ctx.prisma,
        providerUploader(ctx.providerId, ctx.providerPseudonymizedId),
        input.documentId,
      ),
    ),

  deleteForStaff: staffProcedure
    .input(deleteDocumentSchema)
    .mutation(({ ctx, input }) =>
      deleteDocument(
        ctx.prisma,
        staffUploader(ctx.staffPseudonymizedId),
        input.documentId,
      ),
    ),

  deleteForProvider: providerProcedure
    .input(deleteDocumentSchema)
    .mutation(({ ctx, input }) =>
      deleteDocument(
        ctx.prisma,
        providerUploader(ctx.providerId, ctx.providerPseudonymizedId),
        input.documentId,
      ),
    ),

  requestDigitizedUploadForStaff: staffProcedure
    .input(requestDocumentUploadSchema)
    .mutation(({ ctx, input }) =>
      requestDigitizedDocumentUploadForStaff(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input,
      ),
    ),
});
