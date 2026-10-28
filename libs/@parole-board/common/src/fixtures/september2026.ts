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
  CalendarGridEntry,
  CalendarHoliday,
  CalendarMonthRef,
} from "../CalendarGrid/types";

// Synthetic data shaped like the September 2026 draft in the design: the
// hearing locations by day, Full Board every Friday, a Business Meeting on
// the 25th and Labor Day on the 7th. 13 hearing days and 37 hearings.
const HEARINGS_BY_DAY: Record<number, string[]> = {
  8: ["ACC", "Greeley"],
  9: ["CSP", "FMCC"],
  10: ["SCCF", "COSCOM", "Ft. Collins"],
  14: ["FCF", "DENCOM WTM BDY"],
  15: ["CCF", "SCF"],
  16: ["CCF", "SCF"],
  17: ["AVCF", "LVCF"],
  22: ["BVCF", "BVMC"],
  23: ["CCCF", "ISP/DEN ENG"],
  24: [
    "ICC/FED",
    "YOS",
    "CCCF",
    "Boulder",
    "Hilltop",
    "ISP Fremont",
    "ISP/Montrose",
    "ISP Grfld/Mesa",
    "Lamar",
    "SLV",
    "STERCOM",
  ],
  28: ["BCCF", "LCF"],
  29: ["BCCF", "RCC", "TCF"],
  30: ["RCC", "DWCF"],
};

const FULL_BOARD_DAYS = [4, 11, 18, 25];
const BUSINESS_MEETING_DAY = 25;

const isoDay = (day: number) => `2026-09-${String(day).padStart(2, "0")}`;

function entry(day: number, kind: string, label: string): CalendarGridEntry {
  return {
    id: `${isoDay(day)}:${kind}:${label}`,
    date: isoDay(day),
    label,
    kind,
    cancelled: false,
  };
}

function buildEntries(): CalendarGridEntry[] {
  const entries: CalendarGridEntry[] = [];
  for (let day = 1; day <= 30; day += 1) {
    // Within a day: hearings, then Full Board, then the Business Meeting,
    // the kind sortOrder the server sorts by.
    for (const label of HEARINGS_BY_DAY[day] ?? []) {
      entries.push(entry(day, "HEARING", label));
    }
    if (FULL_BOARD_DAYS.includes(day)) {
      entries.push(entry(day, "FULL_BOARD", "Full Board"));
    }
    if (day === BUSINESS_MEETING_DAY) {
      entries.push(entry(day, "BUSINESS_MEETING", "Business Meeting"));
    }
  }
  return entries;
}

const entries = buildEntries();

/** September 2026 for CalendarGrid, built from synthetic data. */
export const september2026 = {
  month: { year: 2026, month: 9 } satisfies CalendarMonthRef,
  timeZone: "America/Denver",
  /**
   * Sunday: the grid always displays Sunday-first with weekend columns, while
   * the Parole Board's data starts weeks on Monday.
   */
  firstDay: 0,
  entries,
  /** The same month with the Full Board meeting on the 11th cancelled. */
  entriesWithCancelledMeeting: entries.map((e) =>
    e.id === "2026-09-11:FULL_BOARD:Full Board" ? { ...e, cancelled: true } : e,
  ),
  holidays: [
    { date: "2026-09-07", name: "Labor Day" },
  ] satisfies CalendarHoliday[],
};
