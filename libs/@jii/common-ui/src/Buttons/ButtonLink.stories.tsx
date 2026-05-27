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
import { MemoryRouter } from "react-router-dom";

import { ButtonLink } from "./ButtonLink";

const meta = {
  title: "Common UI/Buttons/ButtonLink",
  component: ButtonLink,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    kind: {
      options: ["primary", "secondary"],
      control: "radio",
    },
  },
  args: {
    children: "Go somewhere",
    to: "/",
    kind: "secondary",
  },
} satisfies Meta<typeof ButtonLink>;

export default meta;

type ButtonLinkStory = StoryObj<typeof meta>;

export const Primary: ButtonLinkStory = {
  args: { kind: "primary" },
};

export const Secondary: ButtonLinkStory = {
  args: { kind: "secondary" },
};
