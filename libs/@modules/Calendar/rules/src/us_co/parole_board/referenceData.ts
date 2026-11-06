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

/**
 * The Colorado Parole Board calendar's initial rows: its Calendar identity,
 * resource types, entry kind rows, the 37 hearing locations as resources, and
 * the patterns that draft each month. Its settings and entry-type behaviour
 * are code in calendar.ts and entryTypes.ts. It is a typed fixture for
 * tests, such as the draft generator's Colorado test, and parses with
 * calendarConfigSchema like any state's configuration. It is not runtime data:
 * seed SQL files own the database's calendar, and later seed files may
 * change it without changing this fixture, so the two can differ.
 *
 * The hearing locations come from the Calendar Unit's facility patterns sheet,
 * in the sheet's row order, which is also the order within a day on the
 * public calendar design.
 */

import type { CalendarConfig } from "../../storage/calendarConfig";
import type { PatternRule, Weekday, WeekOfMonth } from "../../types";
import { US_CO_PAROLE_BOARD } from "./calendar";

/** The weekOfMonth rules for one week on each of weekdays. */
function weekOfMonth(week: WeekOfMonth, ...weekdays: Weekday[]): PatternRule[] {
  return weekdays.map((weekday) => ({ type: "weekOfMonth", week, weekday }));
}

interface HearingLocation {
  code: string;
  /** What the calendar shows for the location. */
  label: string;
  /**
   * The full name the editor shows on hover: CDOC's public name for a prison,
   * or the parole office location the Calendar Unit gave for a community site.
   * Never published.
   */
  name: string;
  typeCode: "FACILITY" | "COMMUNITY";
  rules: PatternRule[];
  /** "HH:mm", 24-hour Colorado local time. */
  startTime: string;
}

// Labels for CTCF, DCC, DRDC, SCC and ICCS/PUEBLO are assumptions, since the
// design doesn't show them: the code for the four facilities, and
// "ICCS/Pueblo" to match the other community labels. Prison names are the
// public names on cdoc.colorado.gov/facilities. ICC/FED and the community
// names are the parole office locations the Calendar Unit listed.
const HEARING_LOCATIONS: HearingLocation[] = [
  {
    code: "FCF",
    label: "FCF",
    name: "Fremont Correctional Facility",
    typeCode: "FACILITY",
    rules: [...weekOfMonth(1, "MONDAY"), ...weekOfMonth(2, "MONDAY")],
    startTime: "08:00",
  },
  {
    code: "CTCF",
    label: "CTCF",
    name: "Colorado Territorial Correctional Facility",
    typeCode: "FACILITY",
    rules: weekOfMonth(1, "MONDAY"),
    startTime: "08:00",
  },
  {
    code: "SCCF",
    label: "SCCF",
    name: "San Carlos Correctional Facility",
    typeCode: "FACILITY",
    rules: weekOfMonth(1, "THURSDAY"),
    startTime: "08:00",
  },
  {
    code: "ACC",
    label: "ACC",
    name: "Arrowhead Correctional Center",
    typeCode: "FACILITY",
    rules: weekOfMonth(1, "TUESDAY"),
    startTime: "08:00",
  },
  {
    code: "CSP",
    label: "CSP",
    name: "Colorado State Penitentiary",
    typeCode: "FACILITY",
    rules: weekOfMonth(1, "WEDNESDAY"),
    startTime: "08:00",
  },
  {
    code: "FMCC",
    label: "FMCC",
    name: "Four Mile Correctional Center",
    typeCode: "FACILITY",
    rules: weekOfMonth(1, "WEDNESDAY"),
    startTime: "08:00",
  },
  {
    code: "AVCF",
    label: "AVCF",
    name: "Arkansas Valley Correctional Facility",
    typeCode: "FACILITY",
    rules: weekOfMonth(2, "THURSDAY"),
    startTime: "08:00",
  },
  {
    code: "LVCF",
    label: "LVCF",
    name: "La Vista Correctional Facility",
    typeCode: "FACILITY",
    rules: weekOfMonth(2, "THURSDAY"),
    startTime: "08:00",
  },
  {
    code: "CCF",
    label: "CCF",
    name: "Centennial Correctional Facility",
    typeCode: "FACILITY",
    rules: weekOfMonth(2, "TUESDAY", "WEDNESDAY"),
    startTime: "08:00",
  },
  {
    code: "SCF",
    label: "SCF",
    name: "Sterling Correctional Facility",
    typeCode: "FACILITY",
    rules: weekOfMonth(2, "TUESDAY", "WEDNESDAY"),
    startTime: "08:00",
  },
  {
    // A facility at 10:00, as the design shows; the Calendar Unit hasn't
    // confirmed it (CO-798).
    code: "ICC/FED",
    label: "ICC/FED",
    name: "Federal Transfer / Interstate Compact Transfer",
    typeCode: "FACILITY",
    rules: weekOfMonth(3, "THURSDAY"),
    startTime: "10:00",
  },
  {
    code: "YOS",
    label: "YOS",
    name: "Youthful Offender System",
    typeCode: "FACILITY",
    rules: weekOfMonth(3, "THURSDAY"),
    startTime: "08:00",
  },
  {
    code: "BVCF",
    label: "BVCF",
    name: "Buena Vista Correctional Facility",
    typeCode: "FACILITY",
    rules: weekOfMonth(3, "TUESDAY"),
    startTime: "08:00",
  },
  {
    code: "BVMC",
    label: "BVMC",
    name: "Buena Vista Minimum Center",
    typeCode: "FACILITY",
    rules: weekOfMonth(3, "TUESDAY"),
    startTime: "08:00",
  },
  {
    code: "CCCF",
    label: "CCCF",
    name: "Crowley County Correctional Facility",
    typeCode: "FACILITY",
    rules: weekOfMonth(3, "WEDNESDAY", "THURSDAY"),
    startTime: "08:00",
  },
  {
    code: "BCCF",
    label: "BCCF",
    name: "Bent County Correctional Facility",
    typeCode: "FACILITY",
    rules: weekOfMonth(4, "MONDAY", "TUESDAY"),
    startTime: "08:00",
  },
  {
    code: "LCF",
    label: "LCF",
    name: "Limon Correctional Facility",
    typeCode: "FACILITY",
    rules: weekOfMonth(4, "MONDAY"),
    startTime: "08:00",
  },
  {
    code: "DCC",
    label: "DCC",
    name: "Delta Correctional Center",
    typeCode: "FACILITY",
    rules: weekOfMonth(4, "THURSDAY"),
    startTime: "08:00",
  },
  {
    code: "DRDC",
    label: "DRDC",
    name: "Denver Reception & Diagnostic Center",
    typeCode: "FACILITY",
    rules: weekOfMonth(4, "THURSDAY"),
    startTime: "08:00",
  },
  {
    code: "SCC",
    label: "SCC",
    name: "Skyline Correctional Center",
    typeCode: "FACILITY",
    rules: weekOfMonth(4, "THURSDAY"),
    startTime: "08:00",
  },
  {
    code: "RCC",
    label: "RCC",
    name: "Rifle Correctional Center",
    typeCode: "FACILITY",
    rules: weekOfMonth(4, "TUESDAY", "WEDNESDAY"),
    startTime: "08:00",
  },
  {
    code: "TCF",
    label: "TCF",
    name: "Trinidad Correctional Facility",
    typeCode: "FACILITY",
    rules: weekOfMonth(4, "TUESDAY"),
    startTime: "08:00",
  },
  {
    code: "DWCF",
    label: "DWCF",
    name: "Denver Women's Correctional Facility",
    typeCode: "FACILITY",
    rules: weekOfMonth(4, "WEDNESDAY"),
    startTime: "08:00",
  },
  {
    code: "DENCOM WTM BDY",
    label: "DENCOM WTM BDY",
    name: "Denver Community Westminster",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(2, "MONDAY"),
    startTime: "08:00",
  },
  {
    code: "BOULDER",
    label: "Boulder",
    name: "Boulder",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(3, "THURSDAY"),
    startTime: "08:00",
  },
  {
    code: "HILLTOP",
    label: "Hilltop",
    name: "Hilltop",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(3, "THURSDAY"),
    startTime: "08:00",
  },
  {
    code: "ISP FREMONT",
    label: "ISP Fremont",
    name: "Fremont",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(3, "THURSDAY"),
    startTime: "09:00",
  },
  {
    code: "ISP/MONTROSE",
    label: "ISP/Montrose",
    name: "Montrose",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(3, "THURSDAY"),
    startTime: "08:00",
  },
  {
    code: "ISPGRFLD/MESA",
    label: "ISP Grfld/Mesa",
    name: "Garfield/Mesa",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(3, "THURSDAY"),
    startTime: "08:00",
  },
  {
    code: "LAMAR",
    label: "Lamar",
    name: "Lamar",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(3, "THURSDAY"),
    startTime: "11:00",
  },
  {
    code: "SLV",
    label: "SLV",
    name: "San Luis Valley",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(3, "THURSDAY"),
    startTime: "10:00",
  },
  {
    code: "STERCOM",
    label: "STERCOM",
    name: "Sterling",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(3, "THURSDAY"),
    startTime: "13:00",
  },
  {
    code: "ISP/DEN ENG",
    label: "ISP/DEN ENG",
    name: "Denver Community Englewood",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(3, "WEDNESDAY"),
    startTime: "08:00",
  },
  {
    code: "COSCOM",
    label: "COSCOM",
    name: "Colorado Springs",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(1, "THURSDAY"),
    startTime: "08:00",
  },
  {
    code: "FT. COLLINS",
    label: "Ft. Collins",
    name: "Ft. Collins",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(1, "THURSDAY"),
    startTime: "10:00",
  },
  {
    code: "GREELEY",
    label: "Greeley",
    name: "Greeley",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(1, "TUESDAY"),
    startTime: "10:00",
  },
  {
    code: "ICCS/PUEBLO",
    label: "ICCS/Pueblo",
    name: "Pueblo",
    typeCode: "COMMUNITY",
    rules: weekOfMonth(4, "THURSDAY"),
    startTime: "08:00",
  },
];

/**
 * The Colorado Parole Board calendar's rows, in calendarConfigSchema's shape.
 *
 * Each hearing location is one resource, with sortOrder 10, 20, 30 in sheet
 * order, and one HEARING pattern. Full Board meets every Friday, and the
 * Business Meeting is on the 3rd Friday. The 3rd-Thursday Full Board
 * isn't a pattern: it depends on the month's Monday holidays, so Colorado's
 * generation rules add it.
 */
export const US_CO_REFERENCE_DATA: CalendarConfig = {
  calendar: {
    code: US_CO_PAROLE_BOARD.code,
    name: "Colorado Parole Board hearing calendar",
  },
  resourceTypes: [
    { code: "FACILITY", label: "Facility", sortOrder: 1 },
    { code: "COMMUNITY", label: "Community", sortOrder: 2 },
  ],
  resources: HEARING_LOCATIONS.map(({ code, label, name, typeCode }, i) => ({
    code,
    typeCode,
    label,
    name,
    sortOrder: (i + 1) * 10,
    isActive: true,
  })),
  kinds: [
    { code: "HEARING", label: "Hearing", sortOrder: 1 },
    { code: "FULL_BOARD", label: "Full Board", sortOrder: 2 },
    // The public design's label. It's data, so the Board can rename it.
    { code: "BUSINESS_MEETING", label: "Business Mtg", sortOrder: 3 },
  ],
  patterns: [
    ...HEARING_LOCATIONS.map(({ code, rules, startTime }) => ({
      kindCode: "HEARING",
      resourceCode: code,
      rules,
      startTime,
      endTime: null,
    })),
    {
      kindCode: "FULL_BOARD",
      resourceCode: null,
      rules: [{ type: "everyWeekday", weekday: "FRIDAY" }],
      startTime: null,
      endTime: null,
    },
    {
      kindCode: "BUSINESS_MEETING",
      resourceCode: null,
      rules: weekOfMonth(3, "FRIDAY"),
      startTime: null,
      endTime: null,
    },
  ],
};
