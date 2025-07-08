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
import rtsInfoPage from "./rtsInfoPage.md?raw";

// where handlebars is invoked, assume a UsMaResidentMetadata object as the template context
export const usMaEGTCopy = {
  lastUpdated:
    "This information was last updated on {{formatFullDate lastUpdatedDate}}",
  home: {
    dates: {
      sectionTitle: "Important dates",
      rts: {
        label: "Release-to-supervision date",
        tag: "RTS",
        value: "{{formatFullDateOptional rtsDate 'No RTS date'}}",
        summary: `The RTS Date is a release to parole supervision without the need for a 
          parole hearing, based upon completion credits earned through programming 
          and education pursuant to M.G.L.c.127, §129D.`,
        moreInfoLink: "Learn more about RTS",
      },
      maxRelease: {
        label: "Maximum release / wrap date",
        tag: "MAX",
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
};

export type UsMaEgtCopy = typeof usMaEGTCopy;
