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

import { describeRecurrence } from "../../components/DatePicker";
import { CustomTaskRecord } from "../../FirestoreStore";

// For a nullable field (`completedOn`, `deletedOn`).
export function toDate(
  value: Date | Timestamp | null | undefined,
): Date | null {
  if (value == null) return null;
  return value instanceof Timestamp ? value.toDate() : value;
}

// For a required field (`dueDate`) — keeps a non-nullable `Date` at the
// call site instead of forcing a fallback or assertion around `toDate()`.
export function toRequiredDate(value: Date | Timestamp): Date {
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
  const dueDate = toRequiredDate(task.dueDate);
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

/**
 * Whether a task has been soft-deleted. Unlike completion, deletion isn't
 * time-relative — there's no recurring-rollover concept for it, so once
 * `deletedOn` is stamped the task stays deleted (no `now` to compare
 * against).
 */
export function isTaskDeleted(
  task: Pick<CustomTaskRecord, "deletedOn">,
): boolean {
  return toDate(task.deletedOn) !== null;
}

// e.g. ["Repeats every week on Friday", "Last completed 6/19/2026"]
export function getTaskCaptionParts(
  task: Pick<
    CustomTaskRecord,
    "recurrence" | "completedOn" | "deletedOn" | "dueDate"
  >,
  completed: boolean = isTaskCompleted(task),
): string[] {
  const parts: string[] = [];
  const deleted = isTaskDeleted(task);

  const recurrence = describeRecurrence(task.recurrence ?? null);
  // Present tense while the rule is still active; past tense once deletion
  // has ended it — "Repeats every week" vs. "Repeated every week".
  if (recurrence) {
    parts.push(`${deleted ? "Repeated" : "Repeats"} ${recurrence}`);
  }

  if (completed) {
    const completedString = toDate(task.completedOn)?.toLocaleDateString(
      "en-US",
    );
    parts.push(
      recurrence
        ? `Last completed ${completedString}`
        : `Completed ${completedString}`,
    );
  }
  if (deleted) {
    parts.push(
      `Deleted ${toDate(task.deletedOn)?.toLocaleDateString("en-US")}`,
    );
  }

  return parts;
}
