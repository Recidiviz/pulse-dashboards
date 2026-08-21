// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

// TODO(OBT-45582): Aggregate all remaining CRE page copy (titles, subtitles, empty states, etc.) into this config

const location = "NYC";

export const US_NYC_CONTENT = {
  cre: {
    footer: {
      aboutHeading: "About Opportunities",
      aboutBody: `This app helps you find community resources in ${location}. It was designed and built by Recidiviz, a technology nonprofit working towards a more fair and safe criminal justice system.`,
      labelsHeading: "What the service labels mean",
      serviceLabels: [
        {
          label: "Se habla Español",
          description:
            "The symbol next to the name of an organization means they have Spanish speaking staff or interpreters for Spanish speakers.",
        },
        {
          label: "Can contact pre-release",
          description:
            "The organization works with people who are currently incarcerated, and can be contacted pre-release, or by court or attorney referral.",
        },
        {
          label: "Offers diversion programs",
          description:
            "The organization offers alternative-to-incarceration (ATI) programs. These may also be called alternative-to-detention or diversion programs.",
        },
      ],
      disclaimerLabel: "Disclaimer:",
      disclaimer:
        "This information is for general purposes only. It is not legal or medical advice. Organizations, hours, and services change often. Always call ahead or check with the organization when you can. Resource listings adapted from Connections 2026 © The New York Public Library, licensed CC BY-NC 4.0. Edited by Kate Heenan. Compiled before November 2025.",
    },
  },
};
