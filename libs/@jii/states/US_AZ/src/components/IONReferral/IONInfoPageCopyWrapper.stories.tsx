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

import { IONInfoPageCopyWrapper } from "./IONInfoPageCopyWrapper";

function placeholderImage(color: string): string {
  const width = 640;
  const height = 360;
  const shapeSize = 80;
  const gap = 40;
  const shapeCount = 4;
  const rowWidth = shapeCount * shapeSize + (shapeCount - 1) * gap;
  const startX = (width - rowWidth) / 2;
  const centerY = height / 2;

  const shapes = Array.from({ length: shapeCount }, (_, i) => {
    const x = startX + i * (shapeSize + gap);
    // alternate circles and squares across the row
    return i % 2 === 0
      ? `<circle cx="${x + shapeSize / 2}" cy="${centerY}" r="${shapeSize / 2}" fill="${color}" />`
      : `<rect x="${x}" y="${centerY - shapeSize / 2}" width="${shapeSize}" height="${shapeSize}" fill="${color}" />`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#f1f1f1" />
    ${shapes}
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Extends the common-ui CopyWrapper component to add support
 * for displaying images interspersed with blocks of text.
 */
const meta = {
  title: "US_AZ/IONInfoPageCopyWrapper",
  component: IONInfoPageCopyWrapper,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    overrides: { table: { disable: true } },
    options: { table: { disable: true } },
  },
} satisfies Meta<typeof IONInfoPageCopyWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Beyond the base CopyWrapper styles, images are given a border and vertical
 * margin so they read as distinct blocks within the surrounding copy.
 */
export const WithImage: Story = {
  args: {
    children: `## Section heading

This paragraph appears before the image. The quick brown fox jumps over the lazy dog.

![Example screenshot](${placeholderImage("#d8e2dc")})

This paragraph appears after the image, showing the spacing on both sides.
`,
  },
};

/**
 * Multiple images within the same block of copy are each styled and spaced
 * consistently, e.g. for a step-by-step walkthrough.
 */
export const MultipleImages: Story = {
  args: {
    children: `## Step-by-step example

First, do this:

![First step](${placeholderImage("#cddafd")})

Then, do this:

![Second step](${placeholderImage("#ffd6a5")})
`,
  },
};
