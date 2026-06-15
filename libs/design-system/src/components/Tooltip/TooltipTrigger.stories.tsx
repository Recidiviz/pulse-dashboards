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

import { Button } from "../Button";
import { TooltipTrigger } from "./TooltipTrigger";

const meta = {
  title: "Shared/Design System/Components/TooltipTrigger",
  component: TooltipTrigger,
  argTypes: {
    positionX: {
      options: ["left", "right"],
      control: "radio",
    },
    positionY: {
      options: ["top", "bottom"],
      control: "radio",
    },
    maxWidth: { control: { type: "number" } },
    backgroundColor: { control: "color" },
    contents: { table: { disable: true } },
    children: { table: { disable: true } },
  },
  args: {
    children: <Button kind="secondary">Hover</Button>,
    contents: "Hover me",
  },
  parameters: {
    docs: { story: { height: "300px" } },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 64 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TooltipTrigger>;

export default meta;

type TooltipTriggerStory = StoryObj<typeof meta>;

export const Default: TooltipTriggerStory = {};

export const LeftPositioned: TooltipTriggerStory = {
  args: { positionX: "left" },
};

export const TopPositioned: TooltipTriggerStory = {
  args: { positionY: "top" },
};

export const WithReactNodeContents: TooltipTriggerStory = {
  args: {
    contents: (
      <span>
        <strong>Bold</strong> hint
      </span>
    ),
  },
};

export const LongContents: TooltipTriggerStory = {
  args: {
    contents:
      "The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.",
    maxWidth: 200,
  },
};
