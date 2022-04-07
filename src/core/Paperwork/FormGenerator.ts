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

export const DIMENSIONS_IN = {
  HEIGHT: 11,
  WIDTH: 8.5,
  MARGIN: 0.75,
};

export const DIMENSIONS_PX = {
  HEIGHT: DIMENSIONS_IN.HEIGHT * PDF_DPI,
  WIDTH: DIMENSIONS_IN.WIDTH * PDF_DPI,
  MARGIN: DIMENSIONS_IN.MARGIN * PDF_DPI,
};

export const generate = (
  element: HTMLElement,
  selector: string
): Promise<jsPDF> => {
  const pages = Array.from(element.querySelectorAll(selector)) as HTMLElement[];

  if (pages.length > 1) {
    throw Error("More than one page is unsupported");
  }

  const [page] = pages;

  // eslint-disable-next-line new-cap
  const pdf = new jsPDF({
    unit: "in",
    format: [DIMENSIONS_IN.WIDTH, DIMENSIONS_IN.HEIGHT],
  });

  // Some Chrome extensions will inject a background image, which breaks html2canvas
  // Remove the background image when printing
  Array.from(page.querySelectorAll("input")).forEach((input) => {
    // eslint-disable-next-line no-param-reassign
    input.style.backgroundImage = "";
  });

  const pdfContentAreaWidth = DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN;
  const currentPageWidth = page.offsetWidth;

  // The `page` element is assumed to be rendered at 8.5in x 11in. Pinch to zoom alters these inherent dimensions.
  // This causes the PDF contents to overflow the page boundaries, as a result, we scale the canvas proportionally
  const currentViewportScale = pdfContentAreaWidth / currentPageWidth;

  return pdf
    .html(page, {
      margin: DIMENSIONS_IN.MARGIN / 2,
      autoPaging: "text",
      html2canvas: {
        scale: currentViewportScale / PDF_DPI,
      },
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
