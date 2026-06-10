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

import { Toolbar, type ToolbarProps } from "./Toolbar";
import { ToolbarItem } from "./ToolbarItem";

const meta: Meta<typeof Toolbar> = {
  title: "Shared/Design System/Components/Toolbar",
  component: Toolbar,
  render: ({ ariaLabel, className }: Omit<ToolbarProps, "children">) => (
    <Toolbar ariaLabel={ariaLabel} className={className}>
      <ToolbarItem>
        <button type="button">Bold</button>
      </ToolbarItem>
      <ToolbarItem>
        <button type="button">Italic</button>
      </ToolbarItem>
      <ToolbarItem>
        <button type="button">Underline</button>
      </ToolbarItem>
      <ToolbarItem>
        <button type="button">Strikethrough</button>
      </ToolbarItem>
    </Toolbar>
  ),
  argTypes: {
    ariaLabel: { control: "text" },
    className: { control: "text" },
    children: { table: { disable: true } },
  },
  args: {
    ariaLabel: "Text formatting",
  },
};

export default meta;

type ToolbarStory = StoryObj<typeof meta>;

export const Default: ToolbarStory = {};
