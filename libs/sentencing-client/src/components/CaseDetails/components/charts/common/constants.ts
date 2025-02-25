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

export const SENTENCE_TYPE_TO_COLOR: { [key: string]: string } = {
  Probation: "#25636F",
  Rider: "#D9A95F",
  Term: "#BA4F4F",
  "< 1 Year": "#25636F",
  "1-2 Years": "#D9A95F",
  "3-5 Years": "#BA4F4F",
  "11-20 Years": "#4C6290",
  "21+ Years": "#90AEB5",
};

export const RECOMMENDATION_TYPE_TO_BORDER_COLOR: { [key: string]: string } = {
  Probation: "#003331",
  Rider: "#C78F38",
  Term: "#B6253D",
};

export const INDIVIDUALS_STRING = "individuals";
