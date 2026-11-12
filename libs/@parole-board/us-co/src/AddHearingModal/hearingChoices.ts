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

import { entrySlotKey } from "~@modules/Calendar/rules";
import type {
  CalendarApiConfig,
  EntryDto,
  KindDto,
} from "~@parole-board/common";

export interface BoardSessionOption {
  value: string;
  /** The kind's label, such as "Full Board". */
  label: string;
  /** True when this session is already on the chosen day. */
  disabled: boolean;
}

export interface FacilityOption {
  value: string;
  /** The abbreviation, such as "FCF". */
  label: string;
  /** The short full name, such as "Fremont". */
  fullName: string;
  /** True when this facility already has a hearing on the chosen day. */
  disabled: boolean;
}

const KIND_PREFIX = "kind:";
const RESOURCE_PREFIX = "resource:";

/** The dialog's value for a board session: "kind:FULL_BOARD". */
export function boardSessionValue(kindCode: string): string {
  return `${KIND_PREFIX}${kindCode}`;
}

/** The dialog's value for a facility: "resource:<resource id>". */
export function facilityValue(resourceId: string): string {
  return `${RESOURCE_PREFIX}${resourceId}`;
}

/**
 * Reads a value boardSessionValue or facilityValue built back into its kind
 * code or resource id, or null for anything else.
 */
export function parseChoice(
  value: string,
):
  | { type: "boardSession"; kindCode: string }
  | { type: "facility"; resourceId: string }
  | null {
  if (value.startsWith(KIND_PREFIX)) {
    return { type: "boardSession", kindCode: value.slice(KIND_PREFIX.length) };
  }
  if (value.startsWith(RESOURCE_PREFIX)) {
    return {
      type: "facility",
      resourceId: value.slice(RESOURCE_PREFIX.length),
    };
  }
  return null;
}

const bySortOrder = <T extends { sortOrder: number }>(items: readonly T[]) =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder);

/**
 * The kind a facility's entry takes: the first kind, in sortOrder, that
 * requires a resource (HEARING for the Parole Board). The dialog has no kind
 * picker, so a calendar with two such kinds would add only the first.
 */
export function facilityKind(kinds: readonly KindDto[]): KindDto | undefined {
  return bySortOrder(kinds).find((kind) => kind.requiresResource);
}

/**
 * The Add hearing dialog's choices from the calendar config: a board session
 * for each kind with no resource and a facility for each active resource,
 * both in sortOrder. A choice is disabled when the month already has an entry
 * in its slot on date, cancelled or not, because the server's unique slot
 * key refuses a second one. With no date, nothing is disabled.
 */
export function hearingChoices(
  config: Pick<CalendarApiConfig, "kinds" | "resources">,
  entries: readonly Pick<EntryDto, "date" | "slotKey">[],
  date: string | null,
): { boardSessions: BoardSessionOption[]; facilities: FacilityOption[] } {
  const taken = new Set(
    entries
      .filter((entry) => entry.date === date)
      .map(({ slotKey }) => slotKey),
  );
  const hearingKind = facilityKind(config.kinds);

  const boardSessions = bySortOrder(config.kinds)
    .filter((kind) => !kind.requiresResource)
    .map((kind) => ({
      value: boardSessionValue(kind.code),
      label: kind.label,
      disabled: taken.has(
        entrySlotKey({ kindCode: kind.code, resourceCode: null }),
      ),
    }));

  const facilities = hearingKind
    ? bySortOrder(config.resources).map((resource) => ({
        value: facilityValue(resource.id),
        label: resource.label,
        fullName: resource.name ?? resource.label,
        disabled: taken.has(
          entrySlotKey({
            kindCode: hearingKind.code,
            resourceCode: resource.code,
          }),
        ),
      }))
    : [];

  return { boardSessions, facilities };
}
