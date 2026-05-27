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

import SelectorExample, { type SelectorExampleArgs } from "./examples/example";
import exampleSource from "./examples/example?raw";

const DEFAULT_OPTIONS = [
  { label: "Option A", value: "a" },
  { label: "Option B", value: "b" },
  { label: "Option C, a particularly long option", value: "c" },
  { label: "Option D", value: "d" },
];

const meta: Meta<SelectorExampleArgs> = {
  title: "Common UI/Selector",
  render: (args) => <SelectorExample {...args} />,
  parameters: {
    docs: {
      codePanel: true,
      source: { code: exampleSource },
      story: { height: "260px" },
    },
  },
  argTypes: {
    options: { control: "object" },
    menuAlign: {
      options: ["left", "right"],
      control: "radio",
    },
    onChange: { table: { disable: true } },
  },
  args: {
    options: DEFAULT_OPTIONS,
    placeholder: "Select an option",
    menuAlign: "left",
    onChange: fn(),
  },
};

export default meta;

export const Default: StoryObj<typeof meta> = {};

/**
 * In rare cases when option text cannot wrap and overflows the container,
 * you may wish to control which side it overflows on using `menuAlign`.
 */
export const OverflowAlignment: StoryObj<typeof meta> = {
  args: {
    options: [
      ...DEFAULT_OPTIONS.slice(0, 2),
      { label: "Option Z: Antidisestablishmentarianism", value: "Z" },
    ],
  },
};
