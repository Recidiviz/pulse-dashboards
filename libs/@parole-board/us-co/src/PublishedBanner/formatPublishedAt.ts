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
 * Formats a publication's instant as the published banner shows it, in the
 * calendar's time zone: 2026-10-09T18:27:00Z in "America/Denver" reads
 * "Oct 9, 2026 at 12:27 PM".
 */
export function formatPublishedAt(instant: Date, timeZone: string) {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(instant);
  // Recent ICU versions put a narrow no-break space before AM and PM; the
  // banner copy uses a plain space.
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  })
    .format(instant)
    .replace(/\s/g, " ");
  return `${date} at ${time}`;
}
