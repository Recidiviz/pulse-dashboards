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

import { generateDigitizedApplicationPdfFile } from "../generateDigitizedApplicationPdf";

const html2canvasMock = vi.hoisted(() => vi.fn());
const jsPdfCtor = vi.hoisted(() =>
  vi.fn(() => ({
    addPage: vi.fn(),
    addImage: vi.fn(),
    output: vi.fn(() => new Blob(["pdf"])),
  })),
);

vi.mock("html2canvas", () => ({
  default: html2canvasMock,
}));

vi.mock("jspdf", () => ({
  default: jsPdfCtor,
}));

function makeContainer(pageCount: number) {
  const container = document.createElement("div");
  container.innerHTML = Array.from(
    { length: pageCount },
    () => '<div class="digitized-pdf-page"></div>',
  ).join("");
  return container;
}

describe("generateDigitizedApplicationPdfFile", () => {
  beforeEach(() => {
    html2canvasMock.mockReset();
    jsPdfCtor.mockClear();
    jsPdfCtor.mockImplementation(() => ({
      addPage: vi.fn(),
      addImage: vi.fn(),
      output: vi.fn(() => new Blob(["pdf"])),
    }));
    html2canvasMock.mockResolvedValue({
      width: 100,
      height: 200,
      toDataURL: () => "data:image/jpeg;base64,abc",
    });
  });

  it("names the file with clientName_digitized-application.pdf", async () => {
    const file = await generateDigitizedApplicationPdfFile(
      makeContainer(2),
      "Jane Doe",
    );

    expect(file?.name).toBe("Jane Doe_digitized-application.pdf");
  });

  it("sanitizes unsafe characters in the filename", async () => {
    const file = await generateDigitizedApplicationPdfFile(
      makeContainer(1),
      'bad<>:"/\\|?*name',
    );

    expect(file?.name).toBe("bad_name_digitized-application.pdf");
  });

  it("falls back when the client name is blank", async () => {
    const file = await generateDigitizedApplicationPdfFile(
      makeContainer(1),
      "   ",
    );

    expect(file?.name).toBe("Housing-Application_digitized-application.pdf");
  });

  it("returns null when the container has no PDF pages", async () => {
    await expect(
      generateDigitizedApplicationPdfFile(makeContainer(0), "Jane Doe"),
    ).resolves.toBeNull();
  });
});
