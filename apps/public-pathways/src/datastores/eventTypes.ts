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
 * Which events a dashboard's charts count. `ALL` shows admissions and releases
 * together, which is what the Admissions & Releases dashboard opens on.
 */
export const EVENT_TYPES = {
  ADMISSIONS: "ADMISSIONS",
  ALL: "ALL",
  RELEASES: "RELEASES",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export const DEFAULT_EVENT_TYPE: EventType = EVENT_TYPES.ALL;

/**
 * The selector's options, in the order the design lists them: one event type on
 * each side, and the combined view in the middle.
 */
export const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: EVENT_TYPES.ADMISSIONS, label: "Admissions" },
  { value: EVENT_TYPES.ALL, label: "Admissions & Releases" },
  { value: EVENT_TYPES.RELEASES, label: "Releases" },
];

/** Returns true if the given value names an event type, e.g. from a URL. */
export function isEventType(value: string): value is EventType {
  return (Object.values(EVENT_TYPES) as string[]).includes(value);
}
