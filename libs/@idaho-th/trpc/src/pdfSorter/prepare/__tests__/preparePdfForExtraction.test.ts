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

import { PDF_OUTPUT_MODE } from "~@idaho-th/trpc/pdfSorter/constants";

import { preparePdfForExtraction } from "../preparePdfForExtraction";

const mocks = vi.hoisted(() => ({
  decodePdfFromBase64: vi.fn(),
  getPdfPageCount: vi.fn(),
  sortAndSplitFromBase64: vi.fn(),
  filterToExpectedPages: vi.fn(),
}));

vi.mock("../../pdf/document", () => ({
  decodePdfFromBase64: mocks.decodePdfFromBase64,
}));

vi.mock("../../pdf/mupdfDocument", () => ({
  getPdfPageCount: mocks.getPdfPageCount,
}));

vi.mock("../../sort/sortAndSplitFromBase64", () => ({
  sortAndSplitFromBase64: mocks.sortAndSplitFromBase64,
}));

vi.mock("../../filter/filterToExpectedPages", () => ({
  filterToExpectedPages: mocks.filterToExpectedPages,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.decodePdfFromBase64.mockReturnValue(new Uint8Array([1, 2, 3]));
});

describe("preparePdfForExtraction", () => {
  it("skips junk filtering when the source already has exactly the expected pages", async () => {
    mocks.getPdfPageCount.mockReturnValue(4);
    const pages = new Map([
      [1, "p1"],
      [2, "p2"],
      [3, "p3"],
      [4, "p4"],
    ]);
    mocks.sortAndSplitFromBase64.mockResolvedValue({
      pages,
      combined: "combined-4",
      detectionResults: [],
    });

    const result = await preparePdfForExtraction("pdf-base64", {
      outputMode: PDF_OUTPUT_MODE.BOTH,
      skipCompression: true,
    });

    expect(mocks.sortAndSplitFromBase64).toHaveBeenCalledWith("pdf-base64", {
      totalPages: 4,
      skipCompression: true,
    });
    expect(mocks.filterToExpectedPages).not.toHaveBeenCalled();
    expect(result).toEqual({
      perPageBase64: ["p1", "p2", "p3", "p4"],
      combinedBase64: "combined-4",
      missingPageNumbers: [],
    });
  });

  it("filters extra/junk pages and reports missing page numbers", async () => {
    mocks.getPdfPageCount.mockReturnValue(6);
    mocks.sortAndSplitFromBase64.mockResolvedValue({
      pages: new Map([
        [1, "p1"],
        [2, "p2"],
      ]),
      combined: "combined-unsorted",
      detectionResults: [{ pageNumber: 1 }],
    });
    mocks.filterToExpectedPages.mockResolvedValue({
      pages: new Map([
        [1, "p1"],
        [3, "p3"],
      ]),
      combined: "combined-filtered",
    });

    const result = await preparePdfForExtraction("pdf-base64", {
      outputMode: PDF_OUTPUT_MODE.BOTH,
    });

    expect(mocks.filterToExpectedPages).toHaveBeenCalledWith(
      "combined-unsorted",
      {
        totalPages: 4,
        detectionResults: [{ pageNumber: 1 }],
      },
    );
    expect(result.perPageBase64).toEqual(["p1", undefined, "p3", undefined]);
    expect(result.missingPageNumbers).toEqual([2, 4]);
    expect(result.combinedBase64).toBe("combined-filtered");
  });

  it("returns only combined output when COMBINED mode is requested", async () => {
    mocks.getPdfPageCount.mockReturnValue(4);
    mocks.sortAndSplitFromBase64.mockResolvedValue({
      pages: new Map([
        [1, "p1"],
        [2, "p2"],
        [3, "p3"],
        [4, "p4"],
      ]),
      combined: "combined-only",
      detectionResults: [],
    });

    const result = await preparePdfForExtraction("pdf-base64", {
      outputMode: PDF_OUTPUT_MODE.COMBINED,
    });

    expect(result).toEqual({
      perPageBase64: [],
      combinedBase64: "combined-only",
      missingPageNumbers: [],
    });
  });
});
