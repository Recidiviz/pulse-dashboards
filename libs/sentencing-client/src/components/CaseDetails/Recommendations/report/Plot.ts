// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import {
  areaY,
  axisX,
  axisY,
  gridX,
  lineY,
  plot,
  ruleY,
} from "@observablehq/plot";

import { CaseInsight } from "../../../../api";

const TICK_LOCATIONS = [0, 3, 6, 9, 12, 18, 24, 30, 36];

export function getRecidivismPlot(
  dataPoints: CaseInsight["rollupRecidivismSeries"][0]["dataPoints"],
  maxUpperCI: number,
) {
  const data = dataPoints;

  return plot({
    y: {
      percent: true,
      domain: [0, maxUpperCI * 100],
    },
    marks: [
      lineY(data, {
        x: "cohortMonths",
        y: "eventRate",
        strokeWidth: 3,
      }),
      areaY(data, {
        x: "cohortMonths",
        y1: "lowerCI",
        y2: "upperCI",
        fillOpacity: 0.2,
      }),
      axisX({
        label: null,
        ticks: TICK_LOCATIONS,
        tickSize: 0,
        tickFormat: "",
        fontSize: 14,
        fontWeight: 400,
        color: "#001133B2",
      }),
      axisY({
        anchor: "right",
        tickFormat: (y) => `${y}%`,
        interval: 10,
        tickSize: 0,
        fontSize: 14,
        fontWeight: 400,
        color: "#001133B2",
      }),
      // Adds a horizontal line a y = 0
      ruleY([0]),
      gridX(TICK_LOCATIONS, {
        stroke: "#000000",
        strokeOpacity: 1,
        strokeWidth: 0.25,
      }),
    ],
  });
}
