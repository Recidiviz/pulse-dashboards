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

import { describe, expect, it } from "vitest";

import { computePageCutPoint, measureNoSplitBlocks } from "./SARPdfExport";
import { NO_SPLIT_CLASS } from "./SentencingAssessmentReport.constants";

// SNAP_INSET_MM in SARPdfExport.ts.
const SNAP_INSET_MM = 1;

describe("computePageCutPoint", () => {
  const sliceMM = 100;
  const bodyMM = 1000;

  it("cuts a full slice down when no block straddles the cut", () => {
    const blocks = [{ top: 10, bottom: 50 }];

    expect(computePageCutPoint(0, sliceMM, bodyMM, blocks, [])).toBe(100);
  });

  it("clamps the last page's cut to the end of the body", () => {
    expect(computePageCutPoint(950, sliceMM, bodyMM, [], [])).toBe(bodyMM);
  });

  it("snaps to just above a block that straddles the cut", () => {
    const blocks = [{ top: 80, bottom: 120 }];

    expect(computePageCutPoint(0, sliceMM, bodyMM, blocks, [])).toBe(
      80 - SNAP_INSET_MM,
    );
  });

  it("snaps to the highest straddling block so nested blocks move with their outer block", () => {
    const blocks = [
      { top: 60, bottom: 140 },
      { top: 90, bottom: 110 },
    ];

    expect(computePageCutPoint(0, sliceMM, bodyMM, blocks, [])).toBe(
      60 - SNAP_INSET_MM,
    );
  });

  it("ignores a straddling block taller than a slice, so it doesn't leave a blank page", () => {
    const blocks = [{ top: 20, bottom: 300 }];

    expect(computePageCutPoint(0, sliceMM, bodyMM, blocks, [])).toBe(100);
  });

  it("snaps to a nested block inside a block taller than a slice", () => {
    const blocks = [
      { top: 20, bottom: 300 },
      { top: 95, bottom: 105 },
    ];

    expect(computePageCutPoint(0, sliceMM, bodyMM, blocks, [])).toBe(
      95 - SNAP_INSET_MM,
    );
  });

  it("ignores a block that starts at the top of the page", () => {
    const blocks = [{ top: 0, bottom: 120 }];

    expect(computePageCutPoint(0, sliceMM, bodyMM, blocks, [])).toBe(100);
  });

  it("snaps to the block's exact top when the inset would reach the top of the page", () => {
    const blocks = [{ top: 0.5, bottom: 100.5 }];

    expect(computePageCutPoint(0, sliceMM, bodyMM, blocks, [])).toBe(0.5);
  });

  it("measures from the page's body offset", () => {
    const blocks = [{ top: 280, bottom: 320 }];

    expect(computePageCutPoint(200, sliceMM, bodyMM, blocks, [])).toBe(
      280 - SNAP_INSET_MM,
    );
  });

  it("cuts before a page-start element above the snapped cut", () => {
    const blocks = [{ top: 80, bottom: 120 }];

    expect(computePageCutPoint(0, sliceMM, bodyMM, blocks, [40, 90])).toBe(40);
  });
});

describe("measureNoSplitBlocks", () => {
  // The tbody is 200px wide and the page 100mm wide, so 1px is 0.5mm.
  const pageWidthMM = 100;
  const tbodyTop = 10;

  function setRect(el: Element, top: number, bottom: number, width = 200) {
    el.getBoundingClientRect = () =>
      ({ top, bottom, width, height: bottom - top }) as DOMRect;
  }

  function makeBlock(top: number, bottom: number, children: Element[] = []) {
    const el = document.createElement("div");
    el.className = NO_SPLIT_CLASS;
    setRect(el, top, bottom);
    el.append(...children);
    return el;
  }

  function makeTbody(children: Element[]) {
    const tbody = document.createElement("div");
    setRect(tbody, tbodyTop, 1000);
    tbody.append(...children);
    return tbody;
  }

  it("converts each block to mm from the top of the tbody", () => {
    const tbody = makeTbody([makeBlock(30, 70), makeBlock(90, 130)]);

    expect(measureNoSplitBlocks(tbody, pageWidthMM)).toEqual([
      { top: 10, bottom: 30 },
      { top: 40, bottom: 60 },
    ]);
  });

  it("adds a head block from an outer block's top to the bottom of its first nested block", () => {
    const tbody = makeTbody([
      makeBlock(30, 230, [makeBlock(50, 70), makeBlock(70, 90)]),
    ]);

    expect(measureNoSplitBlocks(tbody, pageWidthMM)).toEqual([
      { top: 10, bottom: 110 },
      { top: 10, bottom: 30 },
      { top: 20, bottom: 30 },
      { top: 30, bottom: 40 },
    ]);
  });

  it("ends the head block at the deepest first nested block", () => {
    const tbody = makeTbody([
      makeBlock(30, 230, [makeBlock(50, 150, [makeBlock(60, 80)])]),
    ]);

    expect(measureNoSplitBlocks(tbody, pageWidthMM)).toEqual([
      { top: 10, bottom: 110 },
      { top: 10, bottom: 35 },
      { top: 20, bottom: 70 },
      { top: 20, bottom: 35 },
      { top: 25, bottom: 35 },
    ]);
  });
});
