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

// where handlebars is invoked, assume a UsMaResidentMetadata object as the template context
export const usMaEGTCopy = {
  home: {
    lastUpdated:
      "This information was last updated on {{formatFullDate lastUpdatedDate}}",
    moreInfoButton: "Learn more",
    dates: {
      sectionTitle: "Important dates",
      rts: {
        label: "Release-to-supervision date",
        tag: "RTS",
        value: "{{formatFullDateOptional rtsDate}}",
        moreInfo: "Lorem ipsum",
      },
      maxRelease: {
        label: "Maximum release / wrap date",
        tag: "MAX",
        value: "{{formatFullDateOptional adjustedMaxReleaseDate}}",
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
        value:
          "Ask your Institutional Parole Officer about parole eligibility date calculations.",
      },
    },
  },
};

export type UsMaEgtCopy = typeof usMaEGTCopy;
