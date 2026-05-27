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

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuLabel,
  type DropdownMenuProps,
  type DropdownToggleProps,
  Icon,
  IconSVG,
} from "~design-system";

import { JIIDropdownMenuItem, JIIDropdownToggle } from "./Dropdown";

type CombinedArgs = Pick<DropdownToggleProps, "kind" | "shape" | "showCaret"> &
  DropdownMenuProps & {
    iconKind: keyof typeof IconSVG;
    onMenuItemClick: () => void;
  };

/**
 * This variant of the Design System dropdown is styled in such a way
 * that it really only works with an icon (not with a text label).
 */
const meta: Meta<CombinedArgs> = {
  title: "Common UI/Dropdown",
  parameters: {
    docs: {
      story: { height: "300px" },
    },
  },
  render: ({
    alignment,
    iconKind,
    kind,
    shape,
    showCaret,
    onMenuItemClick,
  }) => (
    <Dropdown>
      <JIIDropdownToggle kind={kind} shape={shape} showCaret={showCaret}>
        <Icon kind={iconKind} size={16} />
      </JIIDropdownToggle>
      <DropdownMenu alignment={alignment}>
        <DropdownMenuLabel>Group label</DropdownMenuLabel>
        <JIIDropdownMenuItem onClick={onMenuItemClick}>
          First option
        </JIIDropdownMenuItem>
        <JIIDropdownMenuItem onClick={onMenuItemClick}>
          Second option
        </JIIDropdownMenuItem>
        <JIIDropdownMenuItem onClick={onMenuItemClick}>
          Third option
        </JIIDropdownMenuItem>
      </DropdownMenu>
    </Dropdown>
  ),
  argTypes: {
    alignment: {
      name: "DropdownMenu alignment",
      options: ["left", "right"],
      control: "select",
    },
    kind: {
      name: "DropdownToggle kind",
      options: ["secondary", "link", "primary", "borderless"],
      control: "select",
    },
    shape: {
      name: "DropdownToggle shape",
      options: ["block", "pill"],
      control: "select",
    },
    iconKind: {
      name: "Icon kind",
      options: Object.keys(IconSVG),
      control: "select",
    },
    showCaret: {
      name: "DropdownToggle showCaret",
    },
    onMenuItemClick: {
      table: { disable: true },
    },
  },
  args: {
    kind: "borderless",
    shape: "block",
    iconKind: "Clock",
    onMenuItemClick: fn(),
  },
};

export default meta;

export const Default: StoryObj<typeof meta> = {};
