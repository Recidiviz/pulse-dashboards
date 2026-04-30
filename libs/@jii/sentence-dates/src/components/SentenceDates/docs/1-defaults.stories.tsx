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

import {
  getDatesWithMissing,
  getDatesWithPast,
  getDatesWithToday,
  getDatesWithUpcoming,
  getSentenceDatesFixtureData,
} from "../../../fixtures/data";
import { baseMeta, SentenceDatesMeta } from "./utils";

/**
 * The Sentence Dates module provides a default set of features around displaying
 * residents' release dates, which can be extended and customized per state as needed.
 *
 * Setting this feature up in a new state requires, at minimum, two prerequisites:
 * 1. Data on the relevant dates for each resident
 * 2. State-specific copy that specifies labels and descriptions for each date type
 *
 * Examples of both can be seen in the example arguments below. Spanish copy is not
 * required unless Spanish translations are enabled for the state in question.
 */
const meta: SentenceDatesMeta = {
  ...baseMeta,
  title: "Sentence Dates/Default features",
  argTypes: {
    ...baseMeta.argTypes,
    language: { options: ["en", "es"], control: "select" },
  },
};

export default meta;
export type SentenceDateStory = StoryObj<typeof meta>;

/**
 * Most dates are well in the future and will receive this default presentation.
 */
export const Default: SentenceDateStory = {
  args: { data: getSentenceDatesFixtureData() },
};

/**
 * When dates are in the near future (<31 days), this fact is highlighted.
 */
export const UpcomingDates: SentenceDateStory = {
  args: { data: getSentenceDatesFixtureData(getDatesWithUpcoming) },
};

/**
 * The "upcoming dates" treatment also applies to the current date.
 */
export const Today: SentenceDateStory = {
  args: { data: getSentenceDatesFixtureData(getDatesWithToday) },
};

/**
 * Release dates that have passed are also visually distinguished from the default,
 * but they are de-emphasized as well.
 */
export const PastDates: SentenceDateStory = {
  args: { data: getSentenceDatesFixtureData(getDatesWithPast) },
};

/**
 * Missing dates are not hidden by default, but are instead flagged as unavailable
 * with neutral language.
 */
export const MissingDates: SentenceDateStory = {
  args: { data: getSentenceDatesFixtureData(getDatesWithMissing) },
};
