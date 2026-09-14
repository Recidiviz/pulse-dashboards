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
import { fn } from "storybook/test";

import { ResourceCard } from "./ResourceCard";

const meta = {
  title: "US_NYC/ResourceCard",
  component: ResourceCard,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    onClick: { table: { disable: true } },
  },
  args: {
    name: "Program Name",
    to: "/",
    description: "The quick brown fox jumps over the lazy dog.",
    primaryContact: "Primary Contact Person",
    chips: ["Chip One", "Chip Two"],
    compact: false,
    onClick: fn(),
  },
} satisfies Meta<typeof ResourceCard>;

export default meta;

type ResourceCardStory = StoryObj<typeof meta>;

export const Default: ResourceCardStory = {};

export const Compact: ResourceCardStory = {
  args: { compact: true },
};

export const WithoutChips: ResourceCardStory = {
  args: { chips: [] },
};
