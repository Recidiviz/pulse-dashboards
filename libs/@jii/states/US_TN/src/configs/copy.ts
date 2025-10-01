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

import { UsTnCreditType } from "~datatypes";

import sentenceCreditsInfoPage from "./sentenceCreditsInfoPage.md?raw";

export const usTnCopy = {
  monthlyCreditReportSummary: {
    sectionHeader: "Recent monthly reports",
    creditCategories: {
      behavior: "Behavior Credits",
      program: "Program Credits",
      treatment: "Treatment Good Time Credits",
      education: "Education Good Time Credits",
    },
    creditTypes: {
      PROGRAM: "Program",
      "60_DAY_ED_CREDIT": "60 Day Education Credit",
      "60_DAY_TREATMENT": "60 Day Treatment",
      BEHAVIOR: "Behavior",
      BONUS_BEHAVIOR: "Bonus Behavior",
      DRUG_ALCOHOL: "Treatment",
      GED: "GED",
      BONUS_PROGRAM: "Bonus Program",
      REMOVAL: "Removal",
    } satisfies Record<UsTnCreditType, string>,
    unknownCreditType: "Unknown",
    noMonthlyReport: "No credit activity for this month.",
    totalCredits: "Total Credits",
    reportTags: {
      GAIN: "Earned",
      LOSS: "Lost",
    },
    reportColumns: {
      creditType: "Credit Type",
      status: "Status",
      amount: "Days",
      creditDate: "Date",
    },
    moreInfo: {
      heading: "About Your Monthly Credit Reports",
      body: sentenceCreditsInfoPage,
    },
  },
  monthlyCreditReport: {
    pageTitle: "Monthly Report",
  },
};
