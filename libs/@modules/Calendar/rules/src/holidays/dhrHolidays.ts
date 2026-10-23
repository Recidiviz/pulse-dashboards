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

import { Holiday } from "./types";

/**
 * Colorado DHR state holidays from January 2026 to June 2027, as the PRD's
 * holiday table lists them. A holiday that falls on a weekend appears on its
 * weekday observed date.
 *
 * This list is the US-CO default only until CO-851 switches the default to
 * date-holidays 3.37.0, the source RFC B chose. After that it stays as the
 * reference the pin test checks date-holidays against, so edit it only to
 * match DHR's published list.
 *
 * DHR hasn't published FY 2027-28, so the list ends on 2027-06-30. Dates after
 * that get no holiday flags, and CO-851 must land before drafts reach July 2027.
 */
export const DHR_HOLIDAYS: readonly Holiday[] = [
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-01-19", name: "Martin Luther King Jr. Day" },
  { date: "2026-02-16", name: "Presidents' Day" },
  { date: "2026-05-25", name: "Memorial Day" },
  { date: "2026-06-19", name: "Juneteenth" },
  { date: "2026-07-03", name: "Independence Day (observed)" },
  { date: "2026-09-07", name: "Labor Day" },
  { date: "2026-10-05", name: "Frances Xavier Cabrini Day" },
  { date: "2026-11-11", name: "Veterans Day" },
  { date: "2026-11-26", name: "Thanksgiving Day" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-01-18", name: "Martin Luther King Jr. Day" },
  { date: "2027-02-15", name: "Presidents' Day" },
  { date: "2027-05-31", name: "Memorial Day" },
  { date: "2027-06-18", name: "Juneteenth (observed)" },
];
