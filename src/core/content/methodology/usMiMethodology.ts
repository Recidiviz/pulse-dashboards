// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { ViewMethodology } from "../../models/types";
import { getMetricCopy, getPageCopy } from "..";

/**
 * All methodology attribute blocks are in Markdown
 */
export const usMiMethodology: ViewMethodology = {
  system: {
    title: "System-Level Trends",
    // TODO figure out a way to get this into the sync content
    description: `The System-Level Trends page provides a real-time map of the corrections system and helps identify patterns of success and failure among specific cohorts of people.`,
    get pageCopy() {
      return getPageCopy("US_MI");
    },
    get metricCopy() {
      return getMetricCopy("US_MI");
    },
  },
};
