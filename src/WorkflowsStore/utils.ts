// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { addDays, differenceInDays, parseISO } from "date-fns";
import { Timestamp } from "firebase/firestore";

import { StaffRecord } from "../firestore/types";
import { isDemoMode } from "../utils/isDemoMode";

export function dateToTimestamp(isodate: string): Timestamp {
  return new Timestamp(new Date(isodate).getTime() / 1000, 0);
}

// dates in demo fixtures will be shifted relative to this date
const DEMO_TIMESTAMP = parseISO("2021-12-16");

/**
 * Shifts a given date forward by the difference between the current date
 * and the static "demo date" used for fixture data, bringing the dates
 * in demo fixtures up to date relative to today.
 */
export function shiftDemoDate(storedDate: Date): Date {
  const offsetDays = differenceInDays(new Date(), DEMO_TIMESTAMP);
  return addDays(storedDate, offsetDays);
}

export class OpportunityValidationError extends Error {}

/**
 * Given a raw field from Firestore, converts it to a Date.
 * When Demo Mode is active, it also applies a time shift so that
 * the date from demo fixture data is relevant to the current date.
 */
export function fieldToDate(field: Timestamp | string): Date {
  let result: Date;
  if (typeof field === "string") {
    result = parseISO(field);
  } else {
    result = field.toDate();
  }
  if (isDemoMode()) {
    result = shiftDemoDate(result);
  }

  return result;
}

export function optionalFieldToDate(
  field?: Timestamp | string
): Date | undefined {
  if (field) return fieldToDate(field);
}

export function fieldToDateArray(field: Timestamp[] | string[]): Date[] {
  return field.map((d: Timestamp | string) => fieldToDate(d));
}

export function optionalFieldToDateArray(
  field?: Timestamp[] | string[]
): Date[] | undefined {
  if (field) return fieldToDateArray(field);
}

export function staffNameComparator(a: StaffRecord, b: StaffRecord): number {
  const alphabetAndSpacesOnlyRegex = /[^a-zA-Z\s]+/g;

  const surnameA = String(a.surname)
    .toLowerCase()
    .replace(alphabetAndSpacesOnlyRegex, "");
  const givenNamesA = String(a.givenNames)
    .toLowerCase()
    .replace(alphabetAndSpacesOnlyRegex, "");

  const surnameB = String(b.surname)
    .toLowerCase()
    .replace(alphabetAndSpacesOnlyRegex, "");
  const givenNamesB = String(b.givenNames)
    .toLowerCase()
    .replace(alphabetAndSpacesOnlyRegex, "");

  if (surnameA > surnameB) return 1;
  if (surnameA < surnameB) return -1;
  if (surnameA === surnameB) {
    return String(givenNamesA).localeCompare(givenNamesB);
  }
  return 0;
}

export const OTHER_KEY = "Other";
