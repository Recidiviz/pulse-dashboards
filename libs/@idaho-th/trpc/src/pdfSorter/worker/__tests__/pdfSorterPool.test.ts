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

import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { PDF_OUTPUT_MODE } from "~@idaho-th/trpc/pdfSorter/constants";
import { runPdfSorterWorker } from "~@idaho-th/trpc/pdfSorter/worker/pdfSorterPool";

async function buildBlankPdfBase64(pageCount: number): Promise<string> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([612, 792]);
  }
  const bytes = await doc.save();
  return Buffer.from(bytes).toString("base64");
}

describe("runPdfSorterWorker", () => {
  // Skipped: this exercises the real pipeline end-to-end, which spawns the
  // actual `tesseract` binary for page-label OCR (even on blank pages). Under
  // the concurrency of a full test run that occasionally fails with
  // `spawn tesseract ENOENT`, since forking that many real OS processes at
  // once exhausts resources. Re-enable once OCR can be swapped for a
  // deterministic stub without touching production code.
  it.skip("runs the mupdf pipeline inside the worker thread and returns a prepared PDF", async () => {
    const pdfBase64 = await buildBlankPdfBase64(4);

    const result = await runPdfSorterWorker(pdfBase64, {
      outputMode: PDF_OUTPUT_MODE.COMBINED,
    });

    expect(result.combinedBase64).toBeDefined();
    expect(typeof result.combinedBase64).toBe("string");
  }, 30000);
});
