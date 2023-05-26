/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import { DocumentData } from "firebase/firestore";
import { action, computed, makeObservable } from "mobx";

import { SnoozeTaskConfig } from "../../core/models/types";
import { TaskValidationError } from "../../errors";
import { CollectionName, SupervisionTaskUpdate } from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import tenants from "../../tenants";
import {
  CollectionDocumentSubscription,
  DocumentSubscription,
  ValidateFunction,
} from "../subscriptions";
import { SupervisionTaskUpdateSubscription } from "../subscriptions/SupervisionTaskUpdateSubscription";
import { JusticeInvolvedPerson } from "../types";
import {
  SupervisionNeed,
  SupervisionTask,
  SupervisionTaskInterface,
  SupervisionTaskRecord,
  SupervisionTaskType,
} from "./types";

/**
 * Implements functionality shared by all Tasks, most notably the `Hydratable` interface.
 * While this is an abstract class, it provides stubs rather than abstract properties, whenever possible,
 * to facilitate incremental development of new tasks.
 */
export abstract class TasksBase<
  PersonType extends JusticeInvolvedPerson,
  TaskRecord extends DocumentData,
  UpdateRecord extends SupervisionTaskUpdate
> implements SupervisionTaskInterface
{
  rootStore: RootStore;

  person: PersonType;

  taskSubscription: DocumentSubscription<TaskRecord>;

  updatesSubscription: DocumentSubscription<UpdateRecord>;

  constructor(
    rootStore: RootStore,
    person: PersonType,
    collectionName: CollectionName,
    validateRecord?: ValidateFunction<TaskRecord>
  ) {
    makeObservable(this, {
      error: computed,
      hydrate: action,
      isLoading: computed,
      record: computed,
      updates: computed,
      isHydrated: computed,
      tasks: true,
      needs: true,
    });
    this.person = person;
    this.rootStore = rootStore;

    this.taskSubscription = new CollectionDocumentSubscription<TaskRecord>(
      this.rootStore.firestoreStore,
      collectionName,
      person.recordId,
      undefined,
      validateRecord
    );

    this.updatesSubscription =
      new SupervisionTaskUpdateSubscription<UpdateRecord>(
        this.rootStore.firestoreStore,
        person.recordId
      );
  }

  get record(): TaskRecord | undefined {
    return this.taskSubscription.data;
  }

  get updates(): UpdateRecord | undefined {
    return this.updatesSubscription.data;
  }

  get tasks(): SupervisionTask<SupervisionTaskType>[] {
    if (!this.isHydrated) return [];
    return (this.record?.tasks || []).map(
      <T extends SupervisionTaskType>(task: SupervisionTaskRecord<T>) => {
        if (
          !this.rootStore.currentTenantId ||
          !tenants[this.rootStore.currentTenantId].tasks
        )
          return;

        const TaskConstructor =
          tenants[this.rootStore.currentTenantId].tasks?.[task.type];

        if (TaskConstructor === undefined) {
          throw new TaskValidationError(
            `Missing a class constructor for task with type: ${task.type}`
          );
        }

        return new TaskConstructor(
          this.rootStore,
          task,
          this.person,
          this.updates?.[task.type]
        );
      }
    );
  }

  get needs(): SupervisionNeed[] {
    return this.record?.needs || [];
  }

  /**
   * Tasks that are not snoozed and are overdue
   */
  get overdueTasks(): SupervisionTask<SupervisionTaskType>[] {
    return this.readyTasks.filter((task) => task.isOverdue);
  }

  /**
   * Tasks that are not snoozed and are not overdue
   */
  get upcomingTasks(): SupervisionTask<SupervisionTaskType>[] {
    return this.readyTasks.filter((task) => !task.isOverdue);
  }

  /**
   * All tasks ordered by due date for the list of tasks on the preview panel and client profile
   */
  get orderedTasks(): SupervisionTask<SupervisionTaskType>[] {
    return this.tasks.sort(taskDueDateComparator);
  }

  /**
   * Ready tasks ordered by due date for the list of tasks displayed on the Task page.
   */
  get readyOrderedTasks(): SupervisionTask<SupervisionTaskType>[] {
    return this.readyTasks.sort(taskDueDateComparator);
  }

  /**
   * Tasks that are not snoozed
   */
  get readyTasks(): SupervisionTask<SupervisionTaskType>[] {
    return this.tasks.filter((task) => !task.isSnoozed);
  }

  get isHydrated(): boolean {
    return (
      this.taskSubscription.isHydrated && this.updatesSubscription.isHydrated
    );
  }

  get snoozeTasksConfig(): SnoozeTaskConfig | undefined {
    if (!this.rootStore.currentTenantId) return;
    return tenants[this.rootStore.currentTenantId].workflowsTasksConfig;
  }

  hydrate(): void {
    this.taskSubscription.hydrate();
    this.updatesSubscription.hydrate();
  }

  get isLoading(): boolean | undefined {
    if (
      this.taskSubscription.isLoading === undefined ||
      this.updatesSubscription.isLoading === undefined
    ) {
      return undefined;
    }
    return (
      this.taskSubscription.isLoading || this.updatesSubscription.isLoading
    );
  }

  get error(): Error | undefined {
    return this.taskSubscription.error || this.updatesSubscription.error;
  }

  trackPreviewed(): void {
    this.rootStore.analyticsStore.trackTaskPreviewed({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      taskTypes: [
        ...(this.tasks?.map((task) => task.type) ?? []),
        ...(this.needs?.map((need) => need.type) ?? []),
      ],
    });
  }
}

export const taskDueDateComparator = (
  a: SupervisionTask<any>,
  b: SupervisionTask<any>
) => +a.dueDate - +b.dueDate;
