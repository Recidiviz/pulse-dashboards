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
import React from "react";

import { SARPdfTemplate } from "./SARPdfTemplate";
import type { SAR, SARInsight } from "./SARPdfTemplate.types";

/** Default download filename (no extension); matches the SAR Summary page. */
const defaultFileName = (sar: SAR): string =>
  `Sentencing Assessment Report - ${sar.client?.fullName ?? ""}`;

/**
 * Renders the react-pdf SAR template to a PDF blob and triggers a browser
 * download. Single source of truth for "turn a SAR (+ insight) into a saved
 * PDF" so every entry point — the SAR Summary page and the client Full Profile
 * — produces an identical document. `fileName` is the base name; ".pdf" is
 * appended here.
 */
export async function downloadSARPdf(
  sar: SAR,
  insight?: SARInsight | null,
  fileName: string = defaultFileName(sar),
): Promise<void> {
  const blob = await pdf(
    <SARPdfTemplate sar={sar} insight={insight ?? null} />,
  ).toBlob();
  saveAs(blob, `${fileName}.pdf`);
}
