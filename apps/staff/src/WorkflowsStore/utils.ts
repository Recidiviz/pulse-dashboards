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

import assertNever from "assert-never";
import {
  add,
  addDays,
  differenceInDays,
  endOfToday,
  getMonth,
  getYear,
  parseISO,
} from "date-fns";
import { Timestamp } from "firebase/firestore";
import moment from "moment";

import { SystemId } from "../core/models/types";
import { WORKFLOWS_SYSTEM_ID_TO_PAGE, WorkflowsPage } from "../core/views";
import {
  AutoSnoozeUpdate,
  CombinedUserRecord,
  ManualSnoozeUpdate,
  StaffRecord,
} from "../FirestoreStore/types";
import { ActiveFeatureVariantRecord } from "../RootStore/types";
import { isDemoMode } from "../utils/isDemoMode";
import {
  OPPORTUNITY_CONFIGS,
  OpportunityType,
} from "./Opportunity/OpportunityConfigs";
import { StaffFilterFunction } from "./types";

/**
 * Returns a string of the month and year formatted as "MM_YYYY"
 */
export function getMonthYearFromDate(date: Date): string {
  const month = getMonth(date) + 1;
  return month < 10
    ? `0${month}_${getYear(date)}`
    : `${month}_${getYear(date)}`;
}

export function formatSupervisionType(supervisionType: string): string {
  return supervisionType.replace("_", " ");
}

export function dateToTimestamp(isodate: string): Timestamp {
  return new Timestamp(new Date(isodate).getTime() / 1000, 0);
}

export function validatePhoneNumber(phoneNumber: string | undefined): boolean {
  if (!phoneNumber) return false;
  const phoneNumberRegex = /^\d{10}$/;
  return phoneNumberRegex.test(clearPhoneNumberFormatting(phoneNumber));
}

export function clearPhoneNumberFormatting(phoneNumber: string) {
  return phoneNumber.replace(/\D/g, "");
}

export function formatPhoneNumber(phoneNumber: string): string {
  const digitsOnly = clearPhoneNumberFormatting(phoneNumber);
  const formattedPhoneNumber = digitsOnly.replace(
    /(\d{3})(\d{3})(\d{4})/,
    "($1) $2-$3",
  );

  return formattedPhoneNumber;
}

export function formatFacilityHousingUnit(
  facilityId: string | undefined,
  unitId: string | undefined,
): string {
  const formattedFacilityHousingUnit = `${facilityId ?? ""}${
    facilityId && unitId ? "/" : ""
  }${unitId ?? ""}`;
  return formattedFacilityHousingUnit;
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
  field?: Timestamp | string,
): Date | undefined {
  if (field) return fieldToDate(field);
}

export function fieldToDateArray(field: Timestamp[] | string[]): Date[] {
  return field.map((d: Timestamp | string) => fieldToDate(d));
}

export function optionalFieldToDateArray(
  field?: Timestamp[] | string[],
): Date[] | undefined {
  if (field) return fieldToDateArray(field);
}

export function fractionalDateBetweenTwoDates(
  dateLeft: Date | undefined,
  dateRight: Date | undefined,
  fractionalPortion: number,
): Date | undefined {
  if (dateLeft && dateRight) {
    const diffInDays = moment(dateRight).diff(moment(dateLeft), "days");
    const fractionOfDays = Math.floor(diffInDays * fractionalPortion);
    const fractionalDate = moment(dateLeft)
      .add(fractionOfDays, "days")
      .toDate();
    return fractionalDate;
  }
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

type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];
export const getEntries = <T extends object>(obj: T) =>
  Object.entries(obj) as Entries<T>;

export function getJusticeInvolvedPersonTitle(
  systemId: SystemId | undefined,
): string {
  switch (systemId) {
    case "INCARCERATION":
      return "resident";
    case "SUPERVISION":
      return "client";
    case "ALL":
    case undefined:
      return "person";
    default:
      assertNever(systemId);
  }
}

export function getSystemIdFromOpportunityType(
  opportunityType: OpportunityType,
): SystemId {
  return OPPORTUNITY_CONFIGS[opportunityType].systemType;
}

export function getSystemIdFromPage(page: WorkflowsPage): SystemId | undefined {
  if (WORKFLOWS_SYSTEM_ID_TO_PAGE.INCARCERATION.includes(page)) {
    return "INCARCERATION";
  }
  if (WORKFLOWS_SYSTEM_ID_TO_PAGE.SUPERVISION.includes(page)) {
    return "SUPERVISION";
  }
  if (WORKFLOWS_SYSTEM_ID_TO_PAGE.ALL.includes(page)) {
    return "ALL";
  }
}

export const filterByUserDistrict: StaffFilterFunction = (
  user: CombinedUserRecord,
  featureVariants: ActiveFeatureVariantRecord,
) => {
  if (featureVariants.supervisionUnrestrictedSearch) return;

  let filterValues = user.updates?.overrideDistrictIds;

  if (!filterValues?.length) {
    if (user.info.district) {
      filterValues = [user.info.district];
    } else {
      return undefined;
    }
  }

  return {
    filterField: "district",
    filterValues,
  };
};

export const usCaFilterByRoleSubtype: StaffFilterFunction = (
  user: CombinedUserRecord,
  featureVariants: ActiveFeatureVariantRecord,
) => {
  if (featureVariants.supervisionUnrestrictedSearch) return;

  // TODO(#4618): Consider getting rid of the role subtype comparison and replacing the relevant
  // logic with a feature variant

  // Regular Parole Agents only get access to their own caseload If we don't have a district for a
  // user and we didn't list them as leadership, restrict them to their own caseload as well.
  if (
    user.info.roleSubtype === "SUPERVISION_OFFICER" ||
    (!user.info.district && !user.updates?.overrideDistrictIds)
  ) {
    return {
      // Use email instead of id because users might not have a staff record or an id set in the
      // admin panel
      filterField: "email",
      filterValues: [user.info.email],
    };
  }

  // Parole Agent supervisors only get access to their own unit (district in our schema)
  return filterByUserDistrict(user, featureVariants);
};

/* Returns the snooze until date from either the auto or manual snooze updates. */
export function getSnoozeUntilDate({
  snoozeUntil,
  snoozeForDays,
  snoozedOn,
}: Partial<AutoSnoozeUpdate | ManualSnoozeUpdate>): Date | undefined {
  if (snoozeUntil) return parseISO(snoozeUntil);
  if (snoozedOn && snoozeForDays)
    return add(parseISO(snoozedOn), { days: snoozeForDays });
}

export function snoozeUntilDateInTheFuture(snoozeUntilDate: Date) {
  return snoozeUntilDate > endOfToday();
}