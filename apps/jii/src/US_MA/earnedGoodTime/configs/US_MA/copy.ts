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

import { usMaEarnedCreditTypes } from "~datatypes";

import creditsInfoPage from "./creditsInfoPage.md?raw";
import emptyStateBody from "./emptyStateBody.md?raw";
import onboardingBody from "./onboardingBody.md?raw";
import onboardingDisclaimer from "./onboardingDisclaimer.md?raw";
import rtsInfoPage from "./rtsInfoPage.md?raw";

const commonMonthlyReportCopy = {
  egt: {
    label: "Earned Good Time",
    value: `{{pluralize "days" totalEGTCreditDays true}}`,
  },
  boosts: {
    label: "Boosts",
    value: `{{pluralize "days" totalBoostCreditDays true}}`,
  },
  completion: {
    label: "Completion Credits",
    value: `{{pluralize "days" totalCompletionCreditDays true}}`,
  },
};

// where handlebars is invoked, assume a UsMaResidentMetadata object as the template context
export const usMaEGTCopy = {
  lastUpdated:
    "This information was last updated on {{formatFullDate lastUpdatedDate}}",
  tags: {
    rts: "RTS",
    maxRelease: "MAX",
  },
  home: {
    pageTitle: "Earned Time Overview",
    dates: {
      sectionTitle: "Important dates",
      rts: {
        label: "Release-to-supervision date",
        value: "{{formatFullDateOptional rtsDate 'No RTS date'}}",
        summary: `The RTS Date is a release to parole supervision without the need for a 
          parole hearing, based upon completion credits earned through programming 
          and education pursuant to M.G.L.c.127, §129D.`,
        moreInfoLink: "Learn more about RTS",
      },
      maxRelease: {
        label: "Maximum release / wrap date",
        value:
          "{{formatFullDateOptional adjustedMaxReleaseDate 'No MAX date'}}",
        summary: `You’ve earned {{pluralize "days" totalStateCreditDaysCalculated true}} off your maximum release / wrap date.`,
        breakdown: {
          original: {
            label: "Original MAX date",
            value: "{{formatFullDate originalMaxReleaseDate}}",
          },
          change: {
            label: "Total reduction",
            value: '-{{pluralize "days" totalStateCreditDaysCalculated true}}',
          },
          adjusted: {
            label: "Adjusted MAX date",
            value: "{{formatFullDate adjustedMaxReleaseDate}}",
          },
        },
      },
      parole: {
        label: "Parole eligibility date",
        tag: "PE",
        summary:
          "Questions regarding the calculation of parole eligibility dates should be directed to the Institutional Parole Officer.",
      },
    },
    totalTimeEarned: {
      sectionTitle: "Total time you’ve earned",
      egt: {
        label: "Earned Good Time + Boosts",
        value: `{{pluralize "days" totalStateCredit true}}`,
      },
      credits: {
        label: "Completion Credits",
        value: `{{pluralize "days" totalCompletionCredit true}}`,
      },
    },
    creditHistory: {
      heading: "Time you’ve earned recently",
      legend: {
        [usMaEarnedCreditTypes.enum.EARNEDGoodTime]: "Earned Good Time",
        [usMaEarnedCreditTypes.enum.BOOST]: "Boosts",
        [usMaEarnedCreditTypes.enum.COMPLETION]: "Completion Credits",
      },
      creditLabel: "{{pluralize 'days' value true}}",
    },
    monthlyReport: {
      sectionTitle: "Recent monthly reports",
      individualReportLink: `See {{monthDisplayName}} report`,
      ...commonMonthlyReportCopy,
    },
  },
  creditRatings: {
    S: "Satisfactory",
    I: "Incomplete",
    U: "Unsatisfactory",
  },
  individualMonthlyReport: {
    pageTitle: "Monthly Report",
    browserPageTitle: "{{reportDisplayName}} Report",
    credits: {
      sectionTitle:
        "Earned time and program participation in {{monthDisplayName}}",
      ...commonMonthlyReportCopy,
      table: {
        columnHeaders: {
          program: "Program",
        },
        aggregateColumn: {
          label: "Total time earned",
        },
      },
    },
    dateChanges: {
      heading: "Release date changes in {{monthDisplayName}}",
      rtsSummary:
        "You earned {{pluralize 'days' totalRtsDateCreditDays true}} off your release-to-supervision date",
      rtsTotal: " {{pluralize 'days' totalRtsDateCreditDays true}}",
      maxSummary:
        "You earned {{pluralize 'days' totalMaxDateCreditDays true}} off your maximum release / wrap date",
      maxTotal: "{{pluralize 'days' totalMaxDateCreditDays true}}",
      totalsLabel: "Total",
    },
    achievements: {
      heading: "Achievements",
      maxEarnedTime: {
        heading: "Earned Good Time",
        body: "You earned the maximum possible earned good time this month",
      },
    },
  },
  infoPages: {
    rts: {
      heading: "Release-to-supervision date",
      body: rtsInfoPage,
    },
    credits: {
      heading: "Earned Good Time, Boosts, and Completion Credits",
      body: creditsInfoPage,
    },
  },
  topLinkText: "Back to top",
  definitionsLinksHeading: "Other definitions",
  homeLink: "Back to home",
  onboarding: {
    heading: "Track your Earned Good Time",
    body: onboardingBody,
    continueLink: "See your earned time",
    disclaimer: onboardingDisclaimer,
  },
  emptyState: {
    heading: "You haven’t done any programs or work that earn you time.",
    body: emptyStateBody,
    moreInfoLink: "Learn more about earned time",
  },
};

export type UsMaMonthlyReportCopy = typeof commonMonthlyReportCopy;
export type UsMaEgtCopy = typeof usMaEGTCopy;
