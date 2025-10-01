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

import { daysTemplate } from "~@jii/translation";

import importantDatesInfoPage from "./importantDatesInfoPage.md?raw";

export default {
  importantDates: {
    sectionHeading: "Important Dates",
    releaseEligibilityDate: {
      label: "Release Eligibility Date",
      contents:
        "{{releaseEligibilityDate, formatFullDate(fallbackText: 'No release eligibility date on record')}}",
    },
    expirationDate: {
      label: "Expiration Date",
      contents:
        "{{expirationDate, formatFullDate(fallbackText: 'No expiration date on record')}}",
      reduction_one: `You've earned ${daysTemplate.singular} off your Expiration Date`,
      reduction_other: `You've earned ${daysTemplate.plural} off your Expiration Date`,
    },
    moreInfo: {
      heading: "About Your Dates",
      body: importantDatesInfoPage,
    },
  },
};
