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

import { isFallbackStrategy } from "../ocr/pageLabel";
import type { BuildLabelMapsResult, DetectResult } from "../types";

function fillMissingLabels(
  labelToPhysical: Map<number, number>,
  physicalToRotation: Map<number, number>,
  results: readonly DetectResult[],
  totalPages: number,
): void {
  const assignedPhysical = new Set(labelToPhysical.values());
  const unassignedPhysical = results
    .filter((result) => !assignedPhysical.has(result.physicalIndex))
    .map((result) => result.physicalIndex);

  const missingLabels = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter((label) => !labelToPhysical.has(label));

  for (const [index, label] of missingLabels.entries()) {
    const physicalIndex = unassignedPhysical[index];
    if (physicalIndex === undefined) break;
    labelToPhysical.set(label, physicalIndex);
    physicalToRotation.set(physicalIndex, 0);
  }
}

export function buildLabelToPhysicalMaps(
  results: readonly DetectResult[],
  totalPages: number,
  pageCount: number,
): BuildLabelMapsResult {
  const labelToPhysical = new Map<number, number>();
  const physicalToRotation = new Map<number, number>();
  const labelViaFallback = new Set<number>();
  const conflicts: string[] = [];

  for (const result of results) {
    physicalToRotation.set(result.physicalIndex, result.rotation);

    const isFallback = isFallbackStrategy(result.strategy);

    if (!labelToPhysical.has(result.label)) {
      labelToPhysical.set(result.label, result.physicalIndex);
      if (isFallback) labelViaFallback.add(result.label);
      continue;
    }

    const existingPhysical = labelToPhysical.get(result.label);
    const existingIsFallback = labelViaFallback.has(result.label);

    if (!isFallback && existingIsFallback && existingPhysical !== undefined) {
      conflicts.push(
        `Label ${result.label}: physical page ${existingPhysical + 1} ` +
          `(fallback) replaced by physical page ${result.physicalIndex + 1} (real OCR).`,
      );
      labelToPhysical.set(result.label, result.physicalIndex);
      labelViaFallback.delete(result.label);
      continue;
    }

    conflicts.push(
      `Label ${result.label}: physical pages ` +
        `${existingPhysical !== undefined ? existingPhysical + 1 : "?"} and ` +
        `${result.physicalIndex + 1} both claim it; keeping first.`,
    );
  }

  if (pageCount <= totalPages) {
    fillMissingLabels(labelToPhysical, physicalToRotation, results, totalPages);
  }

  return {
    labelToPhysical,
    physicalToRotation,
    conflicts,
  };
}
