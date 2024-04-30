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

import { OpportunityConfig } from "../types";
import aboutBody1 from "./aboutBody1.md?raw";
import aboutBody2 from "./aboutBody2.md?raw";
import aboutBody3 from "./aboutBody3.md?raw";
import nextStepsBody from "./nextStepsBody.md?raw";

export const config: OpportunityConfig = {
  urlSection: "sccp",
  copy: {
    headline: `{{#if resident.personName.givenNames}}{{ resident.personName.givenNames }}, you{{ else }}You{{/if}} 
      {{#if eligibilityData}}could be eligible to apply for the Supervised Community Confinement Program
      {{#if (isFutureDate custom.applicationDate)}} on {{ formatFullDate custom.applicationDate }}{{/if}}
      {{else}}are not currently eligible to apply for the Supervised Community Confinement Program{{/if}}`,
    subheading: `{{#if eligibilityData}}
    You {{#if (isFutureDate custom.eligibilityDate)}} could be {{else}} became {{/if}} eligible for release onto SCCP 
    on {{formatFullDate custom.eligibilityDate}}. You can apply 
    {{#if (isFutureDate custom.applicationDate )}} up to 3 months prior to that date — as soon as 
    {{formatFullDate custom.applicationDate}}.{{else}} as soon as you meet all the requirements.{{/if}}
    {{/if}}`,
    about: {
      sections: [
        {
          heading: "About the program",
          body: aboutBody1,
        },
        {
          heading: "Quick facts",
          body: aboutBody2,
        },
        { heading: "How to apply", body: aboutBody3 },
      ],
      linkText: "Learn more about how the program works",
    },
    requirements: {
      trackedCriteria: {
        usMeServedXPortionOfSentence: {
          criterion:
            "Served {{currentCriterion.xPortionServed}} of your sentence",
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
          criterion:
            "Current custody level is {{titleCase (lowerCase currentCriterion.custodyLevel) }}",
        },
        usMeNoDetainersWarrantsOrOther: {
          criterion: "No unresolved detainers, warrants or pending charges",
        },
      },
      untrackedCriteria: [
        "Have a safe and healthy place to live for the entire time you are on SCCP",
        "Have a plan for supporting yourself – getting a job, going to school, or receiving Social Security or disability benefits",
        "Completed required programs, following your case plan, and showing positive change",
      ],
      linkText: "Get details about each requirement",
    },
    nextSteps: {
      body: nextStepsBody,
      linkText: "How to put together a strong application",
    },
  },
} satisfies OpportunityConfig;
