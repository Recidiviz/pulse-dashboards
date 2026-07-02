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

import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { downloadSARPdf } from "./downloadSARPdf";
import type { SAR } from "./SARPdfTemplate.types";

// Isolate the helper: stub the template (avoids pulling the react-pdf render
// tree + font registration), and the `pdf`/`saveAs` side effects.
vi.mock("./SARPdfTemplate", () => ({ SARPdfTemplate: () => null }));
vi.mock("@react-pdf/renderer", () => ({ pdf: vi.fn() }));
vi.mock("file-saver", () => ({ saveAs: vi.fn() }));

const mockPdf = vi.mocked(pdf);
const mockSaveAs = vi.mocked(saveAs);

describe("downloadSARPdf", () => {
  const blob = new Blob(["%PDF-1.4"], { type: "application/pdf" });

  beforeEach(() => {
    vi.clearAllMocks();
    // `pdf(<doc/>)` returns an instance with a `toBlob()` promise.
    mockPdf.mockReturnValue({
      toBlob: vi.fn().mockResolvedValue(blob),
    } as unknown as ReturnType<typeof pdf>);
  });

  it("renders the template to a blob and saves it with the default filename", async () => {
    const sar = { client: { fullName: "JANE A DOE" } } as unknown as SAR;

    await downloadSARPdf(sar, {});

    expect(mockPdf).toHaveBeenCalledTimes(1);
    expect(mockSaveAs).toHaveBeenCalledWith(
      blob,
      "Sentencing Assessment Report - JANE A DOE.pdf",
    );
  });

  it("falls back to an empty name when the client has none", async () => {
    const sar = { client: null } as unknown as SAR;
    await downloadSARPdf(sar, {});
    expect(mockSaveAs).toHaveBeenCalledWith(
      blob,
      "Sentencing Assessment Report - .pdf",
    );
  });

  it("honors an explicit filename (appending .pdf)", async () => {
    const sar = { client: { fullName: "X" } } as unknown as SAR;
    await downloadSARPdf(sar, {}, null, "Custom Report Name");
    expect(mockSaveAs).toHaveBeenCalledWith(blob, "Custom Report Name.pdf");
  });
});
