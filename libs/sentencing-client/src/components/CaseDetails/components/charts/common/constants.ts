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

export const BW_COLOR_SCHEME = [
  "rgb(0,0,0)",
  "rgb(58,58,58)",
  "rgb(93,93,93)",
  "rgb(138,138,138)",
  "rgb(183,183,183)",
  "rgb(228,228,228)",
];

export const SENTENCE_TYPE_TO_COLOR: { [key: string]: string } = {
  Probation: "#25636F",
  Rider: "#D9A95F",
  Term: "#BA4F4F",
  "< 1 Year Incarceration": "#90AEB5",
  "1-2 Years Incarceration": "#D9A95F",
  "3-5 Years Incarceration": "#BA4F4F",
  "6+ Years Incarceration": "#4C6290",
};

export const RECOMMENDATION_TYPE_TO_BORDER_COLOR: { [key: string]: string } = {
  Probation: "#003331",
  Rider: "#C78F38",
  Term: "#B6253D",
};

export const INDIVIDUALS_STRING = "individuals";
