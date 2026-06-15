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
import { Toolbar } from "./Toolbar";
import { ToolbarItem } from "./ToolbarItem";

const meta: Meta<typeof Toolbar> = {
  title: "Shared/Design System/Components/Toolbar",
  component: Toolbar,
  argTypes: {
    ariaLabel: { control: "text" },
    className: { control: "text" },
    children: { table: { disable: true } },
  },
  args: {
    ariaLabel: "Text formatting",
  },
  parameters: {
    docs: {
      description: {
        component:
          "A roving-tabindex container. Focus the toolbar (Tab into it) then use Arrow Left / Right to move between items; only one item is in the tab order at a time. The focus ring becomes visible on keyboard focus and hides on mouse click.",
      },
    },
  },
};

export default meta;

type ToolbarStory = StoryObj<typeof meta>;

export const Default: ToolbarStory = {
  render: (args) => (
    <Toolbar {...args}>
      <ToolbarItem>
        <Button kind="secondary" shape="block">
          Bold
        </Button>
      </ToolbarItem>
      <ToolbarItem>
        <Button kind="secondary" shape="block">
          Italic
        </Button>
      </ToolbarItem>
      <ToolbarItem>
        <Button kind="secondary" shape="block">
          Underline
        </Button>
      </ToolbarItem>
      <ToolbarItem>
        <Button kind="secondary" shape="block">
          Strikethrough
        </Button>
      </ToolbarItem>
    </Toolbar>
  ),
};

export const IconButtons: ToolbarStory = {
  render: (args) => (
    <Toolbar {...args}>
      <ToolbarItem>
        <Button kind="borderless" shape="block" icon="Edit" aria-label="Edit" />
      </ToolbarItem>
      <ToolbarItem>
        <Button
          kind="borderless"
          shape="block"
          icon="Download"
          aria-label="Download"
        />
      </ToolbarItem>
      <ToolbarItem>
        <Button kind="borderless" shape="block" icon="Open" aria-label="Open" />
      </ToolbarItem>
      <ToolbarItem>
        <Button
          kind="borderless"
          shape="block"
          icon="ItemDelete"
          aria-label="Delete"
        />
      </ToolbarItem>
    </Toolbar>
  ),
  args: { ariaLabel: "Record actions" },
};

export const MixedContent: ToolbarStory = {
  render: (args) => (
    <Toolbar {...args}>
      <ToolbarItem>
        <Button kind="primary" shape="block">
          Save
        </Button>
      </ToolbarItem>
      <ToolbarItem>
        <Button kind="secondary" shape="block">
          Preview
        </Button>
      </ToolbarItem>
      <ToolbarItem>
        <Button
          kind="borderless"
          shape="block"
          icon="Download"
          aria-label="Download"
        />
      </ToolbarItem>
      <ToolbarItem>
        <Button
          kind="borderless"
          shape="block"
          icon="ItemDelete"
          aria-label="Discard"
        />
      </ToolbarItem>
    </Toolbar>
  ),
  args: { ariaLabel: "Document actions" },
};

export const WithLinkItems: ToolbarStory = {
  render: (args) => (
    <Toolbar {...args}>
      <ToolbarItem>
        <a href="#overview">Overview</a>
      </ToolbarItem>
      <ToolbarItem>
        <a href="#details">Details</a>
      </ToolbarItem>
      <ToolbarItem>
        <a href="#history">History</a>
      </ToolbarItem>
      <ToolbarItem>
        <a href="#settings">Settings</a>
      </ToolbarItem>
    </Toolbar>
  ),
  args: { ariaLabel: "Section navigation" },
};
