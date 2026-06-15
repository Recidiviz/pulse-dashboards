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

import type { Meta, StoryObj } from "@storybook/react";

import { ChartWrapper } from "./ChartWrapper";

const meta: Meta<typeof ChartWrapper> = {
  title: "Shared/Design System/Components/ChartWrapper",
  component: ChartWrapper,
  argTypes: {
    children: { table: { disable: true } },
    className: { control: "text" },
  },
  render: (args) => (
    <ChartWrapper {...args}>
      <svg width={360} height={220}>
        <g className="frame">
          <text className="frame-title" x={12} y={24}>
            The quick brown fox
          </text>
          <text className="axis-title" x={12} y={48}>
            Axis title
          </text>
          <text className="axis-label" x={12} y={72}>
            Axis label
          </text>
          <g className="pieces">
            <rect x={12} y={96} width={48} height={96} />
            <rect x={72} y={120} width={48} height={72} />
            <rect x={132} y={108} width={48} height={84} />
            <rect x={192} y={84} width={48} height={108} />
          </g>
          <line className="axis-baseline" x1={12} x2={252} y1={192} y2={192} />
          <line className="tick-line" x1={12} x2={252} y1={150} y2={150} />
        </g>
      </svg>
    </ChartWrapper>
  ),
};

export default meta;

type ChartWrapperStory = StoryObj<typeof meta>;

export const Default: ChartWrapperStory = {};
