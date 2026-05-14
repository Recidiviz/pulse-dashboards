// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { palette } from "~design-system";

export const BW_COLOR_SCHEME = [
  "rgb(0,0,0)",
  "rgb(58,58,58)",
  "rgb(93,93,93)",
  "rgb(138,138,138)",
  "rgb(183,183,183)",
  "rgb(228,228,228)",
];

export const SENTENCE_TYPE_TO_COLOR: { [key: string]: string } = {
  Probation: palette.data.gold1,
  Rider: palette.data.gold2,
  Term: "#BA4F4F",
  "Court-Ordered Treatment": palette.data.spring1,
  "< 1 Year Incarceration": palette.data.teal1,
  "1-2 Years Incarceration": palette.data.cornflower1,
  "3-5 Years Incarceration": palette.data.indigo1,
  "6+ Years Incarceration": palette.data.forest2,
  "Suspended Sentence": palette.data.bermuda,
  "Treatment Court/Deferred Prosecution": palette.data.forest1,
};

// TODO(#12402): Remove this map once write_case_insights_data_to_bq.py is fixed
// to use .replace("_", " ").title() instead of .capitalize(), so multi-word
// sentence types like "Treatment_in_prison" arrive correctly formatted.
// Maps raw sentence type strings (as they come from the DB/BigQuery) to their
// display-formatted equivalents. Used by getSentenceLengthBucketLabel.
export const SENTENCE_TYPE_DISPLAY_NAMES: Record<string, string> = {
  Treatment_in_prison: "Court-Ordered Treatment",
  Suspended: "Suspended Sentence",
  Deferred_prosecution: "Treatment Court/Deferred Prosecution",
};

export const RECOMMENDATION_TYPE_TO_BORDER_COLOR: { [key: string]: string } = {
  Probation: "#003331",
  Rider: palette.data.gold2,
  Term: palette.data.crimson2,
};

export const INDIVIDUALS_STRING = "individuals";
