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

import assertNever from "assert-never";
import { add, endOfToday, getMonth, getYear, parseISO } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { groupBy, mapValues } from "lodash";
import moment from "moment";

import { fieldToDate, OpportunityType, StaffRecord } from "~datatypes";

import { SystemId } from "../core/models/types";
import {
  INSIGHTS_PATHS,
  insightsUrl,
  WORKFLOWS_SYSTEM_ID_TO_PAGE,
  WorkflowsPage,
  workflowsUrl,
} from "../core/views";
import {
  AutoSnoozeUpdate,
  CombinedUserRecord,
  ManualSnoozeUpdate,
} from "../FirestoreStore/types";
import { ActiveFeatureVariantRecord } from "../RootStore/types";
import {
  Opportunity,
  OpportunityTab,
  OpportunityTabGroup,
} from "./Opportunity";
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

export function optionalFieldToDate(
  field?: Timestamp | string | null,
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
      // If the user doesn't have a district, only let them search for themselves
      return {
        filterField: "email",
        filterValues: [user.info.email],
      };
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

/**
 * Organizes opportunities by both opportunity type and the relevant tab grouping.
 */
export function opportunitiesByTab(
  allOpportunitiesByType: Partial<Record<OpportunityType, Opportunity[]>>,
  tabGroup?: OpportunityTabGroup,
): Partial<Record<OpportunityType, Record<OpportunityTab, Opportunity[]>>> {
  return mapValues(allOpportunitiesByType, (opps) => {
    return groupBy(opps, (opp) =>
      opp.tabTitle((tabGroup || Object.keys(opp.config.tabGroups)[0]) as any),
    ) as Record<OpportunityTab, Opportunity[]>;
  });
}

/**
 * Return the relevant url for the "navigate to form" button.
 */
export function getLinkToForm(
  pathname: string,
  urlSection: string,
  justiceInvolvedPersonPseudoId: string,
  officerPseudoId: string | undefined,
): string {
  const isInsights = pathname.startsWith(INSIGHTS_PATHS.supervision);
  const linkToForm =
    isInsights && officerPseudoId
      ? insightsUrl("supervisionOpportunityForm", {
          officerPseudoId,
          opportunityTypeUrl: urlSection,
          clientPseudoId: justiceInvolvedPersonPseudoId,
        })
      : workflowsUrl("opportunityAction", {
          urlSection,
          justiceInvolvedPersonId: justiceInvolvedPersonPseudoId,
        });
  return linkToForm;
}
export { fieldToDate };
