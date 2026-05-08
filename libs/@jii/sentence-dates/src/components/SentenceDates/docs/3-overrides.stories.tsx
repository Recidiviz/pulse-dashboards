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

import type { StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

import { getDatesWithMissing } from "../../../fixtures/data";
import renderAddLinksToCards from "./componentOverrides/addLinksToCards";
import addLinksToCardsSource from "./componentOverrides/addLinksToCards?raw";
import renderAddLinkToSection from "./componentOverrides/addLinkToSection";
import addLinkToSectionSource from "./componentOverrides/addLinkToSection?raw";
import renderDescriptionReflectsData from "./componentOverrides/descriptionReflectsData";
import descriptionReflectsDataSource from "./componentOverrides/descriptionReflectsData?raw";
import { baseMeta, SecondaryStoryPage, SentenceDatesMeta } from "./utils";

/**
 * For customization that goes beyond the limited configuration options available,
 * we can extend the Sentence Dates module with fully custom features.
 *
 * The Sentence Dates module is composed of a number of smaller components that
 * handle individual pieces of the UI. When implementing a given state, we can
 * override any of these components as needed to extend them with custom features
 * for that state.
 *
 * Click "Show code" in any story panel for an example of how each override
 * could be implemented.
 */
const meta: SentenceDatesMeta = {
  ...baseMeta,
  title: "Sentence Dates/Extending with custom features",
  parameters: {
    docs: {
      // showing the source code here will be useful guidance for developers
      codePanel: true,
      // overriding the default because the "Primary" story treatment
      // doesn't really make sense on this page
      page: SecondaryStoryPage,
    },
  },
};

export default meta;
type SentenceDateStory = StoryObj<typeof meta>;

/**
 * Pass in a render function and its source code (e.g. from a Vite raw import),
 * get a story that displays this source in Storybook rather than just the
 * SentenceDates component. Useful if your source contains a component override
 * that you want to demonstrate.
 */
function storyWithSource(
  render: SentenceDateStory["render"],
  sourceCode: string,
): SentenceDateStory {
  return {
    decorators: [
      // necessary because our overrides may include React Router components
      (Story) => (
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      ),
    ],
    render,
    parameters: { docs: { source: { code: sourceCode } } },
  };
}

/**
 * In some states, individual date cards should link to individual
 * drilldown pages (or sections of larger drilldown pages) to give residents
 * more information about those dates.
 *
 * To do this we can override the cards' body components to insert a link
 * after the description.
 */
export const AddLinksToCards: SentenceDateStory = storyWithSource(
  renderAddLinksToCards,
  addLinksToCardsSource,
);

/**
 * Some states may include a drilldown page that applies to the entire section.
 *
 * Override and extend the section wrapper to inject this as an additional child.
 */
export const AddLinkToSection: SentenceDateStory = storyWithSource(
  renderAddLinkToSection,
  addLinkToSectionSource,
);

/**
 * Descriptions are static, but in some cases it may be useful to tailor the cards' content
 * to provide more specific context about certain conditions when they appear (e.g. if a date
 * is missing, or in the past).
 *
 * You can do this by overriding the description component to conditionally substitute
 * some other content in place of the default, either generically or using some additional
 * state-specific data.
 */
export const DescriptionReflectsData: SentenceDateStory = {
  ...storyWithSource(
    renderDescriptionReflectsData,
    descriptionReflectsDataSource,
  ),
  args: {
    data: { dates: getDatesWithMissing() },
  },
};
