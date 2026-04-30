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

import { copyFixtureEnglish } from "../../../fixtures/copy";
import { baseMeta, SecondaryStoryPage, SentenceDatesMeta } from "./utils";

/**
 * The default feature set is configurable to a limited extent.
 *
 * As yet there is no standalone configuration feature or UI (such as an admin panel)
 * for this feature, so configuration is mainly accomplished by the inclusion of
 * optional pieces of copy.
 */
const meta: SentenceDatesMeta = {
  ...baseMeta,
  title: "Sentence Dates/Configuration",
  parameters: {
    docs: {
      page: SecondaryStoryPage,
    },
  },
};

export default meta;
export type SentenceDateStory = StoryObj<typeof meta>;

/**
 * Including a description for each date type is highly recommended, but
 * it is not technically required.
 *
 * Descriptions can be omitted for some or all of the date types when
 * creating your state's copy.
 */
export const OptionalDescriptions: SentenceDateStory = {
  args: {
    copy: {
      englishCopy: {
        sentenceDates: {
          dates: {
            ...Object.fromEntries(
              Object.entries(copyFixtureEnglish.sentenceDates.dates).map(
                ([key, { label }]) => [key, { label }],
              ),
            ),
          },
        },
      },
    },
  },
};

/**
 * Any text other than the individual date labels and descriptions is part
 * of a common set of translations that are available to all states. You can
 * override any of these values for your state by including new values in
 * your state's translations, using the same identifiers as the common translations.
 *
 * For example, here we replace the default section header.
 */
export const CustomizeSharedCopy: SentenceDateStory = {
  args: {
    copy: {
      englishCopy: {
        sentenceDates: {
          ...copyFixtureEnglish.sentenceDates,
          general: { heading: "Your possible release dates" },
        },
      },
    },
  },
};
