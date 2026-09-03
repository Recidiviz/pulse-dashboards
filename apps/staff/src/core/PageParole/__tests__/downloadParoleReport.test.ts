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

import { computeReportPageSlices } from "../downloadParoleReport";

describe("computeReportPageSlices", () => {
  it("returns a single page when all content fits", () => {
    expect(
      computeReportPageSlices({
        sectionTopsPx: [0, 100, 250],
        totalHeightPx: 400,
        maxPageHeightPx: 800,
      }),
    ).toEqual([{ startPx: 0, heightPx: 400 }]);
  });

  it("breaks at the last section boundary that fits on each page", () => {
    expect(
      computeReportPageSlices({
        sectionTopsPx: [0, 300, 600],
        totalHeightPx: 900,
        maxPageHeightPx: 500,
      }),
    ).toEqual([
      { startPx: 0, heightPx: 300 },
      { startPx: 300, heightPx: 300 },
      { startPx: 600, heightPx: 300 },
    ]);
  });

  it("hard-splits a single section taller than a page", () => {
    expect(
      computeReportPageSlices({
        sectionTopsPx: [0],
        totalHeightPx: 1500,
        maxPageHeightPx: 500,
      }),
    ).toEqual([
      { startPx: 0, heightPx: 500 },
      { startPx: 500, heightPx: 500 },
      { startPx: 1000, heightPx: 500 },
    ]);
  });

  it("keeps normal sections whole and only splits the oversized one", () => {
    expect(
      computeReportPageSlices({
        sectionTopsPx: [0, 200, 400],
        totalHeightPx: 1400,
        maxPageHeightPx: 500,
      }),
    ).toEqual([
      { startPx: 0, heightPx: 400 },
      { startPx: 400, heightPx: 500 },
      { startPx: 900, heightPx: 500 },
    ]);
  });
});
