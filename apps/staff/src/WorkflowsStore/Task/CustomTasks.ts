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

import { startOfDay } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { action, computed, makeObservable, runInAction } from "mobx";

import { Hydratable, HydrationState } from "~hydration-utils";

import { describeRecurrence } from "../../components/DatePicker";
import type {
  CustomTaskCreateInput,
  CustomTaskRecord,
  CustomTaskUpdateInput,
} from "../../FirestoreStore";
import type { RootStore } from "../../RootStore";
import { formatDueDateFromToday } from "../../utils";
import { Client } from "../Client";
import { CustomTasksSubscription } from "../subscriptions/CustomTasksSubscription";
import { getNextDueDate, isTaskCompleted } from "./customTaskStatus";
import { CUSTOM_TASK_TYPE, CustomTaskItem } from "./types";

/**
 * Helper that converts a `dueDate` value coming from the UI (either a JS
 * Date or a Firestore Timestamp) into the Timestamp shape that the schema
 * accepts. Firestore writes accept either, but normalizing keeps action
 * inputs predictable for callers.
 */
function toTimestamp(value: Timestamp | Date): Timestamp {
  return value instanceof Timestamp ? value : Timestamp.fromDate(value);
}

/**
 * Standalone MobX store wrapping the `CustomTasksSubscription` from PR 2.
 *
 * This class intentionally does NOT extend `TasksBase`. `TasksBase` is shaped
 * around the recurring-supervision-task domain (state-code-specific config,
 * snooze cadence, `SupervisionTaskUpdate` write shape); reusing it for the
 * user-authored custom tasks would require generic relaxations that pollute
 * the supervision-task path. We define a minimal own surface here instead.
 */
export class CustomTasks implements Hydratable {
  rootStore: RootStore;

  person: Client;

  taskSubscription: CustomTasksSubscription;

  constructor(rootStore: RootStore, person: Client) {
    this.rootStore = rootStore;
    this.person = person;
    this.taskSubscription = new CustomTasksSubscription(
      rootStore.firestoreStore,
      person.recordId,
    );

    makeObservable(this, {
      hydrate: action,
      retry: action,
      hydrationState: computed,
      outstandingOrderedTasks: computed,
      allOrderedTasks: computed,
      activeTaskItems: computed,
      addCustomTask: action,
      editCustomTask: action,
      toggleCustomTaskCompleted: action,
      deleteCustomTask: action,
    });
  }

  hydrate(): void {
    this.taskSubscription.hydrate();
  }

  /**
   * Recovers a Firestore listener that has terminated in `"failed"`. The base
   * `FirestoreQuerySubscription` leaves `cancelSnapshotListener` set in its
   * error path, so a fresh `hydrate()` early-returns on the `isActive` check
   * and never re-attaches. We unsubscribe (which clears the listener
   * reference) and reset the hydration state machine so the follow-up
   * `hydrate()` takes the `isHydrationUntouched` branch and flips to
   * `"loading"`. Idempotent in any non-failed state so a single Retry button
   * works for both hydration errors and chunk-load errors.
   */
  retry(): void {
    if (this.taskSubscription.hydrationState.status !== "failed") return;

    this.taskSubscription.unsubscribe();
    runInAction(() => {
      this.taskSubscription.hydrationState = { status: "needs hydration" };
    });
    this.taskSubscription.hydrate();
  }

  get hydrationState(): HydrationState {
    return this.taskSubscription.hydrationState;
  }

  /**
   * The not-yet-completed tasks, ordered the way a row actually displays
   * them. Excludes records that are currently completed — for recurring
   * tasks this defers to `isTaskCompleted`'s auto-rollover logic, so a task
   * whose `completedOn` predates its next occurrence reappears here. Sorted
   * ascending by the resolved next due date (`getNextDueDate`), so the
   * soonest-due item is first.
   *
   * Soft-deleted docs are already filtered out by the subscription's
   * `where("deletedOn", "==", null)` clause, so no client-side filtering
   * is needed here.
   */
  get outstandingOrderedTasks(): CustomTaskRecord[] {
    const now = new Date();
    return (this.taskSubscription.data ?? [])
      .filter((record) => !isTaskCompleted(record, now))
      .sort(
        (a, b) =>
          getNextDueDate(a, now).getTime() - getNextDueDate(b, now).getTime(),
      );
  }

  /**
   * Every task, completed or not, ordered ascending by the resolved next
   * due date (`getNextDueDate`). Completed records are interleaved among the
   * incomplete ones strictly by date rather than grouped at the end.
   *
   * Soft-deleted docs are already filtered out by the subscription's
   * `where("deletedOn", "==", null)` clause.
   */
  get allOrderedTasks(): CustomTaskRecord[] {
    const now = new Date();
    return [...(this.taskSubscription.data ?? [])].sort(
      (a, b) =>
        getNextDueDate(a, now).getTime() - getNextDueDate(b, now).getTime(),
    );
  }

  /**
   * View-model projection of `orderedTasks` for the Tasks-dashboard table.
   * Skips records that are currently completed (for recurring tasks this
   * uses the auto-rollover logic in `isTaskCompleted`), resolves the
   * next-occurrence `dueDate` via `getNextDueDate`, and computes the
   * display strings the column renderers expect. Sorted ascending by
   * resolved `dueDate` so the earliest-due item is first.
   */
  get activeTaskItems(): CustomTaskItem[] {
    const now = new Date();
    const startOfToday = startOfDay(now);
    return (this.taskSubscription.data ?? [])
      .filter((record) => !isTaskCompleted(record, now))
      .map((record): CustomTaskItem => {
        const dueDate = getNextDueDate(record, now);
        const dueDateFromToday = formatDueDateFromToday(dueDate);
        return {
          type: CUSTOM_TASK_TYPE,
          key: record.id,
          dueDate,
          isOverdue: dueDate < startOfToday,
          isSnoozed: false,
          dueDateFromToday,
          dueDateDisplayLong: `${record.title} due ${dueDateFromToday}`,
          dueDateDisplayShort: `Due ${dueDateFromToday}`,
          rootStore: this.rootStore,
          person: this.person,
          displayName: record.title,
          frequency:
            describeRecurrence(record.recurrence ?? null) ?? "One-time",
          record,
        };
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  addCustomTask(input: CustomTaskCreateInput): Promise<void> {
    return this.rootStore.firestoreStore
      .createCustomTask(this.person.recordId, {
        title: input.title,
        dueDate: toTimestamp(input.dueDate),
        recurrence: input.recurrence ?? null,
      })
      .then((taskId) => {
        this.rootStore.analyticsStore.trackCustomTaskCreated({
          justiceInvolvedPersonId: this.person.pseudonymizedId,
          taskId,
        });
      });
  }

  editCustomTask(
    taskId: string,
    patch: {
      title?: string;
      dueDate?: Timestamp | Date;
      recurrence?: string | null;
    },
  ): Promise<void> {
    const normalized: CustomTaskUpdateInput = {};
    if (patch.title !== undefined) normalized.title = patch.title;
    if (patch.dueDate !== undefined)
      normalized.dueDate = toTimestamp(patch.dueDate);
    if (patch.recurrence !== undefined)
      normalized.recurrence = patch.recurrence;

    return this.rootStore.firestoreStore.updateCustomTask(
      this.person.recordId,
      taskId,
      normalized,
    );
  }

  /**
   * Stamps `completedOn` on a transition to true, and nulls it on a
   * transition to false. `updatedOn` is stamped inside
   * `FirestoreStore.updateCustomTask`.
   */
  toggleCustomTaskCompleted(taskId: string, completed: boolean): Promise<void> {
    const patch: CustomTaskUpdateInput = completed
      ? { completedOn: Timestamp.now() }
      : { completedOn: null };

    return this.rootStore.firestoreStore
      .updateCustomTask(this.person.recordId, taskId, patch)
      .then(() => {
        this.rootStore.analyticsStore.trackCustomTaskCompleted({
          justiceInvolvedPersonId: this.person.pseudonymizedId,
          taskId,
          completed,
        });
      });
  }

  deleteCustomTask(taskId: string): Promise<void> {
    return this.rootStore.firestoreStore
      .softDeleteCustomTask(this.person.recordId, taskId)
      .then(() => {
        this.rootStore.analyticsStore.trackCustomTaskDeleted({
          justiceInvolvedPersonId: this.person.pseudonymizedId,
          taskId,
        });
      });
  }
}
