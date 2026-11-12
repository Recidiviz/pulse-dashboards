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

import type { EntryDto } from "~@parole-board/common";

/**
 * Whether editors may delete the entry, from its kind's deletable flag in the
 * calendar API. Colorado's entry types make it true for hearings and Full
 * Board and false for Business Meetings, which can only be cancelled.
 */
export function canDeleteEntry(entry: Pick<EntryDto, "kind">): boolean {
  return entry.kind.deletable;
}
