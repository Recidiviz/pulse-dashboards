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

import { differenceInCalendarDays, isBefore, startOfDay } from "date-fns";

import { UsMoClientMetadata } from "~datatypes";

export type ObjectiveDueStatus = "overdue" | "dueSoon" | "due" | "completed";

export const CASE_PLAN_PAGE_SIZE = 3;

/**
 * Classifies an objective's status:
 * - `"completed"` when `completionDate` is set (takes precedence over any
 *   planned-end-date comparison — a completed objective is never overdue),
 * - `"overdue"` when `plannedEndDate` falls before the start of `now`'s day,
 * - `"dueSoon"` when `plannedEndDate` is today or within the next 7 calendar
 *   days,
 * - `"due"` when `plannedEndDate` is set but further out than 7 days,
 * - `null` when there's no date at all (and not completed).
 *
 * `now` defaults to the current time; callers (e.g. examples / tests) can pin
 * it for deterministic output.
 */
export function getObjectiveDueStatus(
  completionDate: Date | null | undefined,
  plannedEndDate: Date | null | undefined,
  now: Date = new Date(),
): ObjectiveDueStatus | null {
  if (completionDate) return "completed";
  if (!plannedEndDate) return null;

  const startOfToday = startOfDay(now);
  if (isBefore(plannedEndDate, startOfToday)) return "overdue";

  const daysUntilDue = differenceInCalendarDays(plannedEndDate, startOfToday);
  if (daysUntilDue <= 7) return "dueSoon";

  return "due";
}

const OBJECTIVE_STATUS_SORT_ORDER: Record<ObjectiveDueStatus | "none", number> =
  {
    overdue: 0,
    dueSoon: 1,
    due: 2,
    none: 3,
    completed: 4,
  };

type CasePlanObjective = NonNullable<
  UsMoClientMetadata["casePlan"]
>[number]["objectivesAndTechniques"][number];

type ComparableObjective = Pick<
  CasePlanObjective,
  "objectiveEndDate" | "objectivePlannedEndDate"
>;

/**
 * Orders case plan objectives within a goal: Overdue, then Due Soon, then
 * Due, then objectives with no date at all, then Completed last. Within a
 * shared status, objectives are further sorted newest-first by the date that
 * drove that status (`objectiveEndDate` for Completed, `objectivePlannedEndDate`
 * otherwise).
 */
export function compareObjectivesByStatus(
  a: ComparableObjective,
  b: ComparableObjective,
  now: Date = new Date(),
): number {
  const statusA =
    getObjectiveDueStatus(a.objectiveEndDate, a.objectivePlannedEndDate, now) ??
    "none";
  const statusB =
    getObjectiveDueStatus(b.objectiveEndDate, b.objectivePlannedEndDate, now) ??
    "none";

  if (statusA !== statusB) {
    return (
      OBJECTIVE_STATUS_SORT_ORDER[statusA] -
      OBJECTIVE_STATUS_SORT_ORDER[statusB]
    );
  }

  const dateField =
    statusA === "completed" ? "objectiveEndDate" : "objectivePlannedEndDate";
  const dateA = a[dateField];
  const dateB = b[dateField];

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  return dateB.getTime() - dateA.getTime();
}

export function paginateCasePlanGoals(
  casePlan: NonNullable<UsMoClientMetadata["casePlan"]>,
  requestedPage: number,
  pageSize: number = CASE_PLAN_PAGE_SIZE,
): {
  goals: NonNullable<UsMoClientMetadata["casePlan"]>;
  currentPage: number;
  totalPages: number;
} {
  const totalPages = Math.max(1, Math.ceil(casePlan.length / pageSize));
  const currentPage = Math.min(Math.max(requestedPage, 0), totalPages - 1);
  const start = currentPage * pageSize;
  return {
    goals: casePlan.slice(start, start + pageSize),
    currentPage,
    totalPages,
  };
}
