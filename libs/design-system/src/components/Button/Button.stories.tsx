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

import { IconSVG } from "../Icon";
import { Button } from "./Button";

const meta = {
  title: "Shared/Design System/Components/Button",
  component: Button,
  argTypes: {
    kind: {
      options: ["primary", "secondary", "link", "borderless"],
      control: "select",
    },
    shape: {
      options: ["pill", "block"],
      control: "select",
    },
    icon: {
      options: ["(none)", ...Object.keys(IconSVG)],
      control: "select",
      mapping: { "(none)": undefined },
    },
    onClick: { table: { disable: true } },
    waiting: { table: { disable: true } },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;

type ButtonStory = StoryObj<typeof meta>;

export const PrimaryButton: ButtonStory = {
  args: {
    children: "Add to Calendar",
    kind: "primary",
  },
};

export const SecondaryButton: ButtonStory = {
  args: { children: "See Details", kind: "secondary" },
};

export const LinkButton: ButtonStory = {
  args: { children: "See Details", kind: "link" },
};

export const BorderlessButton: ButtonStory = {
  args: {
    children: "See Details",
    kind: "borderless",
    shape: "block",
  },
};

export const IconButton: ButtonStory = {
  args: {
    icon: "Place",
    kind: "secondary",
    shape: "block",
  },
};

export const BlockButton: ButtonStory = {
  args: {
    children: "Suggested action",
    shape: "block",
    kind: "secondary",
  },
};
