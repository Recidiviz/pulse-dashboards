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
  PatternRule,
  Weekday,
  WeekOfMonth,
} from "~@modules/Calendar/rules";

import type { CalendarApiConfig, CurrentPatternRow } from "../api/types";
import { calendarApiConfig } from "./calendarApi";

type Location = {
  id: string;
  code: string;
  /** The short label on the calendar, such as "FCF". */
  label: string;
  /** The full name, such as "Fremont". */
  name: string;
  /** The weeks and weekdays of the location's standing hearing days. */
  weeks: WeekOfMonth[];
  weekdays: Weekday[];
};

/** Returns count consecutive months as { year, month }, from year and month. */
function monthsFrom(year: number, month: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const zeroBased = month - 1 + index;
    return {
      year: year + Math.floor(zeroBased / 12),
      month: (zeroBased % 12) + 1,
    };
  });
}

const LOCATIONS: Location[] = [
  {
    id: "loc-fcf",
    code: "FCF",
    label: "FCF",
    name: "Fremont",
    weeks: [1, 2],
    weekdays: ["MONDAY"],
  },
  {
    id: "loc-ctcf",
    code: "CTCF",
    label: "CTCF",
    name: "Territorial",
    weeks: [1],
    weekdays: ["MONDAY"],
  },
  {
    id: "loc-sccf",
    code: "SCCF",
    label: "SCCF",
    name: "San Carlos",
    weeks: [1],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-acc",
    code: "ACC",
    label: "ACC",
    name: "Arrowhead",
    weeks: [1],
    weekdays: ["TUESDAY"],
  },
  {
    id: "loc-csp",
    code: "CSP",
    label: "CSP",
    name: "Colorado State Penitentiary",
    weeks: [1],
    weekdays: ["WEDNESDAY"],
  },
  {
    id: "loc-fmcc",
    code: "FMCC",
    label: "FMCC",
    name: "Four Mile",
    weeks: [1],
    weekdays: ["WEDNESDAY"],
  },
  {
    id: "loc-avcf",
    code: "AVCF",
    label: "AVCF",
    name: "Ark Valley",
    weeks: [2],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-lvcf",
    code: "LVCF",
    label: "LVCF",
    name: "La Vista",
    weeks: [2],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-ccf",
    code: "CCF",
    label: "CCF",
    name: "Centennial",
    weeks: [2],
    weekdays: ["TUESDAY", "WEDNESDAY"],
  },
  {
    id: "loc-scf",
    code: "SCF",
    label: "SCF",
    name: "Sterling",
    weeks: [2],
    weekdays: ["TUESDAY", "WEDNESDAY"],
  },
  {
    id: "loc-icc-fed",
    code: "ICC_FED",
    label: "ICC/FED",
    name: "Interstate Compact/Federal Transfer",
    weeks: [3],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-yos",
    code: "YOS",
    label: "YOS",
    name: "Youth Offender Services",
    weeks: [3],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-bvcf",
    code: "BVCF",
    label: "BVCF",
    name: "Buena Vista",
    weeks: [3],
    weekdays: ["TUESDAY"],
  },
  {
    id: "loc-bvmc",
    code: "BVMC",
    label: "BVMC",
    name: "Buena Vista Minimum",
    weeks: [3],
    weekdays: ["TUESDAY"],
  },
  {
    id: "loc-cccf",
    code: "CCCF",
    label: "CCCF",
    name: "Crowley County (private facility)",
    weeks: [3],
    weekdays: ["WEDNESDAY", "THURSDAY"],
  },
  {
    id: "loc-bccf",
    code: "BCCF",
    label: "BCCF",
    name: "Bent County (private facility)",
    weeks: [4],
    weekdays: ["MONDAY", "TUESDAY"],
  },
  {
    id: "loc-lcf",
    code: "LCF",
    label: "LCF",
    name: "Limon",
    weeks: [4],
    weekdays: ["MONDAY"],
  },
  {
    id: "loc-dcc",
    code: "DCC",
    label: "DCC",
    name: "Delta",
    weeks: [4],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-drdc",
    code: "DRDC",
    label: "DRDC",
    name: "Denver Reception Diagnostic Center",
    weeks: [4],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-scc",
    code: "SCC",
    label: "SCC",
    name: "Skyline",
    weeks: [4],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-rcc",
    code: "RCC",
    label: "RCC",
    name: "Rifle",
    weeks: [4],
    weekdays: ["TUESDAY", "WEDNESDAY"],
  },
  {
    id: "loc-tcf",
    code: "TCF",
    label: "TCF",
    name: "Trinidad",
    weeks: [4],
    weekdays: ["TUESDAY"],
  },
  {
    id: "loc-dwcf",
    code: "DWCF",
    label: "DWCF",
    name: "Denver Women's",
    weeks: [4],
    weekdays: ["WEDNESDAY"],
  },
  {
    id: "loc-dencom-wtm-bdy",
    code: "DENCOM_WTM_BDY",
    label: "DENCOM WTM BDY",
    name: "Denver (community)",
    weeks: [2],
    weekdays: ["MONDAY"],
  },
  {
    id: "loc-boulder",
    code: "BOULDER",
    label: "Boulder",
    name: "Boulder (community)",
    weeks: [3],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-hilltop",
    code: "HILLTOP",
    label: "Hilltop",
    name: "Hilltop (community)",
    weeks: [3],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-isp-fremont",
    code: "ISP_FREMONT",
    label: "ISP Fremont",
    name: "ISP Fremont (community)",
    weeks: [3],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-isp-montrose",
    code: "ISP_MONTROSE",
    label: "ISP/Montrose",
    name: "ISP/Montrose (community)",
    weeks: [3],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-isp-grfld-mesa",
    code: "ISP_GRFLD_MESA",
    label: "ISP Grfld/Mesa",
    name: "ISP Garfield/Mesa (community)",
    weeks: [3],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-lamar",
    code: "LAMAR",
    label: "Lamar",
    name: "Lamar (community)",
    weeks: [3],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-slv",
    code: "SLV",
    label: "SLV",
    name: "San Luis Valley (community)",
    weeks: [3],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-stercom",
    code: "STERCOM",
    label: "STERCOM",
    name: "Sterling (community)",
    weeks: [3],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-isp-den-eng",
    code: "ISP_DEN_ENG",
    label: "ISP/DEN ENG",
    name: "Denver (community)",
    weeks: [3],
    weekdays: ["WEDNESDAY"],
  },
  {
    id: "loc-coscom",
    code: "COSCOM",
    label: "COSCOM",
    name: "Colorado Springs (community)",
    weeks: [1],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-ft-collins",
    code: "FT_COLLINS",
    label: "Ft. Collins",
    name: "Fort Collins (community)",
    weeks: [1],
    weekdays: ["THURSDAY"],
  },
  {
    id: "loc-greeley",
    code: "GREELEY",
    label: "Greeley",
    name: "Greeley (community)",
    weeks: [1],
    weekdays: ["TUESDAY"],
  },
  {
    id: "loc-iccs-pueblo",
    code: "ICCS_PUEBLO",
    label: "ICCS/Pueblo",
    name: "ICCS/Pueblo (community)",
    weeks: [4],
    weekdays: ["THURSDAY"],
  },
];

const PATTERN_FIELDS = {
  version: 1,
  startTime: null,
  endTime: null,
  createdAt: new Date("2026-09-01T00:00:00Z"),
  createdByEmail: "editor-a@example.com",
};

/** One weekOfMonth rule for each of weeks on each of weekdays. */
function weekGrid(weeks: WeekOfMonth[], weekdays: Weekday[]): PatternRule[] {
  return weeks.flatMap((week) =>
    weekdays.map((weekday) => ({
      type: "weekOfMonth" as const,
      week,
      weekday,
    })),
  );
}

const locationRows: CurrentPatternRow[] = LOCATIONS.map(
  ({ id, code, label, weeks, weekdays }, index) => ({
    slotKey: `HEARING:${code}`,
    kind: { code: "HEARING", label: "Hearing" },
    resource: { id, code, label, typeCode: "FACILITY", sortOrder: index + 1 },
    pattern: {
      id: `pattern-${id}`,
      rules: weekGrid(weeks, weekdays),
      ...PATTERN_FIELDS,
    },
  }),
);

const kindRows: CurrentPatternRow[] = [
  {
    slotKey: "FULL_BOARD",
    kind: { code: "FULL_BOARD", label: "Full Board" },
    resource: null,
    pattern: {
      id: "pattern-full-board",
      rules: [{ type: "everyWeekday", weekday: "FRIDAY" }],
      ...PATTERN_FIELDS,
    },
  },
  // No Business Meeting pattern until its anchor date is set.
  {
    slotKey: "BUSINESS_MEETING",
    kind: { code: "BUSINESS_MEETING", label: "Business Mtg" },
    resource: null,
    pattern: null,
  },
];

/**
 * What the Add a month dialog shows, with the clock at October 8, 2026 in
 * America/Denver: the server's add options, the current patterns, and the
 * calendar config that holds each location's full name.
 *
 * The add options are the current month, while it doesn't exist, plus the
 * next 12. The patterns are the 37 locations from the Facility patterns list
 * in the Calendar Unit Dashboard design, each with its label, full name and
 * standing days, then the two meeting kinds. The Business Meeting has no
 * pattern until its anchor date is set.
 */
export const addMonthChoices = {
  currentMonth: { year: 2026, month: 10 },
  /** Nothing created yet: October 2026 to October 2027. */
  options: monthsFrom(2026, 10, 13),
  /** November and December 2026 already exist. */
  optionsWithSomeAdded: monthsFrom(2026, 10, 13).filter(
    ({ year, month }) => !(year === 2026 && (month === 11 || month === 12)),
  ),
  /** patterns.listCurrent: locations first, then the meeting kinds. */
  currentPatterns: [...locationRows, ...kindRows],
  /** config.get, with every location as a resource. */
  config: {
    ...calendarApiConfig,
    resources: LOCATIONS.map(({ id, code, label, name }, index) => ({
      id,
      code,
      label,
      name,
      typeCode: "FACILITY",
      sortOrder: index + 1,
    })),
  } satisfies CalendarApiConfig,
};
