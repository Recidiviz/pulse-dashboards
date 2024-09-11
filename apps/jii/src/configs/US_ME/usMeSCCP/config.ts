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
import nextStepsBody from "./nextStepsBody.md?raw";
import nextStepsPage from "./nextStepsPage.md?raw";
import quickFactsSummary from "./quickFactsSummary.md?raw";
import requirementsPage from "./requirementsPage.md?raw";
import summaryBody from "./summaryBody.md?raw";

export const config: OpportunityConfig = {
  urlSlug: "sccp",
  firestoreCollection: "US_ME-SCCPReferrals",
  htmlTitle: "Supervised Community Confinement Program",
  headline: `{{#if eligibilityData}}
        {{#if resident.personName.givenNames}}{{ resident.personName.givenNames }}, you{{ else }}You{{/if}} 
        could be eligible to apply for the Supervised Community Confinement Program
        {{#if (isFutureDate custom.applicationDate)}} on {{ formatFullDate custom.applicationDate }}{{/if}}
      {{else}}Learn about the Supervised Community Confinement Program
      {{/if}}`,
  // if no eligibility data, or if resident is fully eligible, this will be blank;
  // otherwise the copy responds to various data conditions
  subheading: `{{#if eligibilityData}} 
      {{#if custom.ineligibleViolation}}You have remaining requirements. Talk to your case manager to understand if and when you can apply.
      {{else}}
        {{#if (isFutureDate custom.eligibilityDate)}}
        You could be eligible for release onto SCCP on <strong>{{formatFullDate custom.eligibilityDate}}</strong>. 
        You can apply up to 3 months prior to that date —
          {{#if (isFutureDate custom.applicationDate )}} as soon as {{formatFullDate custom.applicationDate}}.
          {{else}} which means that you may be eligible to apply now.
          {{/if}}
        {{/if}}
      {{/if}} 
    {{/if}}`,
  summary: {
    heading: "About the program",
    body: summaryBody,
  },
  requirements: {
    summary: {
      heading: "Requirements",
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
      staticRequirementsLabel:
        "In order to be eligible for SCCP, you must have met the following requirements:",
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
        heading: "Quick facts",
        body: quickFactsSummary,
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
      hideWhenIneligible: true,
    },
  ],

  menuLabel: "SCCP",
  formPreview: { title: "SCCP Application" },
} satisfies OpportunityConfig;
