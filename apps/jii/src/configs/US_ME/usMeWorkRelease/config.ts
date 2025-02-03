// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import {
  commonTrackedCriteria,
  defaultStatusLabels,
  ineligibleReasonEligibleDate,
} from "../commonConfigs";
import aboutPage from "./aboutPage.md?raw";
import aboutSummary from "./aboutSummary.md?raw";
import applicationPage from "./applicationPage.md?raw";
import applicationSummary from "./applicationSummary.md?raw";

const { usMeNoClassAOrBViolationFor90Days, usMeNoDetainersWarrantsOrOther } =
  commonTrackedCriteria;
export const usMeWorkReleaseConfig: OpportunityConfig = {
  name: "Work Release",
  description:
    "Work at a job in the community to build savings and work experience",
  firestoreCollection: "US_ME-workReleaseReferrals",
  urlSlug: "work-release",
  shortName: "Work Release",
  statusLabels: defaultStatusLabels,
  requirements: {
    summary: {
      heading: "Your eligibility",
      highlights: [
        {
          label: `When you may be eligible to **apply**`,
          value: `{{#if (isFutureDate eligibilityDate)}}
          {{formatFullDate eligibilityDate}}
        {{else}}
          Now
        {{/if}}`,
        },
      ],
      trackedCriteria: {
        usMeCustodyLevelIsMinimum: {
          criterion: "Current custody level is Minimum",
        },
        usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
          criterion:
            "Served at least 30 days at the facility providing the work release program",
          ineligibleReason: ineligibleReasonEligibleDate,
        },
        usMeThreeYearsRemainingOnSentence: {
          criterion: "Fewer than three years remaining on sentence",
          ineligibleReason: ineligibleReasonEligibleDate,
        },
        usMeNoClassAOrBViolationFor90Days,
        usMeNoDetainersWarrantsOrOther,
      },
      untrackedCriteria: [
        {
          criterion: "Completed required programs and following your case plan",
        },
      ],
    },
  },
  sections: [
    {
      summary: {
        heading: "About Work Release",
        body: aboutSummary,
      },
      fullPage: {
        heading: "About Work Release",
        body: aboutPage,
        urlSlug: "about",
        linkText: "Learn more about how the program works",
      },
    },
    {
      summary: {
        heading: "How to apply",
        body: applicationSummary,
      },
      fullPage: {
        heading: "Application Process",
        body: applicationPage,
        urlSlug: "application",
        linkText: "Learn more about the application process",
      },
    },
  ],
};
