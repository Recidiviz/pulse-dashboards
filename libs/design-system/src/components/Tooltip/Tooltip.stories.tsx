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

import { Tooltip } from "./Tooltip";

const meta = {
  title: "Shared/Design System/Components/Tooltip",
  component: Tooltip,
  argTypes: {
    maxWidth: { control: { type: "number" } },
    backgroundColor: { control: "color" },
    children: { table: { disable: true } },
  },
  parameters: {
    docs: { story: { height: "200px" } },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, position: "relative" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;

type TooltipStory = StoryObj<typeof meta>;

export const Default: TooltipStory = {
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
    style: { position: "static" },
  },
};

export const CustomMaxWidth: TooltipStory = {
  args: {
    maxWidth: 200,
    children:
      "The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.",
    style: { position: "static" },
  },
};

export const CustomBackground: TooltipStory = {
  args: {
    backgroundColor: "rgb(8, 34, 73)",
    children: "The quick brown fox jumps over the lazy dog.",
    style: { position: "static" },
  },
};
