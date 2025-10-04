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

import acisTprDateInfoPage from "./acisTprDateInfoPage.md?raw";
import csbdDateInfoPage from "./csbdDateInfoPage.md?raw";
import csedDateInfoPage from "./csedDateInfoPage.md?raw";
import ercdDateInfoPage from "./ercdDateInfoPage.md?raw";
import sedDateInfoPage from "./sedDateInfoPage.md?raw";

export const usAzCopy = {
  lastUpdated:
    "This information was last updated XXXX. It updates once per month.",
  goLink: "Learn more about ",
  noDate: "None on record",
  fromToday: "from today",
  importantDates: {
    sectionHeader: "Your important dates",
    sectionSubHeader:
      "These are all the dates that Time Computation has calculated for your sentence. Dates may change if you get a disciplinary infraction, or get lost time restored. Tap “Learn More” to see what you need to do in order to be released on any date.",
    dates: {
      acisTprDate: {
        title: "Standard Transition Program (TPR)",
        info: "Release up to 90 days earlier, if you agree to attend a program in the community; must meet criteria.",
        shortName: "TPR",
        moreInfo: {
          heading: "Standard Transition Program",
          body: acisTprDateInfoPage,
        },
      },
      csbd: {
        title: "Community Supervision Begin Date (CSBD)",
        info: `Also called a Transition Release (TR) date, allows for release up to 90 days before your ERCD; must meet criteria.`,
        shortName: "CSBD",
        moreInfo: {
          heading: "Community Supervision Begin Date (CSBD)",
          body: csbdDateInfoPage,
        },
      },
      ercd: {
        title: "Earned Release Credit Date (ERCD)",
        info: `The earliest date you can be released based on Earned Release Credits – usually, a minimum of 85.7% of your sentence.`,
        shortName: "ERCD",
        moreInfo: {
          heading: "Earned Release Credit Date (ERCD)",
          body: ercdDateInfoPage,
        },
      },
      sed: {
        title: "100% Date (Flat Sentence, SED)",
        info: `The full term of your sentence; when you will be released, unless you decline conditions of supervision.`,
        shortName: "SED",
        moreInfo: {
          heading: "100% Date (Flat Sentence, SED)",
          body: sedDateInfoPage,
        },
      },
      csed: {
        title: "115% Date (CSED)",
        info: `The last day that you can be under ADCRR supervision for your current sentence.`,
        shortName: "CSED",
        moreInfo: {
          heading: "115% Date (CSED)",
          body: csedDateInfoPage,
        },
      },
    },
  },
};
