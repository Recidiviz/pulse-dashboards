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

import { palette } from "../../../../styles";

const PDF_PAGE_SELECTOR = ".digitized-pdf-page";
const CANVAS_SCALE = 2;
const JPEG_QUALITY = 0.92;

const HTML2CANVAS_OPTS = {
  scale: CANVAS_SCALE,
  useCORS: true,
  logging: false,
  backgroundColor: palette.background.primary,
} as const;

function sanitizeFileNameBase(name: string): string {
  const trimmed = name.replace(/[<>:"/\\|?*]+/g, "_").trim();
  return trimmed.length > 0 ? trimmed : "Housing-Application";
}

export async function generateDigitizedApplicationPdfFile(
  container: HTMLElement,
  clientName: string,
): Promise<File | null> {
  const pages = Array.from(
    container.querySelectorAll<HTMLElement>(PDF_PAGE_SELECTOR),
  );
  if (pages.length === 0) return null;

  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const canvases = await Promise.all(
    pages.map((pageEl) => html2canvas(pageEl, { ...HTML2CANVAS_OPTS })),
  );

  let pdf: InstanceType<typeof jsPDF> | undefined;

  for (let i = 0; i < canvases.length; i += 1) {
    const canvas = canvases[i];
    const w = canvas.width;
    const h = canvas.height;
    const img = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

    if (!pdf) {
      pdf = new jsPDF({
        unit: "px",
        format: [w, h],
        orientation: "portrait",
        hotfixes: ["px_scaling"],
      });
    } else {
      pdf.addPage([w, h], "portrait");
    }

    pdf.addImage(img, "JPEG", 0, 0, w, h, undefined, "FAST");
  }

  if (!pdf) return null;

  const safe = sanitizeFileNameBase(clientName);
  const fileName = `${safe}_digitized-application.pdf`;
  const blob = pdf.output("blob") as Blob;
  return new File([blob], fileName, { type: "application/pdf" });
}
