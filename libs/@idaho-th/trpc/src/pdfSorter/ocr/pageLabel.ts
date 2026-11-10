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

import { FALLBACK_STRATEGY } from "../constants";

/** Matches footer labels like "1 of 4", tolerating common OCR misreads. */
export function buildPageLabelRegex(totalPages: number): RegExp {
  return new RegExp(`([1-${totalPages}])\\s*[oO0][fF]\\s*${totalPages}`);
}

export function isFallbackStrategy(strategy: string | null): boolean {
  return strategy === FALLBACK_STRATEGY;
}

export function isLabelInRange(label: number, totalPages: number): boolean {
  return label >= 1 && label <= totalPages;
}
