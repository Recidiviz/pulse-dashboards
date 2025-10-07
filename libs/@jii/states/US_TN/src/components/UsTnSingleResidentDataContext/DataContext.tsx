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

import { observer } from "mobx-react-lite";
import { FC, ReactNode } from "react";

import { useSingleResidentContext } from "~@jii/data";
import { UsTnResidentMetadata } from "~datatypes";

import {
  UsTnMonthlyReports,
  UsTnSingleResidentDataContextProvider,
} from "./context";

/**
 * Provides a context with resident metadata narrowed to a type that supports EGT features.
 * Consume this context with `useEGTDataContext()`
 */
export const UsTnSingleResidentDataContext: FC<{ children: ReactNode }> =
  observer(function UsTnDataContext({ children }) {
    const {
      resident: { metadata },
    } = useSingleResidentContext();

    const data = metadata?.stateCode === "US_TN" ? metadata : undefined;

    if (!data) {
      throw new Error(
        `Unexpected state code for UsTnDataContext: ${metadata.stateCode}`,
      );
    }

    const monthlyReports = processMonthlyReports(data);

    return (
      <UsTnSingleResidentDataContextProvider
        value={{
          data,
          monthlyReports,
        }}
      >
        {children}
      </UsTnSingleResidentDataContextProvider>
    );
  });

export function processMonthlyReports(
  metadata: UsTnResidentMetadata,
): UsTnMonthlyReports {
  const monthlyReports: UsTnMonthlyReports = {};

  metadata.creditActivity.forEach((record) => {
    const { creditDate, creditType, creditsEarned } = record;

    const formattedMonth = Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(creditDate);

    const monthSlug = formattedMonth.replace(" ", "-").toLowerCase();

    if (!monthlyReports[monthSlug]) {
      monthlyReports[monthSlug] = {
        formattedMonth,
        monthSlug,
        date: creditDate,
        behaviorCredits: 0,
        programCredits: 0,
        educationCredits: 0,
        treatmentCredits: 0,
        creditRemovals: 0,
        reports: [],
        totalCredits: 0,
      };
    }

    monthlyReports[monthSlug].reports.push(record);

    if (creditsEarned === null) return;

    monthlyReports[monthSlug].totalCredits += creditsEarned;

    switch (creditType) {
      case "BEHAVIOR":
      case "BONUS_BEHAVIOR":
        monthlyReports[monthSlug].behaviorCredits += creditsEarned;
        break;
      case "PROGRAM":
      case "BONUS_PROGRAM":
        monthlyReports[monthSlug].programCredits += creditsEarned;
        break;
      case "60_DAY_ED_CREDIT":
      case "GED":
        monthlyReports[monthSlug].educationCredits += creditsEarned;
        break;
      case "60_DAY_TREATMENT":
      case "DRUG_ALCOHOL":
        monthlyReports[monthSlug].treatmentCredits += creditsEarned;
        break;
      case "REMOVAL":
        monthlyReports[monthSlug].creditRemovals += creditsEarned;
    }
  });

  return monthlyReports;
}
