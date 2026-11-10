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

import { isFallbackStrategy, isLabelInRange } from "../ocr/pageLabel";
import type { DetectResult, KeptPagesSelection } from "../types";

export function selectKeptPagesFromDetections(
  detectionResults: readonly DetectResult[],
  totalPages: number,
): KeptPagesSelection {
  const labelToOrientedIndex = new Map<number, number>();
  const discardedOrientedIndices: number[] = [];

  for (const result of detectionResults) {
    const hasRealLabel =
      !isFallbackStrategy(result.strategy) &&
      isLabelInRange(result.label, totalPages);

    if (!hasRealLabel) continue;

    const orientedIndex = result.label - 1;

    if (labelToOrientedIndex.has(result.label)) {
      discardedOrientedIndices.push(orientedIndex);
      continue;
    }

    labelToOrientedIndex.set(result.label, orientedIndex);
  }

  return { labelToOrientedIndex, discardedOrientedIndices };
}
