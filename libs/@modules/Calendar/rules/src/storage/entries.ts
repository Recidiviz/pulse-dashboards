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
 * Checks on CalendarEntry and CalendarEntryPattern rows that depend on the
 * kind's flags, so the database can't enforce them. Every function that
 * writes one of those rows calls them before the write.
 */

import { CalendarRulesError } from "../errors";

/**
 * Why an entry or pattern failed a check. The calendar API contract (CO-850)
 * maps INVALID_ENTRY to BAD_REQUEST and must list every reason here, so a new
 * reason needs a mapping there too.
 */
export type InvalidEntryReason =
  /** An empty kind or resource code, or one with a colon (see entrySlotKey). */
  | "INVALID_CODE"
  | "RESOURCE_REQUIRED"
  | "RESOURCE_NOT_ALLOWED"
  | "CALENDAR_MISMATCH"
  | "INACTIVE_RESOURCE"
  | "NOT_CANCELLABLE";

/**
 * A CalendarRulesError with code INVALID_ENTRY and the reason the check
 * failed. The reason lives on this subclass, not on CalendarRulesError,
 * because only INVALID_ENTRY has reasons; callers can still catch
 * CalendarRulesError and read code, or check instanceof InvalidEntryError to
 * read reason.
 */
export class InvalidEntryError extends CalendarRulesError {
  readonly reason: InvalidEntryReason;

  constructor(reason: InvalidEntryReason, message: string) {
    super("INVALID_ENTRY", message);
    this.name = "InvalidEntryError";
    this.reason = reason;
  }
}

function assertSlotKeyCode(field: string, code: string): void {
  if (typeof code !== "string" || code.length === 0 || code.includes(":")) {
    throw new InvalidEntryError(
      "INVALID_CODE",
      `${field} must be non-empty with no colon, got ${JSON.stringify(code)}`,
    );
  }
}

/**
 * Returns the slotKey for an entry or pattern: "HEARING:FCF" when there is a
 * resource, or the kind code alone, e.g. "FULL_BOARD". Throws INVALID_ENTRY
 * when either code is empty or contains a colon.
 */
export function entrySlotKey({
  kindCode,
  resourceCode,
}: {
  kindCode: string;
  resourceCode: string | null;
}): string {
  assertSlotKeyCode("kindCode", kindCode);
  if (resourceCode === null) return kindCode;
  assertSlotKeyCode("resourceCode", resourceCode);
  return `${kindCode}:${resourceCode}`;
}

/**
 * Throws INVALID_ENTRY unless an entry or pattern with this kind and resource
 * may be written to the calendar calendarId.
 *
 * Args:
 *   calendarId: The id of the calendar that owns the month or pattern.
 *   kind: The entry kind's row. requiresResource decides whether a resource is
 *     required (RESOURCE_REQUIRED) or forbidden (RESOURCE_NOT_ALLOWED).
 *   resource: The resource's row, or null for a resource-less kind.
 *   isNew: True when the write creates the row or moves it to this resource.
 *     Only new rows are refused on an inactive resource (INACTIVE_RESOURCE),
 *     so existing entries there can still be edited.
 *
 * A kind or resource from another calendar fails with CALENDAR_MISMATCH.
 */
export function assertEntryShape({
  calendarId,
  kind,
  resource,
  isNew,
}: {
  calendarId: string;
  kind: { calendarId: string; code: string; requiresResource: boolean };
  resource: { calendarId: string; code: string; isActive: boolean } | null;
  isNew: boolean;
}): void {
  if (kind.calendarId !== calendarId) {
    throw new InvalidEntryError(
      "CALENDAR_MISMATCH",
      `Kind ${kind.code} belongs to another calendar`,
    );
  }
  if (resource && resource.calendarId !== calendarId) {
    throw new InvalidEntryError(
      "CALENDAR_MISMATCH",
      `Resource ${resource.code} belongs to another calendar`,
    );
  }
  if (kind.requiresResource && !resource) {
    throw new InvalidEntryError(
      "RESOURCE_REQUIRED",
      `Kind ${kind.code} requires a resource`,
    );
  }
  if (!kind.requiresResource && resource) {
    throw new InvalidEntryError(
      "RESOURCE_NOT_ALLOWED",
      `Kind ${kind.code} takes no resource, got ${resource.code}`,
    );
  }
  if (isNew && resource && !resource.isActive) {
    throw new InvalidEntryError(
      "INACTIVE_RESOURCE",
      `Resource ${resource.code} is inactive`,
    );
  }
}

/**
 * Throws INVALID_ENTRY with reason NOT_CANCELLABLE unless kind allows cancel
 * and un-cancel.
 */
export function assertCancellable(kind: { cancellable: boolean }): void {
  if (!kind.cancellable) {
    throw new InvalidEntryError(
      "NOT_CANCELLABLE",
      "Entries of this kind can't be cancelled",
    );
  }
}
