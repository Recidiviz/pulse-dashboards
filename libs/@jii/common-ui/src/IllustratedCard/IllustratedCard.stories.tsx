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
import { rem } from "polished";
import { MemoryRouter } from "react-router-dom";
import { fn } from "storybook/test";
import styled from "styled-components";

import { palette } from "~design-system";

import { CardHeading } from "../Card";
import { illustrationPlaceholders } from "./examples/placeholderIllustration";
import { IllustratedCard } from "./IllustratedCard";

const NarrowViewport = styled.div`
  max-width: ${rem(420)};
`;

const meta = {
  title: "Common UI/IllustratedCard",
  component: IllustratedCard,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    illustrationSrc: {
      description:
        "Image URL; the options here are placeholders of varying native size",
      options: Object.keys(illustrationPlaceholders),
      mapping: illustrationPlaceholders,
      control: "radio",
    },
    illustrationBackground: { control: "color" },
    illustrationPlacement: {
      options: ["top", "center", "bottom"],
      control: "radio",
    },
    children: { table: { disable: true } },
    illustrationOnClick: { table: { disable: true } },
    className: { table: { disable: true } },
  },
  args: {
    illustrationSrc: "portrait",
    illustrationBackground: palette.pine1,
    illustrationAlt: "",
    children: (
      <>
        <CardHeading>Section heading</CardHeading>
        <p>The quick brown fox jumps over the lazy dog.</p>
      </>
    ),
  },
} satisfies Meta<typeof IllustratedCard>;

export default meta;

type IllustratedCardStory = StoryObj<typeof meta>;

export const Default: IllustratedCardStory = {};

/**
 * Below about 500px the two columns no longer fit side by side, so they stack
 * and the illustration spans the full width of the card.
 */
export const Stacked: IllustratedCardStory = {
  decorators: [
    (Story) => (
      <NarrowViewport>
        <Story />
      </NarrowViewport>
    ),
  ],
};

/**
 * With `illustrationLink` set, the illustration links to the same place as
 * something in the card contents. It is hidden from assistive technology and
 * skipped in the tab order, so it doesn't duplicate that link.
 */
export const WithLink: IllustratedCardStory = {
  args: { illustrationLink: "/" },
};

/**
 * With a click handler and no link, the illustration is a button, so it can be
 * reached by keyboard. Give it `illustrationAlt` text to name it.
 */
export const WithClickHandler: IllustratedCardStory = {
  args: {
    illustrationOnClick: fn(),
    illustrationAlt: "A description of what the illustration does",
  },
};

/**
 * The card grows to fit its contents, and the illustration stays centered in
 * its column.
 */
export const LongContents: IllustratedCardStory = {
  args: {
    children: (
      <>
        <CardHeading>Section heading</CardHeading>
        <p>
          The quick brown fox jumps over the lazy dog. Pack my box with five
          dozen liquor jugs. How vexingly quick daft zebras jump! The five
          boxing wizards jump quickly. Jackdaws love my big sphinx of quartz,
          and waltz, bad nymph, for quick jigs vex. Bright vixens jump; dozy
          fowl quack. Amazingly few discotheques provide jukeboxes, though a
          quart jar of oil mixed with zinc oxide makes a very bright paint.
        </p>
      </>
    ),
  },
};

/**
 * Where the artwork sits in its column, which only shows when the column is
 * taller than the artwork.
 */
export const TopPlacement: IllustratedCardStory = {
  args: {
    ...LongContents.args,
    illustrationPlacement: "top",
  },
};

/**
 * A source image wider than its column, which is scaled down to fit.
 */
export const LandscapeIllustration: IllustratedCardStory = {
  args: { illustrationSrc: "landscape" },
};

/**
 * A source image narrower than its column, which is drawn at its native size
 * rather than being stretched to fill.
 */
export const NarrowIllustration: IllustratedCardStory = {
  args: { illustrationSrc: "narrow" },
};
