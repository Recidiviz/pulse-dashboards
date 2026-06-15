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

import { ErrorPage } from "./ErrorPage";

const placeholderLogo = (
  <svg width={64} height={64} aria-hidden="true">
    <circle cx={32} cy={32} r={28} fill="rgb(0, 108, 103)" />
  </svg>
);

const altLogo = (
  <svg width={64} height={64} aria-hidden="true">
    <rect x={4} y={4} width={56} height={56} rx={8} fill="rgb(8, 34, 73)" />
  </svg>
);

const meta = {
  title: "Shared/Design System/Components/ErrorPage",
  component: ErrorPage,
  argTypes: {
    headerText: { control: "text" },
    logo: { table: { disable: true } },
    children: { table: { disable: true } },
  },
  args: {
    headerText: "Something went wrong",
    logo: placeholderLogo,
  },
} satisfies Meta<typeof ErrorPage>;

export default meta;

type ErrorPageStory = StoryObj<typeof meta>;

export const Default: ErrorPageStory = {
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
  },
};

export const WithLongCopy: ErrorPageStory = {
  args: {
    children: (
      <>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <p>
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
          nisi ut aliquip ex ea commodo consequat.
        </p>
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
          dolore eu fugiat nulla pariatur.
        </p>
      </>
    ),
  },
};

export const WithCustomLogo: ErrorPageStory = {
  args: {
    logo: altLogo,
    children: "The quick brown fox jumps over the lazy dog.",
  },
};
