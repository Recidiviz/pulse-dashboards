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

import type { MuPdfPage } from "../mupdf.types";

type PdfPage = MuPdfPage;

export function getPageRotationDegrees(page: PdfPage): number {
  const pageObject = page.getObject();
  const rotateField = pageObject.get("Rotate");
  if (rotateField && !rotateField.isNull() && rotateField.isNumber()) {
    return rotateField.asNumber();
  }
  return 0;
}

/** Applies rotation in-place on the shared document before grafting pages. */
export function applyPageRotation(
  page: PdfPage,
  rotationDegrees: number,
): void {
  if (rotationDegrees === 0) return;

  const pageObject = page.getObject();
  const current = getPageRotationDegrees(page);
  pageObject.put("Rotate", (current + rotationDegrees) % 360);
}
