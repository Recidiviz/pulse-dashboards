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
  EntryDto,
  ResourceDto,
} from "~@parole-board/common";

/**
 * Maps the month's entries to CalendarGrid's, keeping the server's order
 * (date, then kind, then resource). Each chip shows the entry's label, such as
 * "FCF", and its hover title is the resource's full name from config.get, or
 * the kind's label for an entry with no resource, such as a Full Board
 * meeting. A resource with no name, or one config.get doesn't list, falls
 * back to the label, because full names come only from the server.
 */
export function toGridEntries(
  entries: readonly EntryDto[],
  resources: readonly ResourceDto[],
): CalendarGridEntry[] {
  const nameById = new Map(
    resources.map((resource) => [resource.id, resource.name]),
  );
  return entries.map((entry) => ({
    id: entry.id,
    date: entry.date,
    label: entry.label,
    kind: entry.kind.code,
    cancelled: entry.cancelled,
    title: entry.resource
      ? nameById.get(entry.resource.id) ?? entry.label
      : entry.kind.label,
  }));
}
