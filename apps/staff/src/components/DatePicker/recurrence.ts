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

import { Frequency, RRule, Weekday } from "rrule";

/**
 * UI-facing labels for the kinds of recurrence we support. Used to drive
 * the chip selector in `RecurrenceFooter`; not persisted directly.
 */
export type RecurrenceFreq = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

/**
 * The persisted recurrence: an iCal RFC-5545 RRULE string (e.g.
 * `"FREQ=WEEKLY;BYDAY=FR"`), or `null` for a one-off task. This is the
 * exact shape Firestore stores and the only thing callers need to
 * round-trip — `freq` is derivable from the string via
 * `getRecurrenceFreq()` when the UI needs it.
 */
export type Recurrence = string | null;

// RRule's weekday objects, indexed by JS `Date.getDay()` (0 = Sunday).
const WEEKDAYS: Weekday[] = [
  RRule.SU,
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
];

const FREQUENCY_MAP: Record<Exclude<RecurrenceFreq, "NONE">, Frequency> = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
  YEARLY: RRule.YEARLY,
};

/**
 * Build an iCal RRULE string for `freq` anchored on `anchor`. Returns
 * `null` when there's nothing to persist — either `freq === "NONE"`
 * (one-off) or no anchor date yet (the user picked a chip before a
 * date; submission is gated upstream until both inputs are present).
 */
export function buildRecurrenceRule(
  freq: RecurrenceFreq,
  anchor: Date | null,
): Recurrence {
  if (freq === "NONE" || anchor === null) return null;
  return new RRule({
    freq: FREQUENCY_MAP[freq],
    ...byClausesFor(freq, anchor),
  }).toString();
}

function byClausesFor(
  freq: Exclude<RecurrenceFreq, "NONE">,
  anchor: Date,
): Partial<{
  byweekday: Weekday;
  bymonthday: number;
  bymonth: number;
}> {
  switch (freq) {
    case "DAILY":
      return {};
    case "WEEKLY":
      return { byweekday: WEEKDAYS[anchor.getDay()] };
    case "MONTHLY":
      return { bymonthday: anchor.getDate() };
    case "YEARLY":
      return { bymonth: anchor.getMonth() + 1, bymonthday: anchor.getDate() };
  }
}

/**
 * Derive the UI-facing `RecurrenceFreq` label from a stored RRULE. Used
 * when hydrating an existing custom task so the picker chip reflects
 * what's persisted. Malformed or unsupported RRULEs collapse to
 * `"NONE"` so a bad value in Firestore doesn't break the row.
 */
export function getRecurrenceFreq(rrule: Recurrence): RecurrenceFreq {
  if (!rrule) return "NONE";
  try {
    return frequencyToLabel(RRule.fromString(rrule).options.freq) ?? "NONE";
  } catch {
    return "NONE";
  }
}

function frequencyToLabel(
  freq: Frequency,
): Exclude<RecurrenceFreq, "NONE"> | null {
  if (freq === RRule.DAILY) return "DAILY";
  if (freq === RRule.WEEKLY) return "WEEKLY";
  if (freq === RRule.MONTHLY) return "MONTHLY";
  if (freq === RRule.YEARLY) return "YEARLY";
  return null;
}

/**
 * Human-readable description via `rrule`'s built-in `toText()` (e.g.
 * "every week on Friday", "every month on the 18th"). Returns `null`
 * for one-off or malformed input so callers can skip rendering the
 * caption entirely.
 */
export function describeRecurrence(rrule: Recurrence): string | null {
  if (!rrule) return null;
  try {
    return RRule.fromString(rrule).toText();
  } catch {
    return null;
  }
}
