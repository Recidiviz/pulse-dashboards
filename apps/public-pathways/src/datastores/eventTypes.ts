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

import {
  FILTER_TYPES,
  MetricContent,
  PATHWAYS_SECTIONS,
} from "~shared-pathways";

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

/** Colors for each event type's data, from the v2 design. */
export const ADMISSIONS_COLOR = "#1F4E6D";
export const RELEASES_COLOR = "#D4A017";

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
 * Returns the color a section's charts should draw in, or undefined where the
 * section counts more than one kind of event and no single color fits.
 *
 * This reads the same rules that disable a section, so a section that only
 * ever counts releases draws in the releases color without naming it twice.
 */
export function chartColorForSection(sectionId: string): string | undefined {
  const rule = EVENT_TYPE_SECTION_RULES[sectionId];
  if (!rule) return undefined;
  if (!rule.eventTypes.includes(EVENT_TYPES.RELEASES)) return ADMISSIONS_COLOR;
  if (!rule.eventTypes.includes(EVENT_TYPES.ADMISSIONS)) return RELEASES_COLOR;
  return undefined;
}

/**
 * Returns the chart heading for the event type in view.
 *
 * A chart that counts both admissions and releases has to say which of them it
 * currently shows, so its copy carries a title per event type. Every other
 * chart already names its event type in `title`, and has no override to fall
 * back from.
 */
export function chartTitleForEventType(
  content: MetricContent,
  eventType: EventType,
): string {
  if (eventType === EVENT_TYPES.ADMISSIONS) {
    return content.titleForAdmissions ?? content.title;
  }
  if (eventType === EVENT_TYPES.RELEASES) {
    return content.titleForReleases ?? content.title;
  }
  return content.title;
}

/**
 * The event types each filter applies to. The panel offers the same filters on
 * every chart, so a filter that breaks down releases has nothing to say while
 * the charts count admissions only.
 *
 * A filter absent from this map applies to every event type.
 */
const EVENT_TYPE_FILTER_RULES: Readonly<
  Record<string, { eventTypes: readonly EventType[]; reason: string }>
> = {
  [FILTER_TYPES.ADMISSION_TYPE]: {
    eventTypes: [EVENT_TYPES.ADMISSIONS, EVENT_TYPES.ALL],
    reason: "Admissions only",
  },
  [FILTER_TYPES.RELEASE_TYPE]: {
    eventTypes: [EVENT_TYPES.RELEASES, EVENT_TYPES.ALL],
    reason: "Releases only",
  },
  [FILTER_TYPES.COMMUNITY_SUPERVISION]: {
    eventTypes: [EVENT_TYPES.RELEASES, EVENT_TYPES.ALL],
    reason: "Releases only",
  },
};

/**
 * Returns the filters the given event type leaves nothing to filter, each with
 * the reason the panel shows.
 */
export function disabledFiltersForEventType(
  eventType: EventType,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(EVENT_TYPE_FILTER_RULES)
      .filter(([, rule]) => !rule.eventTypes.includes(eventType))
      .map(([filterType, rule]) => [filterType, rule.reason]),
  );
}

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
