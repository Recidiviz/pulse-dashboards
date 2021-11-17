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

const CASE_TRIAGE_METHODOLOGY_URL =
  "https://drive.google.com/file/d/11e-fmxSlACDzwSm-X6qD1OF7vFi62qOU/view";

/**
 * All methodology attribute blocks are in Markdown
 */
export const usIdMethodology: ViewMethodology = {
  operations: {
    title: "Operational Metrics",
    description: `The Operational Metrics page provides a bird's eye view of staff- and region-level trends to help practively identify resource constraints as well as focus attention on successes and areas for improvement.`,
    pageCopy: {
      practicesPercentMethodology: {
        title: "Percentage Calculations",
        methodology: `The numerator for each percentage calculation is the number of people who meet the following criteria on a given day:
                      \n- **Overall:** The sum of all the counts below.
                      \n- **Timely risk assessments:** Sum of the following:
                          - The number of people on General supervision caseloads who have had an LSI-R within 45 days of release or case assignment for parolees, within 45 days of case assignment if none yet exists for probationers, and then a re-administration every 365 days for people with moderate or high supervision levels.
                          - The number of people supervised under Sex Offense standards who have had an LSI-R within 90 days of release on parole, within 45 days of intake for those on probation, and then every 365 days if the original LSI-R is over 16.
                      \n- **Timely F2F contacts:** Sum of the following:
                          - Number of people on General caseload Low supervision who have had a face-to-face contact within the last 180 days.
                          - Number of people on General caseload Moderate supervision who have had two face-to-face contacts within the last 90 days. Note: Within Case Triage, officers will see one contact recommended every 45 days for Moderate supervision clients, which may cause small differences between the values. See [Case Triage FAQ and methodology](${CASE_TRIAGE_METHODOLOGY_URL}) for more details.
                          - Number of people on General caseload High supervision who have had two face-to-face contacts within the last 30 days. Note: Within Case Triage, officers will see one contact recommended every 15 days for High supervision clients, which may cause small differences between the values. See [Case Triage FAQ and methodology](${CASE_TRIAGE_METHODOLOGY_URL}) for more details.
                          - Number of people on Sex Offense level one supervision who have had a face-to-face contact within the last 90 days.
                          - Number of people on Sex Offense level two supervision who have had a face-to-face contact within the last 30 days.
                          - Number of people on Sex Offense level three supervision who have had 2 face-to-face contacts within the last 30 days. Note: Within Case Triage, officers will see one contact recommended every 15 days for people on Sex Offense level three supervision, which may cause small differences between the values. See [Case Triage FAQ and methodology](${CASE_TRIAGE_METHODOLOGY_URL}) for more details.
                      \n- **Supervision & risk level match:** The number of people on supervision who have a supervision level that is the same or below the risk level designated by their latest risk assessment score.
                      \n\nThe denominator of each rate calculation is all people on supervision in a given day for a given region. For example, the denominators of the percentages for District 3 represent the total number of people on supervision in District 3.`,
      },
      practicesOverTimeMethodology: {
        title: "Over-time Calculations",
        methodology: `- **"Current Performance"** takes the numerator and denominator for the "Data last updated" date.
                      \n- **Rolling 30-day average:** On a given day, the rolling 30-day represents the average of the Current Performance percentage for the 30 days prior.
                      \n- **Over-time chart:** The bars represent the "Current Performance" as of a given day, and the trendline on a given day represents the rolling 30-day average.
                      \n- **30D change:** This percentage displays the difference between percentage value on the "Data last updated" date and the percentage value 30 days prior to the "Data last updated" date.
                      \n- **90D change:** This percentage displays the difference between percentage value on the "Data last updated" date and the percentage value 90 days prior to the "Data last updated" date.`,
      },
    },
    metricCopy: {},
  },
  system: {
    title: "System-Level Trends",
    // TODO figure out a way to get this into the sync content
    description: `The System-Level Trends page provides a real-time map of the corrections system and helps identify patterns of success and failure among specific cohorts of people.`,
    get pageCopy() {
      return getPageCopy("US_ID");
    },
    get metricCopy() {
      return getMetricCopy("US_ID");
    },
  },
};
