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
export type RecurrenceFreq =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY"
  | "CUSTOM";

/**
 * The subset of `RecurrenceFreq` that's an actual RRULE frequency — i.e.
 * what the custom section's unit dropdown offers. `"NONE"` and `"CUSTOM"`
 * are UI-only concepts with no corresponding RRULE `FREQ` value.
 */
export type RecurrenceUnit = Exclude<RecurrenceFreq, "NONE" | "CUSTOM">;

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

const FREQUENCY_MAP: Record<RecurrenceUnit, Frequency> = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
  YEARLY: RRule.YEARLY,
};

/**
 * Build an iCal RRULE string for `freq` anchored on `anchor`. Returns
 * `null` when there's nothing to persist — `freq === "NONE"` (one-off),
 * `freq === "CUSTOM"` (not a real RRULE frequency; callers building a
 * custom recurrence should pass its underlying DAILY/WEEKLY/etc unit
 * instead), or no anchor date yet (the user picked a chip before a date;
 * submission is gated upstream until both inputs are present).
 */
export function buildRecurrenceRule(
  freq: RecurrenceFreq,
  anchor: Date | null,
  interval?: number,
): Recurrence {
  if (freq === "NONE" || freq === "CUSTOM" || anchor === null) return null;
  return new RRule({
    freq: FREQUENCY_MAP[freq],
    interval: interval ?? 1,
    ...byClausesFor(freq, anchor),
  }).toString();
}

/**
 * Resolve a UI freq selection to the RRULE to persist, substituting the
 * custom section's unit/interval when `freq === "CUSTOM"` — the one freq
 * value `buildRecurrenceRule` can't build directly, since `"CUSTOM"` isn't
 * a real RRULE frequency.
 */
export function resolveRecurrenceRule(
  freq: RecurrenceFreq,
  anchor: Date | null,
  customUnit: RecurrenceUnit,
  customInterval: number,
): Recurrence {
  return freq === "CUSTOM"
    ? buildRecurrenceRule(customUnit, anchor, customInterval)
    : buildRecurrenceRule(freq, anchor);
}

function byClausesFor(
  freq: RecurrenceUnit,
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

// Reverse of `FREQUENCY_MAP`, so the two can't drift apart.
const LABEL_BY_FREQUENCY = new Map<Frequency, RecurrenceUnit>(
  (Object.entries(FREQUENCY_MAP) as [RecurrenceUnit, Frequency][]).map(
    ([unit, freq]) => [freq, unit],
  ),
);

function frequencyToLabel(freq: Frequency): RecurrenceUnit | null {
  return LABEL_BY_FREQUENCY.get(freq) ?? null;
}

// Shared parse step behind `getRecurrenceFreq`/`getRecurrenceCustomFields`.
function parseRecurrenceRule(
  rrule: Recurrence,
): { unit: RecurrenceUnit; interval: number } | null {
  if (!rrule) return null;
  try {
    const { freq, interval } = RRule.fromString(rrule).options;
    const unit = frequencyToLabel(freq);
    return unit ? { unit, interval } : null;
  } catch {
    return null;
  }
}

/**
 * Derive the UI-facing `RecurrenceFreq` label from a stored RRULE. Used
 * when hydrating an existing task so the picker chip reflects what's
 * persisted. An interval other than 1 can only have come from the custom
 * section — none of the top-level chips ever persist one — so that's
 * reported as `"CUSTOM"` rather than the underlying DAILY/WEEKLY/etc freq.
 * Malformed or unsupported RRULEs collapse to `"NONE"` so a bad value in
 * Firestore doesn't break the row.
 */
export function getRecurrenceFreq(rrule: Recurrence): RecurrenceFreq {
  const parsed = parseRecurrenceRule(rrule);
  if (!parsed) return "NONE";
  return parsed.interval !== 1 ? "CUSTOM" : parsed.unit;
}

/**
 * Derive the custom section's unit + interval from a stored RRULE, to seed
 * the "Repeat every N <unit>" controls when hydrating an existing custom
 * recurrence. Falls back to day(s)/1 for anything unparseable or absent,
 * matching the footer's blank-slate default.
 */
export function getRecurrenceCustomFields(rrule: Recurrence): {
  unit: RecurrenceUnit;
  interval: number;
} {
  return parseRecurrenceRule(rrule) ?? { unit: "DAILY", interval: 1 };
}

/**
 * Human-readable description via `rrule`'s built-in `toText()` (e.g.
 * "every week on Friday", "every month on the 18th"). Returns `null`
 * for one-off or malformed input so callers can skip rendering the
 * caption entirely.
 *
 * `toText()`'s YEARLY builder renders a custom interval awkwardly (e.g.
 * "every 4 years August on the 26th"); reordered here to "every 4 years
 * on August 26th".
 */
export function describeRecurrence(rrule: Recurrence): string | null {
  if (!rrule) return null;
  try {
    return RRule.fromString(rrule)
      .toText()
      .replace(/^(every \d+ years) (\w+) on the (\w+)$/, "$1 on $2 $3");
  } catch {
    return null;
  }
}
