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

import { createContext } from "react";

import { useRequiredContext } from "~@jii/data";
import { UsTnCreditActivity, UsTnResidentMetadata } from "~datatypes";

export type UsTnMonthlyReport = {
  formattedMonth: string;
  monthSlug: string;
  month: Date;
  behaviorCredits: number;
  educationCredits: number;
  programCredits: number;
  treatmentCredits: number;
  creditRemovals: number;
  totalCredits: number;
  reports: UsTnCreditActivity[];
};

export type UsTnMonthlyReports = Record<string, UsTnMonthlyReport>;

export type UsTnDataContext = {
  data: UsTnResidentMetadata;
  monthlyReports: UsTnMonthlyReports;
};

const context = createContext<UsTnDataContext | undefined>(undefined);

export const UsTnSingleResidentDataContextProvider = context.Provider;

export function useUsTnSingleResidentDataContext() {
  return useRequiredContext(context);
}
