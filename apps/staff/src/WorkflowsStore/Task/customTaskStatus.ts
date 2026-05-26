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

import { Timestamp } from "firebase/firestore";
import { RRule } from "rrule";

import { CustomTaskRecord } from "../../FirestoreStore";

function toDate(value: Timestamp | Date | null | undefined): Date | null {
  if (value == null) return null;
  return value instanceof Timestamp ? value.toDate() : value;
}

function parseRuleWithDtstart(rrule: string, dtstart: Date): RRule | null {
  try {
    const opts = RRule.parseString(rrule);
    opts.dtstart = dtstart;
    return new RRule(opts);
  } catch {
    return null;
  }
}

/**
 * The "next due date" for a custom task — i.e., what the row should show
 * as `Due …`.
 *
 * - Non-recurring task → returns the stored `dueDate`.
 * - Recurring task never completed → returns the most recent occurrence
 *   at-or-before `now`, falling back to `dueDate` when the first
 *   occurrence is still in the future.
 * - Recurring task previously completed → returns the next occurrence
 *   strictly after `completedOn` (the cycle the user needs to do next).
 */
export function getNextDueDate(
  task: Pick<CustomTaskRecord, "dueDate" | "recurrence" | "completedOn">,
  now: Date = new Date(),
): Date {
  const dueDate = toDate(task.dueDate) ?? now;
  if (!task.recurrence) return dueDate;

  const rule = parseRuleWithDtstart(task.recurrence, dueDate);
  if (!rule) return dueDate;

  const completedOn = toDate(task.completedOn);
  if (completedOn) {
    return rule.after(completedOn, false) ?? dueDate;
  }
  return rule.before(now, true) ?? dueDate;
}

/**
 * Whether a task is currently considered completed in the UI.
 *
 * - Non-recurring → returns the stored `completed` boolean (unchanged
 *   semantics).
 * - Recurring → returns `true` iff `completedOn` exists **and** the next
 *   due occurrence is still in the future. Once `now` rolls past that
 *   next occurrence, the task auto-resets to incomplete for the new
 *   cycle without any persisted write.
 */
export function isTaskCompleted(
  task: Pick<CustomTaskRecord, "completedOn" | "dueDate" | "recurrence">,
  now: Date = new Date(),
): boolean {
  if (!task.completedOn) return false;
  if (!task.recurrence) return true;
  return getNextDueDate(task, now) > now;
}
