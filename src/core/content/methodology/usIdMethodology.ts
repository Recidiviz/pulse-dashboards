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

const CASE_TRIAGE_METHODOLOGY_URL =
  "https://drive.google.com/file/d/11e-fmxSlACDzwSm-X6qD1OF7vFi62qOU/view";

export const US_ID: ViewMethodology = {
  practices: {
    title: "Idaho Practices",
    description: `The “Practices” page provides a snapshot of key operational metrics to proactively identify potential resource constraints and focus attention on successes and areas for improvement. `,
    content: [
      {
        header: "Percentage Calculations",
        body: `
        <p class="Methodology__block--content">
        The numerator for each percentage calculation is the number of people who meet the following criteria on a given day:
        </p>
        <ul class="Methodology__block--content">
          <li><b>Overall:</b> The sum of all the counts below.</li>
          <li><b>Timely risk assessments:</b> Sum of the following:
            <ul class="Methodology__block--content">
            <li>The number of people on General supervision caseloads who have had an LSI-R within 45 days of release or case assignment for parolees, within 45 days of case assignment if none yet exists for probationers, and then a re-administration every 365 days for people with moderate or high supervision levels.</li>
            <li>The number of people supervised under Sex Offense standards who have had an LSI-R within 90 days of release on parole, within 45 days of intake for those on probation, and then every 365 days if the original LSI-R is over 16.</li>
            </ul>
          </li>
          <li><b>Timely contacts:</b> Sum of the following:
            <ul class="Methodology__block--content">
            <li>Number of people on General caseload Low supervision who have had a face-to-face contact within the last 180 days.</li>
            <li>Number of people on General caseload Moderate supervision who have had two face-to-face contacts within the last 90 days. Note: Within Case Triage, officers will see one contact recommended every 45 days for Moderate supervision clients, which may cause small differences between the values. See <a href=${CASE_TRIAGE_METHODOLOGY_URL} target="_blank">Case Triage FAQ and methodology</a> for more details.</li>
            <li>Number of people on General caseload High supervision who have had two face-to-face contacts within the last 30 days. Note: Within Case Triage, officers will see one contact recommended every 15 days for High supervision clients, which may cause small differences between the values. See <a href=${CASE_TRIAGE_METHODOLOGY_URL} target="_blank">Case Triage FAQ and methodology</a> for more details.</li>
            <li>Number of people on Sex Offense level one supervision who have had a face-to-face contact within the last 90 days.</li>
            <li>Number of people on Sex Offense level two supervision who have had a face-to-face contact within the last 30 days.</li>
            <li>Number of people on Sex Offense level three supervision who have had 2 face-to-face contacts within the last 30 days. Note: Within Case Triage, officers will see one contact recommended every 15 days for people on Sex Offense level three supervision, which may cause small differences between the values. See See <a href=${CASE_TRIAGE_METHODOLOGY_URL} target="_blank">Case Triage FAQ and methodology</a> for more details.</li>
            </ul>
          </li>
          <li><b>Supervision & risk level match:</b> The number of people on supervision who have a supervision level that is the same or below the risk level designated by their latest risk assessment score.
          </li>
        </ul>
        <p class="Methodology__block--content">
          The denominator of each rate calculation is all people on supervision in a given day for a given region. For example, the denominators of the percentages for District 3 represent the total number of people on supervision in District 3.
        </p>`,
      },
      {
        header: "Over-time Calculations",
        body: `
        <ul class="Methodology__block--content">
          <li><b>"Current Performance"</b> takes the numerator and denominator for the "Data last updated" date.
          </li>
          <li><b>Rolling 30-day average:</b> On a given day, the rolling 30-day represents the average of the Current Performance percentage for the 30 days prior.
          </li>
          <li><b>Over-time chart:</b> The bars represent the "Current Performance" as of a given day, and the trendline on a given day represents the rolling 30-day average.
          </li>
          <li><b>30D change:</b> This percentage displays the difference between percentage value on the "Data last updated" date and the percentage value 30 days prior to the "Data last updated" date.
          </li>
          <li><b>90D change:</b> This percentage displays the difference between percentage value on the "Data last updated" date and the percentage value 90 days prior to the "Data last updated" date.
          </li>
        </ul>`,
      },
    ],
  },
};
