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

import type { CalendarEntryType } from "../../calendarRules";

/** The Parole Board calendar's entry kinds, the fixed list its API uses. */
export const US_CO_PAROLE_BOARD_KIND_CODES = [
  "HEARING",
  "FULL_BOARD",
  "BUSINESS_MEETING",
] as const;

export type UsCoParoleBoardKindCode =
  (typeof US_CO_PAROLE_BOARD_KIND_CODES)[number];

/**
 * How each Parole Board entry kind behaves. A hearing is at a location,
 * counts toward the month's totals and can only be deleted. Full Board
 * meetings can be cancelled or deleted. A Business Meeting can be cancelled
 * but never deleted, so the Board's monthly business stays on the calendar.
 * All three are public.
 */
export const US_CO_PAROLE_BOARD_ENTRY_TYPES: readonly CalendarEntryType<UsCoParoleBoardKindCode>[] =
  [
    {
      code: "HEARING",
      requiresResource: true,
      cancellable: false,
      deletable: true,
      isPublic: true,
      countsTowardTotal: true,
    },
    {
      code: "FULL_BOARD",
      requiresResource: false,
      cancellable: true,
      deletable: true,
      isPublic: true,
      countsTowardTotal: false,
    },
    {
      code: "BUSINESS_MEETING",
      requiresResource: false,
      cancellable: true,
      deletable: false,
      isPublic: true,
      countsTowardTotal: false,
    },
  ];
