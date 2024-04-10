// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Opportunity } from "../../../../types";

type snoozeDays = {
  type: "snoozeDays";
  params: {
    days: number;
  };
};

type snoozeUntil = {
  type: "snoozeUntil";
  params: {
    weekday:
      | "Monday"
      | "Tuesday"
      | "Wednesday"
      | "Thursday"
      | "Friday"
      | "Saturday"
      | "Sunday";
  };
};

type AutoSnoozeFn = snoozeDays | snoozeUntil;

/** Auto refers to users who have a default snooze until set.
 * autoSnoozeParams is used to calculate the default snooze until,
 * e.g. weekly on Mondays or 90 days.
 * */
export type AutoSnoozeUntil = {
  autoSnoozeParams: AutoSnoozeFn;
  maxSnoozeDays?: never;
  defaultSnoozeDays?: never;
};

/** Manual refers to users who are able to set the number of days to snooze until.
 * maxSnoozeDays sets the max number of days on the slider.
 */
type ManualSnoozeUntil = {
  defaultSnoozeDays: number;
  maxSnoozeDays: number;
  autoSnoozeParams?: never;
};

export type SnoozeConfiguration =
  | (Omit<AutoSnoozeUntil, "autoSnoozeParams"> & {
      autoSnoozeParams: (snoozedOn: Date, opportunity?: Opportunity) => Date;
    })
  | ManualSnoozeUntil;
export type SnoozeConfigurationInput = AutoSnoozeUntil | ManualSnoozeUntil;
