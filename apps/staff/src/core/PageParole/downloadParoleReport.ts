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

import * as Sentry from "@sentry/react";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

import { REPORT_HEADER_ATTRIBUTE } from "./components/ReportHeader";
import { PAROLE_REPORT_CAPTURE_ID } from "./components/shared";

// Letter page margin, in PostScript points (72 per inch).
const PAGE_MARGIN_PT = 36;

// Guards float comparisons when matching a section boundary to a page edge.
const EPSILON_PX = 0.5;

// html2canvas render scale. Higher is crisper but slower to render and yields a
// larger file; 1.5 keeps text legible while keeping capture time and file size
// down.
const CAPTURE_SCALE = 1.5;

/** A file to include in the report zip alongside the generated PDF. */
export type ParoleReportFile = {
  /** Name the file gets inside the report folder, including its extension. */
  name: string;
  blob: Blob;
};

/** One page's slice of the captured report canvas, in canvas pixels. */
export type ReportPageSlice = {
  startPx: number;
  heightPx: number;
};

/**
 * Splits a captured report of height `totalHeightPx` into page slices that
 * break at section boundaries, so a section that does not fit in the space
 * left on a page moves whole to the next page.
 *
 * `sectionTopsPx` is the offset of each section's top edge from the top of the
 * capture. `totalHeightPx` is the height of all sections together (it includes
 * the height of the last section, which no offset accounts for).
 *
 * For example, three sections of heights [100, 300, 200] give
 * `sectionTopsPx` = [0, 100, 400] (each offset is the sum of the heights above
 * it) and `totalHeightPx` = 600.
 *
 * A page is filled up to the last section boundary that still fits within
 * `maxPageHeightPx`. A single section taller than a full page has no interior
 * boundary to break on, so it is hard-split across pages.
 */
export function computeReportPageSlices({
  sectionTopsPx,
  totalHeightPx,
  maxPageHeightPx,
}: {
  sectionTopsPx: number[];
  totalHeightPx: number;
  maxPageHeightPx: number;
}): ReportPageSlice[] {
  // Boundaries we are allowed to break on: each section top past the start,
  // plus the end of the content.
  const boundaries = [
    ...sectionTopsPx.filter((top) => top > 0),
    totalHeightPx,
  ].sort((a, b) => a - b);

  const slices: ReportPageSlice[] = [];
  let start = 0;
  while (start < totalHeightPx - EPSILON_PX) {
    const maxEnd = start + maxPageHeightPx;

    let end = 0;
    for (const boundary of boundaries) {
      if (boundary > start && boundary <= maxEnd + EPSILON_PX) {
        end = Math.max(end, boundary);
      }
    }

    // No section boundary fits (a section taller than one page): hard-split it.
    if (end <= start) {
      end = Math.min(maxEnd, totalHeightPx);
    }

    slices.push({ startPx: start, heightPx: end - start });
    start = end;
  }

  return slices;
}

/**
 * Renders `reportElement` (as laid out on screen) to a letter-size, multi-page
 * PDF blob. The element is rasterized once with html2canvas, then sliced into
 * pages at section boundaries so sections are not cut across pages.
 */
async function renderReportPdfBlob(reportElement: HTMLElement): Promise<Blob> {
  // Measure sections from the live layout, where the report header is hidden
  // (display:none) and so takes up no space. Exclude the header element itself.
  const containerRect = reportElement.getBoundingClientRect();
  const liveWidthCss = containerRect.width;
  const liveHeightCss = containerRect.height;
  const liveSectionTopsCss = Array.from(reportElement.children)
    .filter((child) => !child.hasAttribute(REPORT_HEADER_ATTRIBUTE))
    .map((child) => child.getBoundingClientRect().top - containerRect.top);

  const canvas = await html2canvas(reportElement, {
    scale: CAPTURE_SCALE,
    backgroundColor: "#ffffff",
    useCORS: true,
    // Reveal the report header only inside the clone html2canvas rasterizes, so
    // it prints without ever showing on screen.
    onclone: (documentClone) => {
      const header = documentClone
        .getElementById(PAROLE_REPORT_CAPTURE_ID)
        ?.querySelector<HTMLElement>(`[${REPORT_HEADER_ATTRIBUTE}]`);
      if (header) {
        header.style.display = "flex";
      }
    },
  });

  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidthPt = pdf.internal.pageSize.getWidth();
  const pageHeightPt = pdf.internal.pageSize.getHeight();
  const contentWidthPt = pageWidthPt - PAGE_MARGIN_PT * 2;
  const contentHeightPt = pageHeightPt - PAGE_MARGIN_PT * 2;

  // Canvas pixels per printed point, and thus one page's content height in
  // canvas pixels.
  const pxPerPt = canvas.width / contentWidthPt;
  const maxPageHeightPx = contentHeightPt * pxPerPt;

  const canvasScale = canvas.width / liveWidthCss;
  // Revealing the header (and the gap after it) makes the captured canvas
  // taller than the header-less live layout; every section shifts down by that
  // difference in the capture.
  const headerOffsetPx = canvas.height - liveHeightCss * canvasScale;
  // Pull each break a few pixels above the section's top edge, into the gap
  // between sections, so the section's top border and any scaling rounding land
  // fully on the next page rather than as a sliver on this one.
  const breakInsetPx = canvasScale * 4;
  const sectionTopsPx = liveSectionTopsCss.map(
    (topCss) => topCss * canvasScale + headerOffsetPx - breakInsetPx,
  );

  const slices = computeReportPageSlices({
    sectionTopsPx,
    totalHeightPx: canvas.height,
    maxPageHeightPx,
  });

  slices.forEach((slice, pageIndex) => {
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = slice.heightPx;
    const context = pageCanvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get a 2d context to slice the report page");
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      canvas,
      0,
      slice.startPx,
      canvas.width,
      slice.heightPx,
      0,
      0,
      canvas.width,
      slice.heightPx,
    );

    if (pageIndex > 0) {
      pdf.addPage();
    }
    pdf.addImage(
      pageCanvas.toDataURL("image/png"),
      "PNG",
      PAGE_MARGIN_PT,
      PAGE_MARGIN_PT,
      contentWidthPt,
      slice.heightPx / pxPerPt,
    );
  });

  return pdf.output("blob");
}

/**
 * Generates a PDF of the parole case-profile report content, bundles it into a
 * zip under a folder named `folderName`, together with any `additionalFiles`
 * (e.g. the SDMF worksheet, once it is available), and prompts the browser to
 * save the zip.
 *
 * Re-throws after reporting to Sentry so the caller can clear its loading
 * state and surface the failure.
 */
export async function downloadParoleReportZip({
  reportElement,
  folderName,
  additionalFiles = [],
}: {
  reportElement: HTMLElement;
  folderName: string;
  additionalFiles?: ParoleReportFile[];
}): Promise<void> {
  try {
    const reportPdf = await renderReportPdfBlob(reportElement);

    const zip = new JSZip();
    const folder = zip.folder(folderName);
    if (!folder) {
      throw new Error(`Could not create zip folder [${folderName}]`);
    }
    folder.file(`${folderName}.pdf`, reportPdf);
    for (const file of additionalFiles) {
      folder.file(file.name, file.blob);
    }

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
    });
    saveAs(zipBlob, `${folderName}.zip`);
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
