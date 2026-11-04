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

import { CaseInfoView } from "./CaseInfoCard";

/**
 * A card that lists three labeled values under a heading. The first two share
 * a row, and the third gets a row of its own.
 */
const meta = {
  title: "US_NYC/CaseInfo",
  component: CaseInfoView,
  args: {
    cardHeading: "Card heading",
    cardLabelValuePairs: [
      { label: "First label", value: "First value" },
      { label: "Second label", value: "Second value" },
      { label: "Third label", value: "Third value" },
    ],
  },
} satisfies Meta<typeof CaseInfoView>;

export default meta;

type CaseInfoStory = StoryObj<typeof meta>;

export const Default: CaseInfoStory = {};

/**
 * Long values wrap within their column, breaking mid-word if needed, so the
 * first two values never push each other out of their half of the card.
 */
export const LongValues: CaseInfoStory = {
  args: {
    cardLabelValuePairs: [
      { label: "First label", value: "AVeryLongValueWithNoSpacesToBreakOn" },
      {
        label: "Second label",
        value: "A second value long enough to wrap onto more than one line",
      },
      {
        label: "Third label",
        value:
          "Sphinx of black quartz, judge my vow. Amazingly few discotheques provide jukeboxes, though a quart jar of oil mixed with zinc oxide makes a very bright paint. Waltz, nymph, for quick jigs vex Bud. Crazy Fredrick bought many very exquisite opal jewels. We promptly judged antique ivory buckles for the next prize. Sphinx of black quartz, judge my vow. Amazingly few discotheques provide jukeboxes, though a quart jar of oil mixed with zinc oxide makes a very bright paint.",
      },
    ],
  },
};
