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

import CheckboxGroupExample, {
  type CheckboxGroupExampleArgs,
} from "./examples/example";
import exampleSource from "./examples/example?raw";

const meta: Meta<CheckboxGroupExampleArgs> = {
  title: "Shared/Design System/Components/CheckboxGroup",
  render: (args) => <CheckboxGroupExample {...args} />,
  parameters: {
    docs: {
      codePanel: true,
      source: { code: exampleSource },
    },
  },
  argTypes: {
    orientation: {
      options: ["vertical", "horizontal"],
      control: "radio",
    },
  },
  args: {
    onChange: fn(),
    ariaLabel: "Example options",
  },
};

export default meta;

type CheckboxGroupStory = StoryObj<typeof meta>;

export const Default: CheckboxGroupStory = {
  args: { orientation: "vertical" },
};

export const Horizontal: CheckboxGroupStory = {
  args: { orientation: "horizontal" },
};

export const Disabled: CheckboxGroupStory = {
  args: { disabled: true },
};
