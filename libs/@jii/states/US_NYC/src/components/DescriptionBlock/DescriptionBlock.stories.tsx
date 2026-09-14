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

import { DescriptionBlock } from "./DescriptionBlock";

const SHORT_MARKDOWN = `**Bold lead-in.** This is a short paragraph of placeholder copy that stays within the collapse threshold.`;

const LONG_MARKDOWN = `**Bold lead-in.** The quick brown fox jumps over the lazy dog. This is placeholder body copy meant to run long enough to overflow the clamped preview height and trigger the toggle button.

- First item
- Second item
- Third item
- Fourth item

More filler text follows here to push the total rendered height well past three lines. The quick brown fox jumps over the lazy dog once more for good measure, and then a little more still.`;

const meta = {
  title: "US_NYC/DescriptionBlock",
  component: DescriptionBlock,
  argTypes: {
    onToggle: { table: { disable: true } },
  },
  args: {
    markdown: SHORT_MARKDOWN,
    onToggle: fn(),
  },
} satisfies Meta<typeof DescriptionBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Short markdown that fits within the three-line collapse threshold — no toggle button is shown.
 */
export const FitsWithinThreshold: Story = {};

/**
 * Long markdown that overflows the clamped height — a "Show full description" toggle appears.
 */
export const OverflowsAndShowsToggle: Story = {
  args: {
    markdown: LONG_MARKDOWN,
  },
};
