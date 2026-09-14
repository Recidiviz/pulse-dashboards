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

import { PATHWAYS_SECTIONS } from "~shared-pathways";

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

/**
 * The event types each section applies to, and why it does not apply to the
 * rest. A breakdown of release reasons means nothing while the charts count
 * admissions only, so that section is disabled until the reader picks an event
 * type it covers.
 *
 * A section absent from this map — every Population Under Custody section —
 * does not vary by event type and is always available.
 */
export const EVENT_TYPE_SECTION_RULES: Readonly<
  Record<string, { eventTypes: readonly EventType[]; reason: string }>
> = {
  [PATHWAYS_SECTIONS["countByAdmissionType"]]: {
    eventTypes: [EVENT_TYPES.ADMISSIONS, EVENT_TYPES.ALL],
    reason: "Admissions only",
  },
  [PATHWAYS_SECTIONS["countByReleaseType"]]: {
    eventTypes: [EVENT_TYPES.RELEASES, EVENT_TYPES.ALL],
    reason: "Releases only",
  },
  [PATHWAYS_SECTIONS["countByCommunitySupervision"]]: {
    eventTypes: [EVENT_TYPES.RELEASES, EVENT_TYPES.ALL],
    reason: "Releases only",
  },
};

/**
 * Returns true if the section can be shown for the given event type. A section
 * with no rule does not vary by event type, so it is always available.
 */
export function isSectionAvailableForEventType(
  sectionId: string,
  eventType: EventType,
): boolean {
  const rule = EVENT_TYPE_SECTION_RULES[sectionId];
  return !rule || rule.eventTypes.includes(eventType);
}
