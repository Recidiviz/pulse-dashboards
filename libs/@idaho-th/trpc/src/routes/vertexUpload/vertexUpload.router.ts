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

import { router, staffProcedure } from "~@idaho-th/trpc/init";
import {
  cancelVertexUploadSchema,
  confirmVertexUploadSchema,
  getVertexUploadScanStatusSchema,
  requestVertexUploadSchema,
} from "~@idaho-th/trpc/routes/vertexUpload/vertexUpload.upload.schema";
import {
  cancelVertexUpload,
  confirmVertexUpload,
  getVertexUploadScanStatus,
  requestVertexUpload,
} from "~@idaho-th/trpc/routes/vertexUpload/vertexUpload.upload.service";

export const vertexUploadRouter = router({
  requestUpload: staffProcedure
    .input(requestVertexUploadSchema)
    .mutation(({ ctx, input }) =>
      requestVertexUpload(ctx.prisma, ctx.staffPseudonymizedId, input),
    ),

  confirmUpload: staffProcedure
    .input(confirmVertexUploadSchema)
    .mutation(({ ctx, input }) =>
      confirmVertexUpload(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.documentId,
      ),
    ),

  getScanStatus: staffProcedure
    .input(getVertexUploadScanStatusSchema)
    .query(({ ctx, input }) =>
      getVertexUploadScanStatus(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.documentId,
      ),
    ),

  cancelUpload: staffProcedure
    .input(cancelVertexUploadSchema)
    .mutation(({ ctx, input }) =>
      cancelVertexUpload(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.applicationId,
      ),
    ),
});
