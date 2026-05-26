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
import { action, computed, makeObservable } from "mobx";

import { Hydratable, HydrationState } from "~hydration-utils";

import type {
  CustomTaskCreateInput,
  CustomTaskRecord,
  CustomTaskUpdateInput,
} from "../../FirestoreStore";
import type { RootStore } from "../../RootStore";
import { Client } from "../Client";
import { CustomTasksSubscription } from "../subscriptions/CustomTasksSubscription";

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
      hydrationState: computed,
      orderedTasks: computed,
      addCustomTask: action,
      editCustomTask: action,
      toggleCustomTaskCompleted: action,
      deleteCustomTask: action,
    });
  }

  hydrate(): void {
    this.taskSubscription.hydrate();
  }

  get hydrationState(): HydrationState {
    return this.taskSubscription.hydrationState;
  }

  /**
   * Returns the subscription's tasks sorted into two contiguous groups:
   *   1. Active (`completedOn === null`), ascending by `dueDate`.
   *   2. Completed (`completedOn !== null`), ascending by `dueDate`.
   *
   * Soft-deleted docs are already filtered out by the subscription's
   * `where("deletedOn", "==", null)` clause, so no client-side filtering
   * is needed here.
   */
  get orderedTasks(): CustomTaskRecord[] {
    const tasks = this.taskSubscription.data ?? [];
    const active: CustomTaskRecord[] = [];
    const completed: CustomTaskRecord[] = [];
    for (const t of tasks) {
      if (t.completedOn != null) completed.push(t);
      else active.push(t);
    }
    const byDueDate = (a: CustomTaskRecord, b: CustomTaskRecord) =>
      dueDateMs(a.dueDate) - dueDateMs(b.dueDate);
    active.sort(byDueDate);
    completed.sort(byDueDate);
    return [...active, ...completed];
  }

  addCustomTask(input: CustomTaskCreateInput): Promise<void> {
    return this.rootStore.firestoreStore
      .createCustomTask(this.person.recordId, {
        title: input.title,
        dueDate: toTimestamp(input.dueDate),
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
    patch: { title?: string; dueDate?: Timestamp | Date },
  ): Promise<void> {
    const normalized: CustomTaskUpdateInput = {};
    if (patch.title !== undefined) normalized.title = patch.title;
    if (patch.dueDate !== undefined)
      normalized.dueDate = toTimestamp(patch.dueDate);

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

function dueDateMs(value: Timestamp | Date): number {
  return value instanceof Timestamp ? value.toMillis() : value.getTime();
}
