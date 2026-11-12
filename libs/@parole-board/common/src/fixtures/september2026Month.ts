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
  EntryDto,
  KindDto,
  MonthDetail,
  ResourceDto,
} from "../api/types";
import { calendarApiConfig, monthDetail } from "./calendarApi";
import { september2026 } from "./september2026";

// The september2026 grid fixture as the calendar API returns it: the month
// from months.get and the config from config.get, whose resources carry each
// hearing location's full name. Names are the public facility and parole
// office names Colorado's calendar data uses.

const EDITOR_EMAIL = "editor-a@example.com";
const EDITED_AT = new Date("2026-10-01T16:00:00Z");

const FULL_NAMES: Record<string, string> = {
  ACC: "Arrowhead Correctional Center",
  AVCF: "Arkansas Valley Correctional Facility",
  BCCF: "Bent County Correctional Facility",
  Boulder: "Boulder",
  BVCF: "Buena Vista Correctional Facility",
  BVMC: "Buena Vista Minimum Center",
  CCCF: "Crowley County Correctional Facility",
  CCF: "Centennial Correctional Facility",
  COSCOM: "Colorado Springs",
  CSP: "Colorado State Penitentiary",
  CTCF: "Colorado Territorial Correctional Facility",
  "DENCOM WTM BDY": "Denver Community Westminster",
  DWCF: "Denver Women's Correctional Facility",
  FCF: "Fremont Correctional Facility",
  FMCC: "Four Mile Correctional Center",
  "Ft. Collins": "Ft. Collins",
  Greeley: "Greeley",
  Hilltop: "Hilltop",
  "ICC/FED": "Federal Transfer / Interstate Compact Transfer",
  "ISP Fremont": "Fremont",
  "ISP Grfld/Mesa": "Garfield/Mesa",
  "ISP/DEN ENG": "Denver Community Englewood",
  "ISP/Montrose": "Montrose",
  Lamar: "Lamar",
  LCF: "Limon Correctional Facility",
  LVCF: "La Vista Correctional Facility",
  RCC: "Rifle Correctional Center",
  SCCF: "San Carlos Correctional Facility",
  SCF: "Sterling Correctional Facility",
  SLV: "San Luis Valley",
  STERCOM: "Sterling",
  TCF: "Trinidad Correctional Facility",
  YOS: "Youthful Offender System",
};

const resourceId = (label: string) => `resource-${label}`;

const KINDS: KindDto[] = [
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
  {
    id: "kind-full-board",
    code: "FULL_BOARD",
    label: "Full Board",
    requiresResource: false,
    cancellable: true,
    deletable: true,
    isPublic: true,
    countsTowardTotal: false,
    sortOrder: 2,
  },
  {
    id: "kind-business-meeting",
    code: "BUSINESS_MEETING",
    label: "Business Mtg",
    requiresResource: false,
    cancellable: true,
    deletable: false,
    isPublic: true,
    countsTowardTotal: false,
    sortOrder: 3,
  },
];

const kindByCode = new Map<string, KindDto>(
  KINDS.map((kind) => [kind.code, kind]),
);

const RESOURCES: ResourceDto[] = Object.entries(FULL_NAMES).map(
  ([label, name], index) => ({
    id: resourceId(label),
    code: label.toUpperCase(),
    name,
    label,
    typeCode: "FACILITY",
    sortOrder: index + 1,
  }),
);

const holidayNameByDate = new Map(
  september2026.holidays.map((holiday) => [holiday.date, holiday.name]),
);

function toEntryDto(
  gridEntry: (typeof september2026.entries)[number],
): EntryDto {
  // months.get names the holiday an entry falls on.
  const holidayName = holidayNameByDate.get(gridEntry.date) ?? null;
  const kind = kindByCode.get(gridEntry.kind);
  if (!kind) throw new Error(`No kind ${gridEntry.kind}`);
  const isHearing = kind.requiresResource;
  return {
    id: gridEntry.id,
    date: gridEntry.date,
    kind: {
      code: kind.code,
      label: kind.label,
      cancellable: kind.cancellable,
      deletable: kind.deletable,
      countsTowardTotal: kind.countsTowardTotal,
    },
    // An entry with no resource shows its kind's label, as months.get does.
    label: isHearing ? gridEntry.label : kind.label,
    resource: isHearing
      ? {
          id: resourceId(gridEntry.label),
          code: gridEntry.label.toUpperCase(),
          label: gridEntry.label,
          typeCode: "FACILITY",
        }
      : null,
    slotKey: isHearing
      ? `${kind.code}:${gridEntry.label.toUpperCase()}`
      : kind.code,
    startTime: null,
    endTime: null,
    // The generator skips holidays, so an entry on one was added by hand.
    source: holidayName ? "MANUAL" : "PATTERN",
    cancelled: gridEntry.cancelled,
    cancelledAt: null,
    cancelledByEmail: null,
    holidayName,
    version: 1,
    updatedAt: EDITED_AT,
    updatedByEmail: EDITOR_EMAIL,
  };
}

/**
 * September 2026 as months.get returns it: a DRAFT with the september2026
 * entries in the same order, Labor Day, and 13 hearing days and 37 hearings.
 */
export const september2026MonthDetail: MonthDetail = monthDetail({
  year: 2026,
  month: 9,
  entries: september2026.entries.map(toEntryDto),
  holidays: september2026.holidays,
  counts: { entryDays: 13, entryCount: 37 },
});

/**
 * September 2026 with FCF and CTCF added by hand on Labor Day, so months.get
 * names the holiday on both: 14 hearing days and 39 hearings. The two adds
 * make it revision 3, a draft that's been edited.
 */
export const september2026MonthDetailWithHolidayHearings: MonthDetail = {
  ...september2026MonthDetail,
  revision: 3,
  entries: september2026.entriesWithHolidayHearings.map(toEntryDto),
  counts: { entryDays: 14, entryCount: 39 },
};

/** The calendar config with the three entry kinds and every hearing location in september2026. */
export const september2026Config: CalendarApiConfig = {
  ...calendarApiConfig,
  kinds: KINDS,
  resources: RESOURCES,
};
