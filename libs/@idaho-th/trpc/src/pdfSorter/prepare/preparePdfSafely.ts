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
  DEFAULT_TOTAL_PAGES,
  PDF_OUTPUT_MODE,
  type PdfOutputMode,
} from "../constants";
import {
  runPdfCompressorWorker,
  runPdfSorterWorker,
} from "../worker/pdfSorterPool";
import type { PreparedPdfForExtraction } from "./preparePdfForExtraction";

export interface PreparePdfSafelyOptions {
  outputMode?: PdfOutputMode;
  skipCompression?: boolean;
  /**
   * Forwarded to Piscina's run() as a real cancellation signal (not just a
   * caller-side timeout): aborting it terminates the worker thread actually
   * running this task instead of leaving it to finish unattended.
   */
  signal?: AbortSignal;
}

export async function preparePdfSafely(
  pdfBase64: string,
  options: PreparePdfSafelyOptions = {},
): Promise<PreparedPdfForExtraction> {
  return runPdfSorterWorker(
    pdfBase64,
    {
      totalPages: DEFAULT_TOTAL_PAGES,
      outputMode: options.outputMode ?? PDF_OUTPUT_MODE.COMBINED,
      skipCompression: options.skipCompression,
    },
    options.signal,
  );
}

/**
 * Second-pass compression over an already-ordered combined PDF (see
 * `PreparePdfSafelyOptions.skipCompression`). Runs as its own worker-thread
 * task on the same Piscina pool, so it never blocks the caller from having
 * already handed the uncompressed pages off to Vertex.
 */
export async function compressPreparedPdfSafely(
  combinedBase64: string,
  signal?: AbortSignal,
): Promise<string> {
  return runPdfCompressorWorker(combinedBase64, signal);
}
