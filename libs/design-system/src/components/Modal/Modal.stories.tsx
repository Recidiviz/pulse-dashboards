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

import ConfirmationModalExample, {
  type ConfirmationModalExampleArgs,
} from "./examples/confirmationExample";
import confirmationSource from "./examples/confirmationExample?raw";
import DrawerWithFooterExample, {
  type DrawerWithFooterExampleArgs,
} from "./examples/drawerExample";
import drawerSource from "./examples/drawerExample?raw";
import ModalExample, { type ModalExampleArgs } from "./examples/example";
import exampleSource from "./examples/example?raw";

const meta: Meta<ModalExampleArgs> = {
  title: "Shared/Design System/Components/Modal",
  render: (args) => <ModalExample {...args} />,
  parameters: {
    docs: {
      codePanel: true,
      source: { code: exampleSource },
    },
  },
  argTypes: {
    contentLabel: { control: "text" },
    disableBackgroundScroll: { control: "boolean" },
    withHeading: { table: { disable: true } },
    asDrawer: { table: { disable: true } },
    width: { table: { disable: true } },
  },
  args: {
    contentLabel: "Example modal",
    disableBackgroundScroll: true,
    withHeading: false,
    asDrawer: false,
  },
};

export default meta;

type ModalStory = StoryObj<typeof meta>;

export const Default: ModalStory = {};

export const WithModalHeading: ModalStory = {
  args: { withHeading: true },
};

export const WithoutScrollLock: ModalStory = {
  args: { disableBackgroundScroll: false },
};

export const BasicDrawerModal: ModalStory = {
  args: { asDrawer: true },
  argTypes: {
    width: { control: { type: "number" }, table: { disable: false } },
  },
};

export const WideDrawerModal: ModalStory = {
  args: { asDrawer: true, width: 800 },
  argTypes: {
    width: { control: { type: "number" }, table: { disable: false } },
  },
};

export const ConfirmationDialog: StoryObj<ConfirmationModalExampleArgs> = {
  render: (args) => <ConfirmationModalExample {...args} />,
  parameters: {
    docs: {
      codePanel: true,
      source: { code: confirmationSource },
    },
  },
  argTypes: {
    contentLabel: { control: "text" },
  },
  args: { contentLabel: "Confirmation dialog" },
};

export const DrawerWithStickyFooter: StoryObj<DrawerWithFooterExampleArgs> = {
  render: (args) => <DrawerWithFooterExample {...args} />,
  parameters: {
    docs: {
      codePanel: true,
      source: { code: drawerSource },
    },
  },
  argTypes: {
    contentLabel: { control: "text" },
    width: { control: { type: "number" } },
  },
  args: { contentLabel: "Drawer with sticky footer", width: 480 },
};
