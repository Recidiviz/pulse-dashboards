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

import importantDatesInfoPage from "./importantDatesInfoPage.md?raw";

export default {
  importantDates: {
    sectionHeader: "Your Important Dates",
    eligibilityDate: {
      labels: {
        "Transfer Eligibility Date": "Transfer Eligibility Date",
        "Parole Eligibility Date": "Parole Eligibility Date",
        "Release Eligibility Date": "Release Eligibility Date",
      } as Record<string, string>,
      description:
        "The earliest date you can become eligible for transfer to community supervision.",
    },
    maximumReleaseDate: {
      label: "Maximum Release Date",
      description:
        "The latest date you can be held in custody, marking the full completion of your sentence.",
    },
    formatFullDate: "{{date, formatFullDate}}",
    moreInfoLink: "Learn more about dates",
    moreInfo: {
      heading: "Understanding Release Dates & Good Time",
      body: importantDatesInfoPage,
    },
  },
};
