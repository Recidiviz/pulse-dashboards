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

import { FALLBACK_STRATEGY } from "../../constants";
import type { DetectResult } from "../../types";
import { selectKeptPagesFromDetections } from "../selectKeptPages";

function detection(
  overrides: Partial<DetectResult> & Pick<DetectResult, "label">,
): DetectResult {
  return {
    physicalIndex: overrides.physicalIndex ?? overrides.label - 1,
    label: overrides.label,
    rotation: overrides.rotation ?? 0,
    strategy: overrides.strategy ?? "footer",
    ocrCalls: overrides.ocrCalls ?? 1,
    log: overrides.log ?? [],
  };
}

describe("selectKeptPagesFromDetections", () => {
  it("maps real in-range labels to oriented indices", () => {
    const result = selectKeptPagesFromDetections(
      [detection({ label: 1 }), detection({ label: 3 })],
      4,
    );

    expect([...result.labelToOrientedIndex.entries()]).toEqual([
      [1, 0],
      [3, 2],
    ]);
    expect(result.discardedOrientedIndices).toEqual([]);
  });

  it("ignores fallback strategies and out-of-range labels", () => {
    const result = selectKeptPagesFromDetections(
      [
        detection({ label: 1, strategy: FALLBACK_STRATEGY }),
        detection({ label: 9 }),
        detection({ label: 2 }),
      ],
      4,
    );

    expect([...result.labelToOrientedIndex.entries()]).toEqual([[2, 1]]);
  });

  it("discards duplicate labels after the first", () => {
    const result = selectKeptPagesFromDetections(
      [detection({ label: 2 }), detection({ label: 2 })],
      4,
    );

    expect([...result.labelToOrientedIndex.entries()]).toEqual([[2, 1]]);
    expect(result.discardedOrientedIndices).toEqual([1]);
  });
});
