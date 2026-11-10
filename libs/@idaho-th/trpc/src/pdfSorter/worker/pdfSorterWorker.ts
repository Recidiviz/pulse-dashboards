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

import { loadMupdf } from "../mupdf";
import { compressOrderedPdf } from "../pdf/compress";
import {
  type PreparedPdfForExtraction,
  preparePdfForExtraction,
  type PreparePdfForExtractionOptions,
} from "../prepare/preparePdfForExtraction";

// Piscina task entry point, run in an isolated worker thread. Takes only
// plain, serializable PDF bytes and options — no env, config, Prisma, or GCS
// access belongs here. All of that stays with the caller in the main thread.
export interface PdfSorterPrepareInput {
  task?: "prepare";
  pdfBase64: string;
  options?: PreparePdfForExtractionOptions;
}

export interface PdfSorterCompressInput {
  task: "compress";
  combinedBase64: string;
}

export type PdfSorterWorkerInput =
  | PdfSorterPrepareInput
  | PdfSorterCompressInput;

export default async function pdfSorterWorker(
  input: PdfSorterWorkerInput,
): Promise<PreparedPdfForExtraction | string> {
  // Idempotent: loadMupdf() is a no-op after the first call for this worker
  // thread's lifetime.
  await loadMupdf();

  if (input.task === "compress") {
    return compressOrderedPdf(input.combinedBase64);
  }
  return preparePdfForExtraction(input.pdfBase64, input.options);
}
