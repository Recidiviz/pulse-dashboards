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

import { IconSVG } from "~design-system";

import { JIIButton } from "./JIIButton";

const meta = {
  title: "Common UI/Buttons/JIIButton",
  component: JIIButton,
  argTypes: {
    disabled: {
      control: "boolean",
    },
    kind: {
      options: ["primary", "secondary"],
      control: "radio",
    },
    icon: {
      control: "select",
      options: Object.keys(IconSVG),
    },
    iconSize: {
      control: "number",
    },
  },
  args: {
    children: "Click me",
    kind: "secondary",
    onClick: fn(),
  },
} satisfies Meta<typeof JIIButton>;

export default meta;

type JIIButtonStory = StoryObj<typeof meta>;

export const Primary: JIIButtonStory = {
  args: { kind: "primary" },
};

export const Secondary: JIIButtonStory = {
  args: { kind: "secondary" },
};
