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

import { fieldToDate, VitalsMetricId } from "~datatypes";
import { formatDate } from "~utils";

import { SupervisionTaskUpdate } from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { formatDueDateFromToday } from "../../utils";
import { Client } from "../Client";
import {
  type SnoozeInfo,
  type SnoozeOptions,
  type SupervisionDetailsForTask,
  type SupervisionTask,
  type SupervisionTaskRecord,
  type SupervisionTaskType,
} from "./types";

/**
 * Implements functionality shared by a single task.
 */
export abstract class Task<TaskType extends SupervisionTaskType>
  implements SupervisionTask<TaskType>
{
  task: SupervisionTaskRecord<TaskType>;

  person: Client;

  rootStore: RootStore;

  updates?: SupervisionTaskUpdate[TaskType];

  /* ex: Risk assessment */
  displayName: string;

  vitalsMetricId?: VitalsMetricId = undefined;

  constructor(
    rootStore: RootStore,
    task: SupervisionTaskRecord<TaskType>,
    person: Client,
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
    this.displayName = this.getDisplayName;
  }

  get type(): TaskType {
    return this.task.type;
  }

  get key(): string {
    return `${this.task.type}-${this.person.externalId}-${this.task.dueDate}`;
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

  get includeInRoutePlanner(): boolean {
    return this.task.includeInRoutePlanner ?? false;
  }

  get routePlannerDisplayName(): string | undefined {
    return this.task.routePlannerDisplayName;
  }

  get getDisplayName(): string {
    return this.task.taskDisplayName;
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

  get contactWindow(): string | undefined {
    // This is reimplemented directly on the classes for the tasks that currently use it
    return;
  }

  get supplementaryContacts(): string[] {
    // Additional contacts to show in the preview timeline (e.g. attempted contacts).
    return [];
  }

  get scheduledContactDates(): Date[] | undefined {
    // This is reimplemented directly on the classes for the tasks that currently use it
    return;
  }

  /**
   * @returns An array of the scheduled contact dates for this task that are today
   *          or later, without duplicates, sorted in ascending order;
   *          an empty list if there are no future scheduled contact dates;
   *          or undefined if scheduled contact dates don't apply to this task type
   */
  get futureScheduledContacts(): Date[] | undefined {
    if (!this.scheduledContactDates) return undefined;

    const futureContacts = this.scheduledContactDates.filter(
      (date) => date >= startOfToday(),
    );
    // We might have duplicate scheduled contact dates that should be removed
    return Array.from(new Set(futureContacts)).sort();
  }

  /**
   * @returns true if there is at least one scheduled contact date in the future,
   *          false if all scheduled dates were in the past,
   *          undefined if scheduled contact dates don't apply to this task type
   */
  get hasFutureScheduledContact(): boolean | undefined {
    return (
      this.futureScheduledContacts && this.futureScheduledContacts.length > 0
    );
  }

  get snoozeInfo(): SnoozeInfo | undefined {
    if (!this.updates?.snoozedOn) return;
    const { snoozeForDays, snoozedBy, snoozedOn, snoozeReason } = this.updates;
    if (snoozeForDays === "FOREVER") {
      const {
        workflowsStore: {
          featureVariants: { tasksPermasnooze },
        },
      } = this.rootStore;
      // Ignore a persisted "FOREVER" record when the feature is disabled —
      // the rest of the system will treat the task as not snoozed and it
      // will reappear in the upcoming list.
      if (!tasksPermasnooze) return undefined;
      return { snoozedBy, snoozedOn, snoozedUntil: "FOREVER", snoozeReason };
    }
    return {
      snoozedBy,
      snoozedOn,
      snoozedUntil: addDays(parseISO(snoozedOn), snoozeForDays),
      snoozeReason,
    };
  }

  get isSnoozed(): boolean {
    if (!this.snoozeInfo) return false;
    if (this.snoozeInfo.snoozedUntil === "FOREVER") return true;
    return this.snoozeInfo.snoozedUntil >= startOfToday();
  }

  updateSupervisionTask(
    snoozeForDays?: SnoozeOptions,
    snoozeReason?: string,
  ): void {
    const {
      workflowsStore: { currentUserEmail },
      firestoreStore,
      analyticsStore,
    } = this.rootStore;
    if (!currentUserEmail) return;

    const trimmedReason = snoozeReason?.trim() || undefined;

    analyticsStore.trackTaskSnoozed({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      taskType: this.type,
      snoozeForDays,
      withReason: trimmedReason !== undefined,
    });

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
        ...(trimmedReason !== undefined && { snoozeReason: trimmedReason }),
      },
    };
    firestoreStore.updateSupervisionTask(this.person.recordId, update);
  }
}
