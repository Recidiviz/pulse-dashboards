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

import { iconKinds } from "../Icon";
import { Dropdown } from "./Dropdown";
import { DropdownMenu, type DropdownMenuProps } from "./DropdownMenu";
import { DropdownMenuItem } from "./DropdownMenuItem";
import { DropdownMenuLabel } from "./DropdownMenuLabel";
import { DropdownToggle, type DropdownToggleProps } from "./DropdownToggle";

type CombinedArgs = DropdownToggleProps &
  DropdownMenuProps & { onMenuItemClick: () => void };

/**
 * Dropdown is a compound component that involves a number of interdependent
 * components that should be composed together to produce the toggle button and menu.
 */
const meta: Meta<CombinedArgs> = {
  title: "Shared/Design System/Components/Dropdown",
  parameters: {
    docs: {
      story: { height: "300px" },
    },
  },
  render: ({
    alignment,
    children,
    kind,
    shape,
    icon,
    showCaret,
    onMenuItemClick,
  }) => (
    <div
      style={{
        display: "flex",
        justifyContent: alignment === "right" ? "flex-end" : "flex-start",
      }}
    >
      <Dropdown>
        <DropdownToggle
          kind={kind}
          shape={shape}
          icon={icon}
          showCaret={showCaret}
        >
          {children}
        </DropdownToggle>
        <DropdownMenu alignment={alignment}>
          <DropdownMenuLabel>Remind Me In</DropdownMenuLabel>
          <DropdownMenuItem onClick={onMenuItemClick}>7 days</DropdownMenuItem>
          <DropdownMenuItem onClick={onMenuItemClick}>14 days</DropdownMenuItem>
          <DropdownMenuItem onClick={onMenuItemClick}>30 days</DropdownMenuItem>
          <DropdownMenuLabel>Other Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={onMenuItemClick}>
            Say &quot;Recidiviz&quot;
          </DropdownMenuItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  ),
  argTypes: {
    alignment: {
      name: "DropdownMenu: alignment",
      options: ["left", "right"],
      control: "select",
    },
    kind: {
      name: "DropdownToggle: kind",
      options: ["secondary", "link", "primary", "borderless"],
      control: "select",
    },
    shape: {
      name: "DropdownToggle: shape",
      options: ["block", "pill"],
      control: "select",
    },
    icon: {
      name: "DropdownToggle: icon",
      options: ["(none)", ...iconKinds],
      control: "select",
      mapping: { "(none)": undefined },
    },
    showCaret: {
      name: "DropdownToggle: showCaret",
      control: "boolean",
    },
    children: {
      name: "DropdownToggle: children",
    },
    onMenuItemClick: {
      table: { disable: true },
    },
  },
  args: {
    kind: "secondary",
    shape: "block",
    onMenuItemClick: fn(),
  },
};

export default meta;

type DropdownStory = StoryObj<typeof meta>;

export const ButtonDropdown: DropdownStory = {
  args: { children: "Create a reminder" },
};

export const IconButtonDropdown: DropdownStory = {
  args: { icon: "Clock" },
};
