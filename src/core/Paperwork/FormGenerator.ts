// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { jsPDF } from "jspdf";

export const PDF_DPI = 72;
export const FORMAT_WIDTH = 8.5 * PDF_DPI;
export const FORMAT_HEIGHT = 11 * PDF_DPI;
export const FORMAT = [FORMAT_WIDTH, FORMAT_HEIGHT];
export const MARGIN = 0.75 * PDF_DPI;

export const generate = (
  element: HTMLElement,
  selector: string
): Promise<jsPDF> => {
  // eslint-disable-next-line new-cap
  const pdf = new jsPDF({
    unit: "px",
    format: FORMAT,
  });

  const pages = Array.from(element.querySelectorAll(selector)) as HTMLElement[];

  if (pages.length > 1) {
    throw Error("More than one page is unsupported");
  }

  const [page] = pages;

  return pdf
    .html(page, {
      margin: MARGIN / 2,
      autoPaging: "text",
    })
    .then(() => {
      const pagesInPdf = pdf.getNumberOfPages();
      // HACK: An additional page may exist due to adding content via html, despite the html fitting within page bounds
      // Remove it to avoid a blank page at the end of the PDF
      if (pagesInPdf > 1) {
        pdf.deletePage(pagesInPdf);
      }

      return pdf;
    });
};
