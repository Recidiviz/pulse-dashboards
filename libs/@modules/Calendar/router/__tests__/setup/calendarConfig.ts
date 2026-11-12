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

import {
  type CalendarConfig,
  type CalendarRules,
  WEEKDAYS,
} from "~@modules/Calendar/rules";

/**
 * A small synthetic calendar configuration for the generic server tests: two
 * sites, a SESSION kind that needs a site, a STAFF_MEETING kind that doesn't,
 * and a pattern for each. None of it is a real state's configuration.
 */
export const testCalendarConfig: CalendarConfig = {
  calendar: {
    code: "TEST_CALENDAR",
    name: "Test calendar",
  },
  resourceTypes: [{ code: "SITE", label: "Site", sortOrder: 1 }],
  resources: [
    {
      code: "SITE_A",
      typeCode: "SITE",
      label: "Site A",
      name: null,
      sortOrder: 10,
      isActive: true,
    },
    {
      code: "SITE_B",
      typeCode: "SITE",
      label: "Site B",
      name: null,
      sortOrder: 20,
      isActive: true,
    },
  ],
  kinds: [
    {
      code: "SESSION",
      label: "Session",
      sortOrder: 1,
    },
    {
      code: "STAFF_MEETING",
      label: "Staff meeting",
      sortOrder: 2,
    },
  ],
  patterns: [
    {
      kindCode: "SESSION",
      resourceCode: "SITE_A",
      rules: [{ type: "weekOfMonth", week: 1, weekday: "MONDAY" }],
      startTime: "08:00",
      endTime: null,
    },
    {
      kindCode: "SESSION",
      resourceCode: "SITE_B",
      rules: [{ type: "weekOfMonth", week: 2, weekday: "TUESDAY" }],
      startTime: "09:30",
      endTime: null,
    },
    {
      kindCode: "STAFF_MEETING",
      resourceCode: null,
      rules: [{ type: "everyWeekday", weekday: "FRIDAY" }],
      startTime: null,
      endTime: null,
    },
  ],
};

/**
 * The rules the test calendar's code would give the engine: settings, and
 * how SESSION and STAFF_MEETING entries behave.
 */
export const TEST_RULES: CalendarRules = {
  settings: {
    timezone: "America/Denver",
    weekStartsOn: "SUNDAY",
    weekNumbering: "FIRST_FULL_WEEK",
    holidayRegion: null,
    holidayPolicy: "WARN",
    editorRoute: "publicCalendar",
    allowedWeekdays: WEEKDAYS,
  },
  entryTypes: [
    {
      code: "SESSION",
      requiresResource: true,
      cancellable: false,
      deletable: true,
      isPublic: true,
      countsTowardTotal: true,
    },
    {
      code: "STAFF_MEETING",
      requiresResource: false,
      cancellable: true,
      deletable: true,
      isPublic: false,
      countsTowardTotal: false,
    },
  ],
};
