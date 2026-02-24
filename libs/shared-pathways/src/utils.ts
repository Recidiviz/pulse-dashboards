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

import moment from "moment";

import {
  LengthOfStay,
  LengthOfStayRawValue,
  SnapshotDataRecord,
  TimePeriod,
  TimePeriodRawValue,
} from "./types";

export const timePeriodMap = {
  months_0_6: "6",
  months_7_12: "12",
  months_13_24: "24",
  months_25_60: "60",
} as Record<TimePeriodRawValue, TimePeriod>;

export const lengthOfStayMap = {
  months_0_3: "3",
  months_3_6: "6",
  months_6_9: "9",
  months_9_12: "12",
  months_12_15: "15",
  months_15_18: "18",
  months_18_21: "21",
  months_21_24: "24",
  months_24_36: "36",
  months_36_48: "48",
  months_48_60: "60",
  unknown: "UNKNOWN",
  all: "ALL",
} as Record<LengthOfStayRawValue, LengthOfStay>;

export function convertLengthOfStay(
  record: SnapshotDataRecord,
): LengthOfStay | undefined {
  return (
    record.lengthOfStay &&
    lengthOfStayMap[record.lengthOfStay.toLowerCase() as LengthOfStayRawValue]
  );
}

export interface TimeSeriesRecord {
  month: number;
  year: number;
}

export function getRecordDate(d: TimeSeriesRecord): Date {
  return new Date(d.year, d.month - 1);
}

export const formatDateString = (dateString: string): Date | undefined => {
  if (!moment(dateString, "YYYY-MM-DD", true).isValid()) return undefined;
  const [year, month, day] = dateString.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
};

export const getTimePeriodRawValue = (
  months: string | number,
): string | undefined => {
  return Object.keys(timePeriodMap).find(
    (timePeriodRawValue) =>
      timePeriodMap[timePeriodRawValue as TimePeriodRawValue] ===
      String(months),
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateDynamicFilterOptions = (filterOption: any): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const correctFormat = filterOption.filter((o: any) => {
    return o.value && o.label;
  });
  return (
    correctFormat.length === filterOption.length && filterOption.length > 0
  );
};

export function isAbortException(error: Error): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

