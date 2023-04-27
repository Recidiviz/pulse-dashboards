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

import { TaskValidationError } from "../../errors";
import { CollectionName } from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import tenants from "../../tenants";
import {
  CollectionDocumentSubscription,
  DocumentSubscription,
  ValidateFunction,
} from "../subscriptions";
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
  TaskRecord extends DocumentData
> implements SupervisionTaskInterface
{
  rootStore: RootStore;

  person: PersonType;

  taskSubscription: DocumentSubscription<TaskRecord>;

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
  }

  get record(): TaskRecord | undefined {
    return this.taskSubscription.data;
  }

  get tasks(): SupervisionTask<SupervisionTaskType>[] {
    return (this.record?.tasks || []).map((task: SupervisionTaskRecord) => {
      if (
        !this.rootStore.currentTenantId ||
        !tenants[this.rootStore.currentTenantId].tasks
      )
        return;
      const TaskConstructor =
        tenants[this.rootStore.currentTenantId].tasks?.[task.type];

      if (!TaskConstructor) {
        throw new TaskValidationError(
          `Missing a class constructor for task with type: ${task.type}`
        );
      }

      return new TaskConstructor(task, task.type, this.person);
    });
  }

  get needs(): SupervisionNeed[] {
    return this.record?.needs || [];
  }

  get overdueTasks(): SupervisionTask<SupervisionTaskType>[] {
    return this.tasks.filter((task) => task.isOverdue);
  }

  get upcomingTasks(): SupervisionTask<SupervisionTaskType>[] {
    return this.tasks.filter((task) => !task.isOverdue);
  }

  get orderedTasks(): SupervisionTask<SupervisionTaskType>[] {
    return this.tasks.sort(taskDueDateComparator);
  }

  get isHydrated(): boolean {
    return this.taskSubscription.isHydrated;
  }

  hydrate(): void {
    this.taskSubscription.hydrate();
  }

  get isLoading(): boolean | undefined {
    return this.taskSubscription.isLoading;
  }

  get error(): Error | undefined {
    return this.taskSubscription.error;
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
