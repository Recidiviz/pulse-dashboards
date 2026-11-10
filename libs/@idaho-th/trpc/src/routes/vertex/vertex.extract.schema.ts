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

import { PDF_OUTPUT_MODE_ZOD_VALUES } from "~@idaho-th/trpc/pdfSorter/constants";
import {
  normalizePdfBase64Input,
  validatePdfBase64Payload,
} from "~@idaho-th/trpc/routes/vertex/vertex.pdfBase64.validator";

export const extractContentInputSchema = z.object({
  pdfBase64: z
    .string()
    .transform((raw) => normalizePdfBase64Input(raw))
    .superRefine((payload, ctx) => {
      const failure = validatePdfBase64Payload(payload);
      if (failure) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: failure.message,
        });
      }
    }),
});

export const pdfOutputModeSchema = z.enum(PDF_OUTPUT_MODE_ZOD_VALUES);

export const preparedPdfForClientSchema = z.object({
  signedUrl: z.string(),
  sizeInBytes: z.number().optional(),
  updatedAt: z.string().optional(),
});

export const vertexExtractWithVertexAIInputSchema =
  extractContentInputSchema.extend({
    perPageExtraction: z.boolean().optional().default(true),
    includePerPagePartials: z.boolean().optional().default(false),
    includeConfidence: z.boolean().optional().default(false),
    uploadPreparedPdf: z.boolean().optional().default(true),
    fileName: z.string().optional(),
    pdfOutputMode: pdfOutputModeSchema.optional(),
  });

export const housingVertexExtractResultSchema = z.object({
  applicationId: z.string(),
  application: z.record(z.string(), z.unknown()),
  preparedPdf: preparedPdfForClientSchema.optional(),
  missingPages: z.array(z.number().int().positive()).optional(),
});
