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

import { horizontalOffsetToFit } from "../EdgeAwareTooltip";

const CHART = { containerLeft: 100, containerRight: 400, viewportWidth: 1280 };

describe("horizontalOffsetToFit", () => {
  it("leaves a tooltip that already fits where it is", () => {
    expect(
      horizontalOffsetToFit({ tooltipLeft: 180, tooltipRight: 320, ...CHART }),
    ).toBe(0);
  });

  it("pulls a tooltip overhanging the right edge back inside", () => {
    expect(
      horizontalOffsetToFit({ tooltipLeft: 330, tooltipRight: 430, ...CHART }),
    ).toBe(-30);
  });

  it("pushes a tooltip overhanging the left edge back inside", () => {
    expect(
      horizontalOffsetToFit({ tooltipLeft: 75, tooltipRight: 175, ...CHART }),
    ).toBe(25);
  });

  it("splits the overhang when the tooltip is wider than its chart column", () => {
    // 60px past the left edge, 20px past the right: shifting right by 20
    // leaves 40px hanging off each side rather than 60 off one.
    expect(
      horizontalOffsetToFit({ tooltipLeft: 40, tooltipRight: 420, ...CHART }),
    ).toBe(20);
  });

  it("clamps to the viewport when the chart column runs off screen", () => {
    // The column claims space out to 1400, but the window ends at 1280.
    expect(
      horizontalOffsetToFit({
        tooltipLeft: 1230,
        tooltipRight: 1330,
        containerLeft: 1000,
        containerRight: 1400,
        viewportWidth: 1280,
      }),
    ).toBe(-50);
  });
});
