// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { SwarmPoint } from "../../InsightsStore/presenters/SwarmPresenter/types";
import { GOAL_COLORS } from "./constants";

type SwarmedCircleGroupProps = JSX.IntrinsicElements["g"] & {
  swarmPoints: SwarmPoint[];
  pointColor?: string;
};

/**
 * renders an SVG `g` element containing `circle` elements in a swarmed layout
 */
export function SwarmedCircleGroup({
  swarmPoints,
  pointColor,
  ...gProps
}: SwarmedCircleGroupProps) {
  return (
    <g {...gProps}>
      {swarmPoints.map(
        ({ targetStatus, radius, opacity, spreadOffset, position }, i) => (
          <circle
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            r={radius}
            cx={position}
            cy={spreadOffset}
            fill={pointColor ?? GOAL_COLORS[targetStatus]}
            fillOpacity={opacity}
          />
        ),
      )}
    </g>
  );
}
