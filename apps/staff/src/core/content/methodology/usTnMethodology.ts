// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
export const usTnMethodology: ViewMethodology = {
  system: {
    title: "Pathways",
    // TODO figure out a way to get this into the sync content
    description:
      "Pathways provides a real-time map of the corrections system and helps identify patterns of success and failure among specific cohorts of people.",
    descriptionSecondary:
      "In each of the charts and tables, when a filter is set to 'All', the counts may not add up to the sum of each individual filtered value. This is because there are some unknown values (for example, some people with an unknown age). These people are counted when the age filter is set to 'All' but are not shown in any of the other breakdowns.",
    get pageCopy() {
      return getPageCopy("US_TN");
    },
    get metricCopy() {
      return getMetricCopy("US_TN");
    },
  },
};
