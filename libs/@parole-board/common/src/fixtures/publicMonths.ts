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
  PublicCalendarDay,
  PublicCalendarMonth,
} from "../PublicCalendarView/types";

// Synthetic published months, November 2026 to January 2027, as the public
// read returns them. November follows the month in the Public View design:
// its hearing locations by day, Full Board every Friday, a Business Meeting
// on the 20th, and Veterans' Day and Thanksgiving with no entries.
// Labels are the data's own, so the Business Meeting is "Business Mtg".

type MonthSpec = {
  year: number;
  month: number;
  title: string;
  hearings: Record<number, string[]>;
  fullBoardDays: number[];
  businessMeetingDay: number;
  holidays: Record<number, string>;
  previous: string | null;
  next: string | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

function buildMonth(spec: MonthSpec): PublicCalendarMonth {
  const daysInMonth = new Date(Date.UTC(spec.year, spec.month, 0)).getUTCDate();
  const days: PublicCalendarDay[] = Array.from(
    { length: daysInMonth },
    (_, i) => {
      const day = i + 1;
      // Within a day: hearings, then Full Board, then the Business Meeting,
      // the kind sortOrder the server sorts by.
      const entries = [
        ...(spec.hearings[day] ?? []).map((label) => ({
          label,
          kind: "HEARING",
          cancelled: false,
        })),
        ...(spec.fullBoardDays.includes(day)
          ? [{ label: "Full Board", kind: "FULL_BOARD", cancelled: false }]
          : []),
        ...(spec.businessMeetingDay === day
          ? [
              {
                label: "Business Mtg",
                kind: "BUSINESS_MEETING",
                cancelled: false,
              },
            ]
          : []),
      ];
      return {
        date: `${spec.year}-${pad(spec.month)}-${pad(day)}`,
        holidayName: spec.holidays[day] ?? null,
        entries,
      };
    },
  );
  return {
    month: `${spec.year}-${pad(spec.month)}`,
    title: spec.title,
    days,
    previous: spec.previous,
    next: spec.next,
    notPublishedYet: null,
  };
}

/** The first published month: November 2026, as in the design. */
export const publicNovember2026 = buildMonth({
  year: 2026,
  month: 11,
  title: "November 2026",
  hearings: {
    2: ["FCF", "CTCF"],
    3: ["ACC", "Greeley"],
    4: ["CSP", "FMCC"],
    5: ["SCCF", "COSCOM", "Ft. Collins"],
    9: ["FCF", "DENCOM WTM BDY"],
    10: ["CCF", "SCF"],
    12: ["AVCF", "LVCF"],
    17: ["BVCF", "BVMC"],
    18: ["CCCF", "ISP/DEN ENG"],
    19: [
      "ICC/FED",
      "YOS",
      "CCCF",
      "Boulder",
      "Hilltop",
      "ISP Fremont",
      "ISP/Montrose",
      "ISPGRFLD/Mesa",
      "Lamar",
      "SLV",
      "STERCOM",
    ],
    23: ["BCCF", "LCF"],
    24: ["BCCF", "RCC", "TCF"],
    25: ["RCC", "DWCF"],
  },
  fullBoardDays: [6, 13, 20, 27],
  businessMeetingDay: 20,
  holidays: { 11: "Veterans' Day", 26: "Thanksgiving Day" },
  previous: null,
  next: "2026-12",
});

/** A month between two published months, with Christmas Day on a Friday. */
export const publicDecember2026 = buildMonth({
  year: 2026,
  month: 12,
  title: "December 2026",
  hearings: {
    1: ["ACC", "Greeley"],
    2: ["CSP", "FMCC"],
    3: ["SCCF", "COSCOM", "Ft. Collins"],
    7: ["FCF", "CTCF"],
    8: ["CCF", "SCF"],
    9: ["CCF", "SCF"],
    10: ["AVCF", "LVCF"],
    14: ["FCF", "DENCOM WTM BDY"],
    15: ["BVCF", "BVMC"],
    16: ["CCCF", "ISP/DEN ENG"],
    17: ["ICC/FED", "YOS", "Boulder", "Hilltop"],
    21: ["BCCF", "LCF"],
    22: ["BCCF", "RCC"],
    23: ["RCC", "DWCF"],
  },
  fullBoardDays: [4, 11, 18],
  businessMeetingDay: 18,
  holidays: { 25: "Christmas Day" },
  previous: "2026-11",
  next: "2027-01",
});

/** The last published month, with New Year's Day and a Monday holiday. */
export const publicJanuary2027 = buildMonth({
  year: 2027,
  month: 1,
  title: "January 2027",
  hearings: {
    4: ["FCF", "CTCF"],
    5: ["ACC", "Greeley"],
    6: ["CSP", "FMCC"],
    7: ["SCCF", "COSCOM"],
    11: ["FCF", "DENCOM WTM BDY"],
    12: ["CCF", "SCF"],
    13: ["CCF", "SCF"],
    14: ["AVCF", "LVCF"],
    19: ["BVCF", "BVMC"],
    20: ["CCCF", "ISP/DEN ENG"],
    21: ["ICC/FED", "YOS", "CCCF", "Boulder"],
    25: ["BCCF", "LCF"],
    26: ["BCCF", "RCC", "TCF"],
    27: ["RCC", "DWCF"],
  },
  fullBoardDays: [8, 15, 22, 29],
  businessMeetingDay: 15,
  holidays: { 1: "New Year's Day", 18: "Martin Luther King Jr. Day" },
  previous: "2026-12",
  next: null,
});

/** November 2026 with the Full Board meeting on the 13th cancelled. */
export const publicNovember2026WithCancelledMeeting: PublicCalendarMonth = {
  ...publicNovember2026,
  days: publicNovember2026.days.map((day) =>
    day.date === "2026-11-13"
      ? {
          ...day,
          entries: day.entries.map((e) =>
            e.kind === "FULL_BOARD" ? { ...e, cancelled: true } : e,
          ),
        }
      : day,
  ),
};
