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
} from "~@idaho-th/trpc/pdfSorter/constants";
import { PdfProcessingError } from "~@idaho-th/trpc/pdfSorter/errors";

const poolMocks = vi.hoisted(() => ({
  runPdfSorterWorker: vi.fn(),
  runPdfCompressorWorker: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/pdfSorter/worker/pdfSorterPool", () => ({
  ...poolMocks,
}));

const { compressPreparedPdfSafely, preparePdfSafely } = await import(
  "~@idaho-th/trpc/pdfSorter/prepare/preparePdfSafely"
);

const PDF_BASE64 = Buffer.from("%PDF-1.7 fake").toString("base64");
const COMBINED_BASE64 = Buffer.from("%PDF-1.7 combined").toString("base64");

function prepared(overrides = {}) {
  return {
    perPageBase64: [COMBINED_BASE64],
    combinedBase64: COMBINED_BASE64,
    missingPageNumbers: [],
    ...overrides,
  };
}

beforeEach(() => {
  poolMocks.runPdfSorterWorker.mockResolvedValue(prepared());
  poolMocks.runPdfCompressorWorker.mockResolvedValue(COMBINED_BASE64);
});

describe("preparePdfSafely", () => {
  it("asks the worker for a combined PDF by default", async () => {
    await preparePdfSafely(PDF_BASE64);

    expect(poolMocks.runPdfSorterWorker).toHaveBeenCalledWith(
      PDF_BASE64,
      {
        totalPages: DEFAULT_TOTAL_PAGES,
        outputMode: PDF_OUTPUT_MODE.COMBINED,
        skipCompression: undefined,
      },
      undefined,
    );
  });

  it.each([
    PDF_OUTPUT_MODE.PER_PAGE,
    PDF_OUTPUT_MODE.COMBINED,
    PDF_OUTPUT_MODE.BOTH,
  ])("forwards the %s output mode", async (outputMode) => {
    await preparePdfSafely(PDF_BASE64, { outputMode });

    expect(poolMocks.runPdfSorterWorker.mock.calls[0]?.[1]).toMatchObject({
      outputMode,
    });
  });

  it("forwards skipCompression and the abort signal", async () => {
    const controller = new AbortController();

    await preparePdfSafely(PDF_BASE64, {
      skipCompression: true,
      signal: controller.signal,
    });

    const [, options, signal] =
      poolMocks.runPdfSorterWorker.mock.calls[0] ?? [];
    expect(options).toMatchObject({ skipCompression: true });
    // A real cancellation signal, so aborting terminates the worker thread.
    expect(signal).toBe(controller.signal);
  });

  it("propagates a worker failure unchanged", async () => {
    const failure = new PdfProcessingError("page 3 unreadable");
    poolMocks.runPdfSorterWorker.mockRejectedValue(failure);

    await expect(preparePdfSafely(PDF_BASE64)).rejects.toBe(failure);
  });
});

describe("compressPreparedPdfSafely", () => {
  it("hands the combined PDF to the compressor task", async () => {
    const controller = new AbortController();

    await expect(
      compressPreparedPdfSafely(COMBINED_BASE64, controller.signal),
    ).resolves.toBe(COMBINED_BASE64);
    expect(poolMocks.runPdfCompressorWorker).toHaveBeenCalledWith(
      COMBINED_BASE64,
      controller.signal,
    );
  });
});
