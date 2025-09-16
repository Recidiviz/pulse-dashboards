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

import disclaimer from "./disclaimer.md?raw";

export default {
  tags: {
    rts: "RTS",
    maxRelease: "MAX",
  },
  lastUpdated:
    "This information was last updated on {{lastUpdatedDate, formatFullDate}}. It updates once per month.",
  home: {
    pageTitle: "Earned Time Overview",
    dates: {
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
      },
    },
    totalTimeEarned: {
      sectionTitle: "Total time you’ve earned",
      egtBoostsLabel: "Earned Good Time + Boosts",
      completionLabel: "Completion Credits",
      creditsValue_one: `{{count, number}} day`,
      creditsValue_other: `{{count, number}} days`,
      learnMoreLink: "Learn more about earned time",
    },
  },
  disclaimer,
};
