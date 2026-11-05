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
  // month from the day the Edovo table was last copied over (edovoLastRefreshedAt).
  // A missing refresh time counts as current.
  get isDataCurrent() {
    return (
      !this.metadata.edovoLastRefreshedAt ||
      arkansasMonth(this.metadata.edovoLastRefreshedAt) ===
        arkansasMonth(new Date())
    );
  }

  get progress(): MonthProgress {
    return this.isDataCurrent ? this.metadata : DEFAULT_VALUES;
  }

  get progressWidth() {
    return Math.min(this.progress.edovoTotalHours / HOURS_PER_UNIT, 1) * 100;
  }

  get hasCarryInHours() {
    return this.progress.edovoCarryInHours !== 0;
  }
  get totalHoursExceedsOneCredit() {
    return this.progress.edovoTotalHours > HOURS_PER_UNIT;
  }
}
