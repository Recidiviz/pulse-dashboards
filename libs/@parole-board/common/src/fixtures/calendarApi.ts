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

import type {
  CalendarApiConfig,
  MonthDetail,
  MonthListPage,
  MonthSummary,
  PublishPreview,
} from "../api/types";

// Synthetic calendar API responses for tests and examples. Editors are
// role names on example.com, and every id is made up.

const EDITOR_EMAIL = "editor-a@example.com";
const EDITED_AT = new Date("2026-10-01T16:00:00Z");

/** A DRAFT month as months.list returns it, untouched since months.create. */
export function monthSummary(
  overrides: Partial<MonthSummary> = {},
): MonthSummary {
  const year = overrides.year ?? 2026;
  const month = overrides.month ?? 11;
  return {
    id: `month-${year}-${month}`,
    year,
    month,
    status: "DRAFT",
    revision: 1,
    lastEditedAt: EDITED_AT,
    lastEditedByEmail: EDITOR_EMAIL,
    latestPublication: null,
    ...overrides,
  };
}

/** One page of months.list holding the given months, in the order given. */
export function monthListPage(
  items: MonthSummary[],
  cursors: Partial<Pick<MonthListPage, "nextCursor" | "prevCursor">> = {},
): MonthListPage {
  return { items, nextCursor: null, prevCursor: null, ...cursors };
}

/**
 * A DRAFT month as months.get returns it, with one hearing on the first
 * Monday and nothing else. Its counts are that hearing's, since months.get
 * counts the entries as they are now.
 */
export function monthDetail(overrides: Partial<MonthDetail> = {}): MonthDetail {
  return {
    ...monthSummary({
      year: overrides.year ?? 2026,
      month: overrides.month ?? 11,
    }),
    entries: [
      {
        id: "entry-1",
        date: "2026-11-02",
        kind: {
          code: "HEARING",
          label: "Hearing",
          cancellable: false,
          deletable: true,
          countsTowardTotal: true,
        },
        label: "Facility A",
        resource: {
          id: "resource-a",
          code: "FAC_A",
          label: "Facility A",
          typeCode: "FACILITY",
        },
        slotKey: "HEARING:FAC_A",
        startTime: null,
        endTime: null,
        source: "PATTERN",
        cancelled: false,
        cancelledAt: null,
        cancelledByEmail: null,
        holidayName: null,
        version: 1,
        updatedAt: EDITED_AT,
        updatedByEmail: EDITOR_EMAIL,
      },
    ],
    holidays: [],
    counts: { entryDays: 1, entryCount: 1 },
    ...overrides,
  };
}

/**
 * months.publishPreview for the September 2026 draft (see september2026): 13
 * hearing days, 37 hearings, never published and untouched since
 * months.create, with no entry on a holiday.
 */
export function publishPreview(
  overrides: Partial<PublishPreview> = {},
): PublishPreview {
  return {
    monthId: "month-2026-9",
    year: 2026,
    month: 9,
    status: "DRAFT",
    revision: 1,
    counts: { entryDays: 13, entryCount: 37 },
    holidayWarnings: [],
    latestPublication: null,
    ...overrides,
  };
}

/** A calendar config shaped like Colorado's, with one facility. */
export const calendarApiConfig: CalendarApiConfig = {
  calendar: {
    code: "PAROLE_BOARD_PUBLIC",
    name: "Parole Board public hearings",
    timezone: "America/Denver",
    weekStartsOn: "MONDAY",
    allowedWeekdays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    weekNumbering: "NTH_WEEKDAY_IN_MONTH",
    holidayRegion: "US-CO",
    holidayPolicy: "WARN",
  },
  kinds: [
    {
      id: "kind-hearing",
      code: "HEARING",
      label: "Hearing",
      requiresResource: true,
      cancellable: false,
      deletable: true,
      isPublic: true,
      countsTowardTotal: true,
      sortOrder: 1,
    },
  ],
  resourceTypes: [{ code: "FACILITY", label: "Facility", sortOrder: 1 }],
  resources: [
    {
      id: "resource-a",
      code: "FAC_A",
      name: "Facility A Correctional Center",
      label: "Facility A",
      typeCode: "FACILITY",
      sortOrder: 1,
    },
  ],
};
