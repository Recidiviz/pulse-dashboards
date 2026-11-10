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

import { FALLBACK_STRATEGY } from "~@idaho-th/trpc/pdfSorter/constants";
import { buildLabelToPhysicalMaps } from "~@idaho-th/trpc/pdfSorter/detection/buildLabelMaps";
import type { DetectResult } from "~@idaho-th/trpc/pdfSorter/types";

const TOTAL_PAGES = 4;

function detection(overrides: Partial<DetectResult> = {}): DetectResult {
  return {
    physicalIndex: 0,
    label: 1,
    rotation: 0,
    strategy: "ocr",
    ocrCalls: 1,
    log: [],
    ...overrides,
  };
}

/** Detections for a document already in label order. */
function orderedDetections(count = TOTAL_PAGES): DetectResult[] {
  return Array.from({ length: count }, (_, index) =>
    detection({ physicalIndex: index, label: index + 1 }),
  );
}

describe("buildLabelToPhysicalMaps", () => {
  it("maps each label to its physical page and records its rotation", () => {
    const result = buildLabelToPhysicalMaps(
      [
        detection({ physicalIndex: 0, label: 2, rotation: 180 }),
        detection({ physicalIndex: 1, label: 1 }),
      ],
      2,
      2,
    );

    expect([...result.labelToPhysical]).toEqual([
      [2, 0],
      [1, 1],
    ]);
    expect([...result.physicalToRotation]).toEqual([
      [0, 180],
      [1, 0],
    ]);
    expect(result.conflicts).toEqual([]);
  });

  it("keeps the first claim when two real detections collide", () => {
    const result = buildLabelToPhysicalMaps(
      [
        detection({ physicalIndex: 0, label: 1 }),
        detection({ physicalIndex: 1, label: 1 }),
      ],
      TOTAL_PAGES,
      2,
    );

    expect(result.labelToPhysical.get(1)).toBe(0);
    expect(result.conflicts).toEqual([
      "Label 1: physical pages 1 and 2 both claim it; keeping first.",
    ]);
  });

  it("lets a real OCR result displace a fallback claim", () => {
    const result = buildLabelToPhysicalMaps(
      [
        detection({ physicalIndex: 0, label: 1, strategy: FALLBACK_STRATEGY }),
        detection({ physicalIndex: 1, label: 1, strategy: "ocr" }),
      ],
      TOTAL_PAGES,
      2,
    );

    // A guessed page must never outrank a page the OCR actually read.
    expect(result.labelToPhysical.get(1)).toBe(1);
    expect(result.conflicts).toEqual([
      "Label 1: physical page 1 (fallback) replaced by physical page 2 (real OCR).",
    ]);
  });

  it("does not let a fallback displace a real OCR claim", () => {
    const result = buildLabelToPhysicalMaps(
      [
        detection({ physicalIndex: 0, label: 1, strategy: "ocr" }),
        detection({ physicalIndex: 1, label: 1, strategy: FALLBACK_STRATEGY }),
      ],
      TOTAL_PAGES,
      2,
    );

    expect(result.labelToPhysical.get(1)).toBe(0);
    expect(result.conflicts).toHaveLength(1);
  });

  it("does not let one fallback displace another", () => {
    const result = buildLabelToPhysicalMaps(
      [
        detection({ physicalIndex: 0, label: 1, strategy: FALLBACK_STRATEGY }),
        detection({ physicalIndex: 1, label: 1, strategy: FALLBACK_STRATEGY }),
      ],
      TOTAL_PAGES,
      2,
    );

    expect(result.labelToPhysical.get(1)).toBe(0);
    expect(result.conflicts).toHaveLength(1);
  });

  it("assigns leftover physical pages to the labels nobody claimed", () => {
    // Pages 1 and 3 were read; pages 2 and 4 fall to the unclaimed physicals.
    const result = buildLabelToPhysicalMaps(
      [
        detection({ physicalIndex: 0, label: 1 }),
        detection({ physicalIndex: 1, label: 3 }),
        detection({ physicalIndex: 2, label: 3 }),
        detection({ physicalIndex: 3, label: 1 }),
      ],
      TOTAL_PAGES,
      TOTAL_PAGES,
    );

    expect(result.labelToPhysical.get(1)).toBe(0);
    expect(result.labelToPhysical.get(3)).toBe(1);
    expect(result.labelToPhysical.get(2)).toBe(2);
    expect(result.labelToPhysical.get(4)).toBe(3);
    // A backfilled page's rotation is reset, since nothing read it.
    expect(result.physicalToRotation.get(2)).toBe(0);
  });

  it("stops backfilling when the leftover pages run out", () => {
    const result = buildLabelToPhysicalMaps(
      [detection({ physicalIndex: 0, label: 1 })],
      TOTAL_PAGES,
      1,
    );

    expect([...result.labelToPhysical.keys()]).toEqual([1]);
  });

  it("does not backfill when the document has more pages than expected", () => {
    const result = buildLabelToPhysicalMaps(
      [
        detection({ physicalIndex: 0, label: 1 }),
        detection({ physicalIndex: 1, label: 1 }),
      ],
      2,
      5,
    );

    // Extra pages mean the document is not the expected form; guessing would
    // silently pair an unrelated page with a missing label.
    expect([...result.labelToPhysical.keys()]).toEqual([1]);
  });

  it("returns empty maps for no detections", () => {
    const result = buildLabelToPhysicalMaps([], TOTAL_PAGES, 0);

    expect(result.labelToPhysical.size).toBe(0);
    expect(result.physicalToRotation.size).toBe(0);
    expect(result.conflicts).toEqual([]);
  });

  it("leaves an already-ordered document untouched", () => {
    const result = buildLabelToPhysicalMaps(
      orderedDetections(),
      TOTAL_PAGES,
      TOTAL_PAGES,
    );

    expect([...result.labelToPhysical]).toEqual([
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 3],
    ]);
    expect(result.conflicts).toEqual([]);
  });
});
