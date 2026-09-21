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

import { ascending } from "d3-array";
import { startOfDay, subMonths } from "date-fns";

import { useSingleResidentContext } from "~@jii/data";

import { useUsAzSingleResidentContext } from "../UsAzSingleResidentContext/UsAzSingleResidentContext";

export function useShowIONBanner(): boolean {
  const {
    residentFlags: { usAzIonReferral },
  } = useSingleResidentContext();
  const { displayedDates } = useUsAzSingleResidentContext();

  if (!usAzIonReferral) return false;

  const earliestDate = displayedDates
    // exclude tentative dates, e.g. unapproved TPR dates
    .filter((d) => !d.isTentative)
    .sort((a, b) => ascending(a.date, b.date))[0];

  if (!earliestDate) return false;

  // confirmed the eligibility target is 11 full months to the day, not calendar months
  return startOfDay(subMonths(earliestDate.date, 11)) <= new Date();
}
