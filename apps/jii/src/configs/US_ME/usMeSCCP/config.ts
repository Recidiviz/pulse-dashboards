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

import { OpportunityConfig } from "../../types";
import aboutPage from "./aboutPage.md?raw";
import aboutSummary from "./aboutSummary.md?raw";
import nextStepsBody from "./nextStepsBody.md?raw";
import nextStepsPage from "./nextStepsPage.md?raw";
import requirementsPage from "./requirementsPage.md?raw";

export const config: OpportunityConfig = {
  urlSlug: "sccp",
  firestoreCollection: "US_ME-SCCPReferrals",
  name: "Supervised Community Confinement Program (SCCP)",
  description: `Spend the last portion of your sentence in the community (also called “home confinement”)`,
  requirements: {
    summary: {
      heading: "Your eligibility",
      trackedCriteria: {
        usMeServedXPortionOfSentence: {
          criterion: `{{#if currentCriterion}}Served {{currentCriterion.xPortionServed}} of your sentence
              {{else}}Served 1/2 of your sentence if your sentence is 5 years or fewer; 
                served 2/3 of your sentence if your sentence is 5 or more years
              {{/if}}`,
          ineligibleReason:
            "You'll meet this requirement on {{formatFullDate currentCriterion.eligibleDate}}",
        },
        usMeXMonthsRemainingOnSentence: {
          criterion: "Fewer than 30 months remaining on your sentence",
          ineligibleReason:
            "You'll meet this requirement on {{formatFullDate currentCriterion.eligibleDate}}",
        },
        usMeNoClassAOrBViolationFor90Days: {
          criterion: "No Class A or B discipline in past 90 days",
          ineligibleReason:
            "{{#if currentCriterion.eligibleDate}}You'll meet this requirement on {{formatFullDate currentCriterion.eligibleDate}}{{else}}You have a Class {{currentCriterion.highestClassViol}} violation: {{currentCriterion.violType}}{{/if}}",
        },
        usMeCustodyLevelIsMinimumOrCommunity: {
          criterion: `Current custody level is {{#if currentCriterion}} 
                {{titleCase (lowerCase currentCriterion.custodyLevel) }}
                {{else}} Minimum or Community
              {{/if}}`,
        },
        usMeNoDetainersWarrantsOrOther: {
          criterion: "No unresolved detainers, warrants or pending charges",
        },
      },
      untrackedCriteria: [
        {
          criterion:
            "Have a safe and healthy place to live for the entire time you are on SCCP",
        },
        {
          criterion:
            "Have a plan to support yourself –  a job, school, Social Security, or disability benefits",
        },
        {
          criterion:
            "Completing required programs and following your case plan",
        },
      ],
      highlights: [
        {
          label: `When you may be eligible to **apply**`,
          value: `{{#if (isFutureDate custom.applicationDate)}}
            {{formatFullDate custom.applicationDate}}
          {{else}}
            Now
          {{/if}}`,
        },
        {
          label: `When you may be eligible for **release**`,
          value: `{{#if (isFutureDate custom.eligibilityDate)}}
            {{formatFullDate custom.eligibilityDate}}
          {{else}}
            Now
          {{/if}}`,
        },
      ],
    },
    fullPage: {
      linkText: "Get details about each requirement",
      urlSlug: "requirements",
      heading: "SCCP Eligibility Requirements",
      body: requirementsPage,
    },
  },
  sections: [
    {
      summary: {
        heading: "About SCCP",
        body: aboutSummary,
      },
      fullPage: {
        linkText: "Learn more about how the program works",
        urlSlug: "about",
        heading: "About the Supervised Community Confinement Program (SCCP)",
        body: aboutPage,
      },
    },
    {
      summary: {
        heading: "How to apply",
        body: nextStepsBody,
      },
      fullPage: {
        linkText: "Learn more about the application process",
        urlSlug: "application-process",
        heading: "SCCP Application Process and Tips",
        body: nextStepsPage,
      },
    },
  ],

  shortName: "SCCP",
  formPreview: { title: "SCCP Application" },
  statusLabels: {
    ELIGIBLE: "May be eligible",
    ALMOST_ELIGIBLE: "Almost eligible",
    INELIGIBLE: "Not yet eligible",
  },
} satisfies OpportunityConfig;
