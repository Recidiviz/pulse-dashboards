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

/**
 * All methodology attribute blocks are in Markdown
 */
export const usNdMethodology: ViewMethodology = {
  practices: {
    title: "Practices",
    description: `The "Practices" page provides a snapshot of agency performance on a set of key metrics to proactively identify potential resource constraints and focus attention on operational successes and areas for improvement.`,
    pageCopy: {
      practicesPercentMethodology: {
        title: "Percentage Calculations",
        methodology: `The numerator for each percentage calculation is the number of people who meet the following criteria on a given day:
                      \n- **Overall:** The sum of all the counts below.
                      \n- **Timely discharge:** Number of people on supervision who are not past their projected supervision completion date.
                      \n- **Timely contacts:** Sum of the following:
                          - Number of people on Minimum Supervision who have had a face-to-face contact within the last 3 calendar months and a home visit within 90 days of their supervision start.
                          - Number of people on Medium Supervision who have had a face-to-face contact within the last 2 calendar months and a home visit within 90 days of their supervision start, and a home visit within the last calendar year.
                          - Number of people on Maximum Supervision who have had a face-to-face contact within the last calendar month, a home visit within 90 days of their supervision start, and a home visit within the last calendar year.
                      \n- **Timely risk assessments:** Number of people on supervision who have had a risk assessment completed within the last 212 days, or had an assessment within the first 30 days of supervision, if they have been on supervision for fewer than 212 days. This excludes all people on supervision for NC, IC-OUT, and diversion.
                      \n\nThe denominator of each rate calculation is all people on supervision in a given day for a given region. For example, the denominators of the percentages for Oakes Office represent the total number of people on supervision in Oakes.`,
      },
      practicesOverTimeMethodology: {
        title: "Over-time Calculations",
        methodology: `The numerator for each percentage calculation is the number of people who meet the following criteria on a given day:
                      \n\n- **"Current Performance"** takes the numerator and denominator for the "Data last updated" date. For example, if the data was last updated on 3/31/21, the timely discharge performance would be represented by the total number of people with a projected supervision completion date before 3/31/21 divided by the total number of people on supervision on 3/31/21.
                      \n- **Rolling 30-day average:** On a given day, the rolling 30-day represents the average of the Current Performance percentage for the 30 days prior.
                      \n- **Over-time chart:** The bars represent the "Current Performance" as of a given day, and the trendline on a given day represents the rolling 30-day average.
                      \n- **30D change:** This percentage displays the difference between the rolling 30-day average on the "Data last updated" date and the rolling 30-day average of 30 days prior to the "Data last updated" date.
                      \n- **90D change:** This percentage displays the difference between the rolling 30-day average on the "Data last updated" date and the rolling 30-day average of 90 days prior to the "Data last updated" date.`,
      },
    },
    metricCopy: {},
  },
};
