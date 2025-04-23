// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { addDays, isPast, parseISO, startOfToday } from "date-fns";
import { deleteField } from "firebase/firestore";
import { action, computed, makeObservable } from "mobx";

import { fieldToDate } from "~datatypes";

import { SupervisionTaskUpdate } from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { formatDate, formatDueDateFromToday } from "../../utils";
import { JusticeInvolvedPerson } from "../types";
import {
  SnoozeInfo,
  SupervisionDetailsForTask,
  SupervisionTask,
  SupervisionTaskRecord,
  SupervisionTaskType,
} from "./types";

/**
 * Implements functionality shared by a single task.
 */
export abstract class Task<
  TaskType extends SupervisionTaskType = SupervisionTaskType,
> implements SupervisionTask<TaskType>
{
  task: SupervisionTaskRecord<TaskType>;

  person: JusticeInvolvedPerson;

  rootStore: RootStore;

  updates?: SupervisionTaskUpdate[TaskType];

  /* ex: Risk assessment */
  abstract displayName: string;

  constructor(
    rootStore: RootStore,
    task: SupervisionTaskRecord<TaskType>,
    person: JusticeInvolvedPerson,
    updates?: SupervisionTaskUpdate[TaskType],
  ) {
    makeObservable(this, {
      updates: true,
      snoozeInfo: computed,
      isSnoozed: computed,
      updateSupervisionTask: action,
    });
    this.rootStore = rootStore;
    this.task = task;
    this.person = person;
    this.updates = updates;
  }

  get type(): TaskType {
    return this.task.type;
  }

  get key(): string {
    return `${this.task.type}-${this.person.externalId}`;
  }

  abstract get additionalDetails(): string | undefined;

  get dueDate(): Date {
    return fieldToDate(this.task.dueDate);
  }

  get isOverdue(): boolean {
    return isPast(addDays(this.dueDate, 2));
  }

  get dueDateFromToday(): string {
    return formatDueDateFromToday(this.dueDate);
  }

  get details(): SupervisionDetailsForTask[TaskType] {
    return this.task.details;
  }

  /* ex: Risk assessment due 3 days ago */
  get dueDateDisplayLong() {
    return `${this.displayName} recommended ${this.dueDateFromToday}`;
  }

  /* ex: Due 3 days ago */
  get dueDateDisplayShort() {
    return `Recommended ${this.dueDateFromToday}`;
  }

  get frequency(): string {
    // This is reimplemented directly on the classes for the tasks that currently use it
    return "";
  }

  get snoozeInfo(): SnoozeInfo | undefined {
    if (!this.updates?.snoozedOn) return;
    return {
      snoozedBy: this.updates.snoozedBy,
      snoozedOn: this.updates.snoozedOn,
      snoozedUntil: addDays(
        parseISO(this.updates.snoozedOn),
        this.updates.snoozeForDays,
      ),
    };
  }

  get isSnoozed(): boolean {
    if (!this.snoozeInfo) return false;
    return this.snoozeInfo.snoozedUntil >= startOfToday();
  }

  updateSupervisionTask(snoozeForDays?: number): void {
    const {
      workflowsStore: { currentUserEmail },
      firestoreStore,
    } = this.rootStore;
    if (!currentUserEmail) return;

    if (snoozeForDays === undefined) {
      firestoreStore.updateSupervisionTask(this.person.recordId, {
        [this.type]: deleteField(),
      });
      return;
    }

    const update = {
      [this.type]: {
        snoozeForDays,
        snoozedBy: currentUserEmail,
        snoozedOn: formatDate(new Date(), "yyyy-MM-dd"),
      },
    };
    firestoreStore.updateSupervisionTask(this.person.recordId, update);
  }
}
