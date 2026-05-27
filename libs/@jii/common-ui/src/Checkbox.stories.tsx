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

import { Checkbox } from "./Checkbox";

type CheckboxArgs = {
  $size: number;
  $accentColor?: string;
  $uncheckedBackground?: string;
  disabled?: boolean;
};

const meta: Meta<CheckboxArgs> = {
  title: "Common UI/Checkbox",
  component: Checkbox,
  argTypes: {
    $size: { control: { type: "range", min: 12, max: 40, step: 2 } },
    $accentColor: { control: "color" },
    $uncheckedBackground: { control: "color" },
    disabled: { control: "boolean" },
  },
  args: {
    $size: 20,
    disabled: false,
  },
};

export default meta;

type CheckboxStory = StoryObj<typeof meta>;

export const Default: CheckboxStory = {};

export const CustomAccentColor: CheckboxStory = {
  args: { $accentColor: "#7B2D8B" },
};

export const Disabled: CheckboxStory = {
  args: { disabled: true },
};
