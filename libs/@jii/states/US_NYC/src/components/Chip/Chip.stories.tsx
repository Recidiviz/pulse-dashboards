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
import { fn } from "storybook/test";

import { palette } from "~design-system";

import { Chip } from "./Chip";

const meta = {
  title: "US_NYC/Chip",
  component: Chip,
  argTypes: {
    onClick: { table: { disable: true } },
  },
  args: {
    children: "Label",
    selected: false,
    inverted: false,
    onClick: fn(),
  },
  // `inverted` renders a transparent background with a white border/text - meant for a
  // dark surface. Rendered on one here whenever the arg is toggled on, so it isn't
  // invisible against Storybook's default white canvas.
  render: (args) => (
    <div
      style={{
        background: args.inverted ? palette.pine1 : undefined,
        padding: 16,
      }}
    >
      <Chip {...args} />
    </div>
  ),
} satisfies Meta<typeof Chip>;

export default meta;

type ChipStory = StoryObj<typeof meta>;

export const Unselected: ChipStory = {
  args: { selected: false },
};

export const Selected: ChipStory = {
  args: { selected: true },
};

export const Inverted: ChipStory = {
  args: { inverted: true },
};
