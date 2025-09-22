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

import creditsInfoPage from "./creditsInfoPage.md?raw";
import onboardingBody from "./onboardingBody.md?raw";
import rtsInfoPage from "./rtsInfoPage.md?raw";

// where handlebars is invoked, assume a UsMaResidentMetadata object as the template context
export const usMaEGTCopy = {
  individualMonthlyReport: {
    pageTitle: "Monthly Report",
    browserPageTitle: "{{reportDisplayName}} Report",
    credits: {
      sectionTitle:
        "Earned time and program participation in {{monthDisplayName}}",
      table: {
        columnHeaders: {
          program: "Program",
        },
        aggregateColumn: {
          label: "Total time earned",
        },
      },
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
  },
};

export type UsMaEgtCopy = typeof usMaEGTCopy;
