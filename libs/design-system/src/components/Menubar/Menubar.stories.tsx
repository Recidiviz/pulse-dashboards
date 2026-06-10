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

import renderExample from "./examples/example";
import exampleSource from "./examples/example?raw";
import { Menubar } from "./Menubar";

const meta: Meta<typeof Menubar> = {
  title: "Shared/Design System/Components/Menubar",
  component: Menubar,
  render: renderExample,
  parameters: {
    docs: {
      codePanel: true,
      source: { code: exampleSource },
    },
  },
  argTypes: {
    focusBorderColor: { control: "color" },
    children: { table: { disable: true } },
  },
  args: {
    ariaLabel: "Main navigation",
  },
};

export default meta;

type MenubarStory = StoryObj<typeof meta>;

export const Default: MenubarStory = {};

export const Vertical: MenubarStory = {
  args: { vertical: true },
};
