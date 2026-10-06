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

import { format } from "date-fns";

export const formatDate = (date: Date): string => format(date, "MMM d, yyyy");

export const formatDateTime = (date: Date): string =>
  format(date, "MMM d, yyyy h:mm a");

export const formatMinutes = (durationMs: number): string =>
  `${Math.round(durationMs / 60_000)} min`;

/** The transcript timestamp column: mm:ss, growing to h:mm:ss past an hour. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  if (hours > 0)
    return `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`;
  return `${String(minutes).padStart(2, "0")}:${seconds}`;
}
