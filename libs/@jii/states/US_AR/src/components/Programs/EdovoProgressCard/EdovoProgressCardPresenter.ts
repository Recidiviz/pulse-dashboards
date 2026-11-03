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

import { makeAutoObservable } from "mobx";

import { UsArResidentJiiData } from "~@jii/schemas";

type MonthProgress = Pick<
  UsArResidentJiiData,
  | "edovoCarryInHours"
  | "edovoHoursThisMonth"
  | "edovoTotalHours"
  | "edovoHoursToNextCpu"
  | "edovoIsCreditingMonth"
>;

const HOURS_PER_UNIT = 16;
const arkansasMonth = (date: Date) =>
  date.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "numeric",
  });
const DEFAULT_VALUES: MonthProgress = {
  edovoCarryInHours: 0,
  edovoHoursThisMonth: 0,
  edovoTotalHours: 0,
  edovoHoursToNextCpu: HOURS_PER_UNIT,
  edovoIsCreditingMonth: false,
};

export class EdovoProgressCardPresenter {
  constructor(private metadata: UsArResidentJiiData) {
    makeAutoObservable(this);
  }

  // Whether the Edovo hours are for the current Arkansas month. The view picks the
  // month from the day it builds (edovoDataBuiltAt), not from when the Edovo table
  // was last copied over (edovoLastRefreshedAt). A missing build time counts as current.
  get isDataCurrent() {
    return (
      !this.metadata.edovoDataBuiltAt ||
      arkansasMonth(this.metadata.edovoDataBuiltAt) ===
        arkansasMonth(new Date())
    );
  }

  get progress(): MonthProgress {
    return this.isDataCurrent ? this.metadata : DEFAULT_VALUES;
  }

  // The percent of the progress bar taken up by hours from this month.
  get currentMonthWidth() {
    const { edovoCarryInHours, edovoHoursThisMonth, edovoIsCreditingMonth } =
      this.progress;
    // The backend floors each field to one decimal, so a credited month can sum
    // to just under 16. Fill the rest of the bar so it ends at the checkmark if a
    // cpu was earned that month
    if (edovoIsCreditingMonth) return 100 - this.carryInWidth;
    // Carry-in can reach 15 hours, so carry-in plus this month can pass 16.
    // The bar always shows all of the carry-in and gives this month only the space left.
    const currentMonthHours = Math.min(
      edovoHoursThisMonth,
      HOURS_PER_UNIT - edovoCarryInHours,
    );
    return (currentMonthHours / HOURS_PER_UNIT) * 100;
  }
  get carryInWidth() {
    return (this.progress.edovoCarryInHours / HOURS_PER_UNIT) * 100;
  }

  get hasCarryInHours() {
    return this.progress.edovoCarryInHours !== 0;
  }

  get completedKey() {
    return this.hasCarryInHours ? "totalHoursCompleted" : "hoursCompleted";
  }
}
