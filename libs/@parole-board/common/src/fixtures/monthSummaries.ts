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

import type { MonthSummary } from "../api/types";
import { monthListPage, monthSummary } from "./calendarApi";

// Stored months for the month picker and arrows, with a gap in October 2026.
// With the clock at 2026-10-08, September is a past month. Every email is a
// role name on example.com.

/** September 2026, a DRAFT no one has edited since months.create. */
export const september2026Summary = monthSummary({ year: 2026, month: 9 });

/** November 2026, PUBLISHED once and not edited since. */
export const november2026Summary = monthSummary({
  year: 2026,
  month: 11,
  status: "PUBLISHED",
  revision: 2,
  latestPublication: {
    publishedAt: new Date("2026-10-05T17:00:00Z"),
    publishedByEmail: "editor-a@example.com",
  },
});

/**
 * December 2026, back in draft: published, then moved off the public site
 * with Edit month, so it is a DRAFT with a latestPublication.
 */
export const december2026Summary = monthSummary({
  year: 2026,
  month: 12,
  revision: 3,
  lastEditedAt: new Date("2026-10-07T15:00:00Z"),
  lastEditedByEmail: "editor-b@example.com",
  latestPublication: {
    publishedAt: new Date("2026-10-06T17:00:00Z"),
    publishedByEmail: "editor-a@example.com",
  },
});

/** September, November and December 2026, in ascending order. */
export const monthSummaries: MonthSummary[] = [
  september2026Summary,
  november2026Summary,
  december2026Summary,
];

/** All of monthSummaries on one months.list page, with no more pages. */
export const monthSummariesPage = monthListPage(monthSummaries);
