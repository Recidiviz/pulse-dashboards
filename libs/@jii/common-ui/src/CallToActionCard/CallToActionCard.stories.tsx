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

import { palette } from "~design-system";

import { illustrationPlaceholders } from "../IllustratedCard/examples/placeholderIllustration";
import { CallToActionCard } from "./CallToActionCard";

/**
 * A promo card linking to another part of the site. The illustration sits
 * beside the text, or above it when the card is too narrow for both.
 */
const meta = {
  title: "Common UI/CallToActionCard",
  component: CallToActionCard,
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
  },
  args: {
    linkTo: "/",
    heading: "Section heading",
    description: "The quick brown fox jumps over the lazy dog.",
    linkText: "Go somewhere",
    illustrationSrc: "portrait",
    illustrationBackground: palette.pine1,
  },
} satisfies Meta<typeof CallToActionCard>;

export default meta;

type CallToActionCardStory = StoryObj<typeof meta>;

export const Default: CallToActionCardStory = {};

/**
 * The card grows to fit the text, and the illustration stays centered in its
 * column.
 */
export const LongDescription: CallToActionCardStory = {
  args: {
    description:
      "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! The five boxing wizards jump quickly. Jackdaws love my big sphinx of quartz, and waltz, bad nymph, for quick jigs vex. Bright vixens jump; dozy fowl quack. Amazingly few discotheques provide jukeboxes, though a quart jar of oil mixed with zinc oxide makes a very bright paint.",
  },
};

/**
 * A short card, where the illustration has more width to give than the card
 * has height to fill.
 */
export const ShortDescription: CallToActionCardStory = {
  args: { description: "Sphinx of black quartz." },
};

/**
 * A source image wider than its column, which is scaled down to fit.
 */
export const LandscapeIllustration: CallToActionCardStory = {
  args: { illustrationSrc: "landscape" },
};

/**
 * A source image narrower than its column, which is drawn at its native size
 * rather than being stretched to fill.
 */
export const NarrowIllustration: CallToActionCardStory = {
  args: { illustrationSrc: "narrow" },
};
