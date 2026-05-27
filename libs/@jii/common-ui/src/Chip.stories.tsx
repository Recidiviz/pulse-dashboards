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

import { Chip } from "./Chip";

const meta = {
  title: "Common UI/Chip",
  component: Chip,
  argTypes: {
    color: {
      options: ["green", "yellow", "gray", "red"],
      control: "radio",
    },
  },
  args: {
    children: "Status label",
    color: "green",
  },
} satisfies Meta<typeof Chip>;

export default meta;

type ChipStory = StoryObj<typeof meta>;

export const Green: ChipStory = {
  args: { color: "green" },
};

export const Yellow: ChipStory = {
  args: { color: "yellow" },
};

export const Gray: ChipStory = {
  args: { color: "gray" },
};

export const Red: ChipStory = {
  args: { color: "red" },
};
