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

import { PDFDocument, StandardFonts } from "pdf-lib";

import {
  DEFAULT_TOTAL_PAGES,
  MAX_ORDERING_PAGE_COUNT,
} from "~@idaho-th/trpc/pdfSorter/constants";
import { PdfProcessingError } from "~@idaho-th/trpc/pdfSorter/errors";

/**
 * Only the OCR boundary is stubbed. mupdf runs for real, so this drives
 * rasterize -> detect -> label maps -> save end to end and would catch a page
 * landing in the wrong slot — which the mocked suite in prepare/ cannot.
 *
 * The pipeline shells out to the `tesseract` binary once per page per strategy;
 * under a full test run that many real processes is what got the worker-pool
 * integration test skipped. A module-level stub removes that entirely.
 */
const ocrMocks = vi.hoisted(() => ({
  runTesseractOcr: vi.fn(),
  checkTesseractAvailable: vi.fn().mockResolvedValue(true),
}));

vi.mock("~@idaho-th/trpc/pdfSorter/ocr/tesseract", () => ({ ...ocrMocks }));

const { loadMupdf } = await import("~@idaho-th/trpc/pdfSorter/mupdf");
const { sortAndSplitFromBase64 } = await import(
  "~@idaho-th/trpc/pdfSorter/sort/sortAndSplitFromBase64"
);
const { filterToExpectedPages } = await import(
  "~@idaho-th/trpc/pdfSorter/filter/filterToExpectedPages"
);
const { getPdfPageCount } = await import(
  "~@idaho-th/trpc/pdfSorter/pdf/mupdfDocument"
);
const { decodePdfFromBase64 } = await import(
  "~@idaho-th/trpc/pdfSorter/pdf/document"
);

/**
 * A PDF whose pages are labelled in the given order, so a physical page's
 * identity is recoverable from the ordered output.
 */
async function buildLabelledPdf(labels: readonly number[]): Promise<string> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const label of labels) {
    const page = doc.addPage([612, 792]);
    page.drawText(`Page ${label} of ${labels.length}`, {
      x: 60,
      y: 60,
      size: 24,
      font,
    });
  }
  return Buffer.from(await doc.save()).toString("base64");
}

/** Answers OCR with "<label> of <total>" for the pages named, in call order. */
function stubOcrLabels(labels: readonly (number | null)[], totalPages: number) {
  // detectPage tries several crop/rotation strategies per page and stops at the
  // first match, so one answer per page is enough.
  let call = 0;
  ocrMocks.runTesseractOcr.mockImplementation(async () => {
    const label = labels[call] ?? null;
    call += 1;
    return label === null ? "no label here" : `${label} of ${totalPages}`;
  });
}

beforeAll(async () => {
  await loadMupdf();
});

beforeEach(() => {
  ocrMocks.checkTesseractAvailable.mockResolvedValue(true);
});

describe("sortAndSplitFromBase64", () => {
  it("returns one page per label plus a combined PDF", async () => {
    const pdfBase64 = await buildLabelledPdf([1, 2, 3, 4]);
    stubOcrLabels([1, 2, 3, 4], DEFAULT_TOTAL_PAGES);

    const result = await sortAndSplitFromBase64(pdfBase64);

    expect([...result.pages.keys()]).toEqual([1, 2, 3, 4]);
    expect(getPdfPageCount(decodePdfFromBase64(result.combined))).toBe(4);
    expect(result.metadata.totalPages).toBe(DEFAULT_TOTAL_PAGES);
    expect(result.metadata.totalOcrCalls).toBe(4);
  });

  it("reorders a shuffled document into label order", async () => {
    const pdfBase64 = await buildLabelledPdf([3, 1, 4, 2]);
    stubOcrLabels([3, 1, 4, 2], DEFAULT_TOTAL_PAGES);

    const result = await sortAndSplitFromBase64(pdfBase64);

    // Label 1 was physically second, label 3 physically first.
    expect(
      result.detectionResults.map(({ physicalIndex, label }) => [
        physicalIndex,
        label,
      ]),
    ).toEqual([
      [0, 3],
      [1, 1],
      [2, 4],
      [3, 2],
    ]);
    expect([...result.pages.keys()]).toEqual([1, 2, 3, 4]);
  });

  it("records the rotation a 180-degree strategy resolved", async () => {
    const pdfBase64 = await buildLabelledPdf([1]);
    // The first strategy is rot0; failing it forces the rot180 attempt.
    ocrMocks.runTesseractOcr
      .mockResolvedValueOnce("nothing legible")
      .mockResolvedValue("1 of 4");

    const result = await sortAndSplitFromBase64(pdfBase64);

    expect(result.detectionResults[0]?.rotation).toBe(180);
    expect(result.detectionResults[0]?.ocrCalls).toBeGreaterThan(1);
  });

  it("falls back to physical order when OCR reads nothing", async () => {
    const pdfBase64 = await buildLabelledPdf([1, 2]);
    ocrMocks.runTesseractOcr.mockResolvedValue("illegible scan");

    const result = await sortAndSplitFromBase64(pdfBase64);

    expect(
      result.detectionResults.map(({ physicalIndex, label, strategy }) => ({
        physicalIndex,
        label,
        strategy,
      })),
    ).toEqual([
      { physicalIndex: 0, label: 1, strategy: "FALLBACK (physical order)" },
      { physicalIndex: 1, label: 2, strategy: "FALLBACK (physical order)" },
    ]);
    expect([...result.pages.keys()]).toEqual([1, 2]);
  });

  it("keeps the pages it could label when the document is short", async () => {
    const pdfBase64 = await buildLabelledPdf([2, 4]);
    stubOcrLabels([2, 4], DEFAULT_TOTAL_PAGES);

    const result = await sortAndSplitFromBase64(pdfBase64);

    // Two physical pages, so only two labels can be filled.
    expect([...result.pages.keys()]).toEqual([2, 4]);
    expect(getPdfPageCount(decodePdfFromBase64(result.combined))).toBe(2);
  });

  it("honours an explicit totalPages", async () => {
    const pdfBase64 = await buildLabelledPdf([1, 2]);
    stubOcrLabels([1, 2], 2);

    const result = await sortAndSplitFromBase64(pdfBase64, { totalPages: 2 });

    expect(result.metadata.totalPages).toBe(2);
    expect([...result.pages.keys()]).toEqual([1, 2]);
  });

  it("refuses a document longer than the ordering limit", async () => {
    const pdfBase64 = await buildLabelledPdf(
      Array.from({ length: MAX_ORDERING_PAGE_COUNT + 1 }, (_, i) => i + 1),
    );

    const error = await sortAndSplitFromBase64(pdfBase64).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(PdfProcessingError);
    expect(error).toMatchObject({ userCaused: true });
    // The page limit is checked before any rasterizing or OCR.
    expect(ocrMocks.runTesseractOcr).not.toHaveBeenCalled();
  });

  it("rejects a payload that is not a PDF", async () => {
    await expect(
      sortAndSplitFromBase64(Buffer.from("not a pdf").toString("base64")),
    ).rejects.toThrow();
  });

  it("still produces pages with compression skipped", async () => {
    const pdfBase64 = await buildLabelledPdf([1, 2]);
    stubOcrLabels([1, 2], DEFAULT_TOTAL_PAGES);

    const result = await sortAndSplitFromBase64(pdfBase64, {
      skipCompression: true,
    });

    expect([...result.pages.keys()]).toEqual([1, 2]);
  });
});

describe("filterToExpectedPages", () => {
  it("keeps only the labelled pages, in label order", async () => {
    const pdfBase64 = await buildLabelledPdf([1, 2, 3, 4]);
    stubOcrLabels([1, 2, 3, 4], DEFAULT_TOTAL_PAGES);

    const result = await filterToExpectedPages(pdfBase64, {
      totalPages: DEFAULT_TOTAL_PAGES,
    });

    expect([...result.pages.keys()]).toEqual([1, 2, 3, 4]);
    expect(result.metadata.totalOcrCalls).toBe(4);
    expect(getPdfPageCount(decodePdfFromBase64(result.combined))).toBe(4);
  });

  it("drops a page whose label OCR could not read", async () => {
    const pdfBase64 = await buildLabelledPdf([1, 2, 3]);
    stubOcrLabels([1, null, 3], DEFAULT_TOTAL_PAGES);

    const result = await filterToExpectedPages(pdfBase64, {
      totalPages: DEFAULT_TOTAL_PAGES,
    });

    // An unlabelled page is not part of the form, so it must not be kept.
    expect([...result.pages.keys()]).toEqual([1, 3]);
    expect(getPdfPageCount(decodePdfFromBase64(result.combined))).toBe(2);
  });

  it("keeps the first page claiming a duplicated label", async () => {
    const pdfBase64 = await buildLabelledPdf([2, 2]);
    stubOcrLabels([2, 2], DEFAULT_TOTAL_PAGES);

    const result = await filterToExpectedPages(pdfBase64, {
      totalPages: DEFAULT_TOTAL_PAGES,
    });

    expect([...result.pages.keys()]).toEqual([2]);
    expect(result.metadata.detections).toEqual([
      {
        physicalIndex: 0,
        label: 2,
        rotation: 0,
        strategy: "filter-pass",
        ocrCalls: 0,
      },
    ]);
  });

  it("reuses supplied detections instead of running OCR again", async () => {
    const pdfBase64 = await buildLabelledPdf([1, 2]);
    stubOcrLabels([1, 2], DEFAULT_TOTAL_PAGES);
    const sorted = await sortAndSplitFromBase64(pdfBase64);
    ocrMocks.runTesseractOcr.mockClear();

    const result = await filterToExpectedPages(sorted.combined, {
      totalPages: DEFAULT_TOTAL_PAGES,
      detectionResults: sorted.detectionResults,
    });

    expect(ocrMocks.runTesseractOcr).not.toHaveBeenCalled();
    expect(result.metadata.totalOcrCalls).toBe(0);
    expect([...result.pages.keys()]).toEqual([1, 2]);
  });

  it("returns an empty result when nothing carries a label", async () => {
    const pdfBase64 = await buildLabelledPdf([1, 2]);
    ocrMocks.runTesseractOcr.mockResolvedValue("illegible");

    const result = await filterToExpectedPages(pdfBase64, {
      totalPages: DEFAULT_TOTAL_PAGES,
    });

    expect(result.pages.size).toBe(0);
    expect(getPdfPageCount(decodePdfFromBase64(result.combined))).toBe(0);
  });
});
