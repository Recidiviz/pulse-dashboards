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
import { vertexAI } from "~@idaho-th/trpc/routes/clients/vertexAI";
import { getLogger } from "~@idaho-th/trpc/routes/common/logger";
import { vertexExtractWithVertexAIInputSchema } from "~@idaho-th/trpc/routes/vertex/vertex.extract.schema";
import { extractWithVertexAIFromDocumentService } from "~@idaho-th/trpc/routes/vertex/vertex.fromDocument.extractor";
import { extractWithVertexAIFromDocumentInputSchema } from "~@idaho-th/trpc/routes/vertex/vertex.fromDocument.schema";
import { extractWithVertexAIService } from "~@idaho-th/trpc/routes/vertex/vertex.housing.extractor";

const vertexLogger = getLogger("vertex-ai");

export const vertexRouter = router({
  extractWithVertexAI: staffProcedure
    .input(vertexExtractWithVertexAIInputSchema)
    .mutation(async ({ input, ctx }) => {
      const {
        pdfBase64,
        perPageExtraction,
        includePerPagePartials,
        includeConfidence,
        uploadPreparedPdf,
        fileName,
        pdfOutputMode,
      } = input;

      return extractWithVertexAIService(
        pdfBase64,
        {
          traceId: String(ctx.req.id ?? "unknown"),
          procedureName: "vertex.extractWithVertexAI",
          staffPseudonymizedId: ctx.staffPseudonymizedId,
        },
        { extractor: vertexAI, prisma: ctx.prisma, log: vertexLogger },
        {
          perPageExtraction,
          includePerPagePartials,
          includeConfidence,
          uploadPreparedPdf,
          fileName,
          pdfOutputMode,
        },
      );
    }),

  // Companion to the signed-URL upload flow (vertexUploadRouter): takes a
  // documentId for a PDF that has already been ordered/oriented and
  // scan-gated, and only splits + extracts.
  extractWithVertexAIFromDocument: staffProcedure
    .input(extractWithVertexAIFromDocumentInputSchema)
    .mutation(async ({ input, ctx }) => {
      return extractWithVertexAIFromDocumentService(
        input,
        {
          traceId: String(ctx.req.id ?? "unknown"),
          procedureName: "vertex.extractWithVertexAIFromDocument",
          staffPseudonymizedId: ctx.staffPseudonymizedId,
        },
        { extractor: vertexAI, prisma: ctx.prisma, log: vertexLogger },
      );
    }),
});
