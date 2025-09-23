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

import { UsMaEarnedCreditType, usMaEarnedCreditTypes } from "~datatypes";

import creditsInfoPage from "./creditsInfoPage.md?raw";
import disclaimer from "./disclaimer.md?raw";
import emptyStateBody from "./emptyStateBody.md?raw";
import onboardingBody from "./onboardingBody.md?raw";
import rtsInfoPage from "./rtsInfoPage.md?raw";
import unknownUserBody from "./unknownUserBody.md?raw";

const daysTemplate = {
  singular: "{{count, number}} day",
  plural: "{{count, number}} days",
};

const commonMonthlyReportCopy = {
  egtLabel: "Earned Good Time",
  boostsLabel: "Boosts",
  completionLabel: "Completion Credits",
  creditsValue_one: daysTemplate.singular,
  creditsValue_other: daysTemplate.plural,
};

export default {
  tags: {
    rts: "RTS",
    maxRelease: "MAX",
  },
  lastUpdated:
    "This information was last updated on {{lastUpdatedDate, formatFullDate}}. It updates once per month.",
  creditRatings: {
    S: "Satisfactory",
    I: "Incomplete",
    U: "Unsatisfactory",
    none: "Unknown",
  },
  home: {
    pageTitle: "Earned Time Overview",
    dates: {
      sectionTitle: "Important dates",
      rts: {
        label: "Release-to-supervision date",
        value: "{{rtsDate, formatFullDate(fallbackText: 'No RTS date')}}",
        summary: `The RTS Date is a release to parole supervision without the need for a
          parole hearing, based upon completion credits earned through programming
          and education pursuant to M.G.L.c.127, §129D.`,
        moreInfoLink: "Learn more about RTS",
      },
      maxRelease: {
        label: "Maximum release / wrap date",
        value:
          "{{adjustedMaxReleaseDate, formatFullDate(fallbackText: 'No MAX date')}}",
        summary_one: `You’ve earned ${daysTemplate.singular} off your maximum release / wrap date.`,
        summary_other: `You’ve earned ${daysTemplate.plural} off your maximum release / wrap date.`,
        breakdown: {
          original: {
            label: "Original MAX date",
            value: "{{ originalMaxReleaseDate, formatFullDate}}",
          },
          change: {
            label: "Total reduction",
            value_one: `-${daysTemplate.singular}`,
            value_other: `-${daysTemplate.plural}`,
          },
          adjusted: {
            label: "Adjusted MAX date",
            value: "{{ adjustedMaxReleaseDate, formatFullDate}}",
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
    creditHistory: {
      heading: "Time you’ve earned recently",
      legend: {
        [usMaEarnedCreditTypes.enum.EARNEDGoodTime]: "Earned Good Time",
        [usMaEarnedCreditTypes.enum.BOOST]: "Boosts",
        [usMaEarnedCreditTypes.enum.COMPLETION]: "Completion Credits",
      } satisfies Record<UsMaEarnedCreditType, string>,
      // creditLabel: "{{pluralize 'days' value true}}",
      creditLabel_one: daysTemplate.singular,
      creditLabel_other: daysTemplate.plural,
      monthLabel: "{{creditMonth, datetime(month: 'short')}}",
      noDataMessage: "You haven’t earned time yet.",
    },
    monthlyReport: {
      sectionTitle: "Recent monthly reports",
      individualReportLink: `See {{reportDate, datetime(month: 'long')}} report`,
      ...commonMonthlyReportCopy,
    },
    totalTimeEarned: {
      sectionTitle: "Total time you’ve earned",
      egtBoostsLabel: "Earned Good Time + Boosts",
      completionLabel: "Completion Credits",
      creditsValue_one: daysTemplate.singular,
      creditsValue_other: daysTemplate.plural,
      learnMoreLink: "Learn more about earned time",
    },
    emptyState: {
      heading:
        "You haven’t done any programs or work that give you Earned Good Time.",
      body: emptyStateBody,
      moreInfoLink: "Learn more about earned time",
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
  homeLink: "Back to home",
  topLinkText: "Back to top",
  definitionsLinksHeading: "Other definitions",
  individualMonthlyReport: {
    pageTitle: "Monthly Report",
    browserPageTitle: "{{reportStartDate, formatMonthYear}} Report",
    credits: {
      sectionTitle:
        "Earned time and program participation in {{reportStartDate, datetime(month: long)}}",
      table: {
        columnHeaders: {
          program: "Program",
        },
        aggregateColumn: {
          label: "Total time earned",
        },
        valueCell: "{{value, number}}",
      },
      ...commonMonthlyReportCopy,
    },
    achievements: {
      heading: "Achievements",
      maxEarnedTime: {
        heading: "Earned Good Time",
        body: "You earned the maximum possible earned good time this month",
      },
    },
    selectOptionLabel: "{{reportStartDate, formatMonthYear}}",
  },
  disclaimer,
  unknownUser: {
    heading: "Login Failed",
    body: unknownUserBody,
  },
  onboarding: {
    heading: "Track your Earned Good Time",
    body: onboardingBody,
    continueLink: "See your earned time",
  },
};
