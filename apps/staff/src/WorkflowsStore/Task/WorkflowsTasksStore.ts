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

import { orderBy } from "lodash";
import { computed, makeAutoObservable } from "mobx";

import { SupervisionTaskCategory } from "../../core/WorkflowsTasks/fixtures";
import { JusticeInvolvedPerson } from "../types";
import { getEntries } from "../utils";
import type { WorkflowsStore } from "../WorkflowsStore";
import { taskDueDateComparator } from "./TasksBase";
import {
  SUPERVISION_NEED_TYPES,
  SUPERVISION_TASK_TYPES,
  SupervisionNeedType,
  SupervisionTask,
  SupervisionTaskType,
} from "./types";

type TasksByCategory = Record<
  SupervisionTaskType,
  SupervisionTask<SupervisionTaskType>[]
>;

type PersonsByNeed = Record<SupervisionNeedType, JusticeInvolvedPerson[]>;

const buildRecordList = <K extends string, V>(
  types: readonly string[],
): Record<K, V[]> => {
  return types.reduce((memo, type) => {
    return {
      ...memo,
      [type]: [],
    };
  }, {}) as Record<K, V[]>;
};

export class WorkflowsTasksStore {
  workflowsStore: WorkflowsStore;

  selectedCategory: SupervisionTaskCategory = "DUE_THIS_MONTH";

  constructor(workflowsStore: WorkflowsStore) {
    this.workflowsStore = workflowsStore;
    makeAutoObservable(this, {
      clientsPartitionedByStatus: computed,
      orderedTasksByCategory: computed,
      orderedPersonsByNeed: computed,
      workflowsStore: false,
    });
  }

  get orderedTasksByCategory(): TasksByCategory {
    const { caseloadPersonsSorted } = this.workflowsStore;

    const tasksByType = buildRecordList<
      SupervisionTaskType,
      SupervisionTask<SupervisionTaskType>
    >(SUPERVISION_TASK_TYPES);

    caseloadPersonsSorted.forEach((person) => {
      const { supervisionTasks } = person;

      if (!supervisionTasks) return;

      supervisionTasks.readyOrderedTasks.forEach((task) => {
        tasksByType[task.type].push(task);
      });
    });

    getEntries(tasksByType).forEach(([type, tasks]) => {
      tasksByType[type] = tasks.sort(taskDueDateComparator);
    });

    return tasksByType;
  }

  get orderedPersonsByNeed(): PersonsByNeed {
    const { caseloadPersonsSorted } = this.workflowsStore;

    const personsByNeed = buildRecordList<
      SupervisionNeedType,
      JusticeInvolvedPerson
    >(SUPERVISION_NEED_TYPES);

    caseloadPersonsSorted.forEach((person) => {
      const { supervisionTasks } = person;

      if (!supervisionTasks) return;

      supervisionTasks.needs.forEach((need) => {
        personsByNeed[need.type].push(person);
      });
    });
    getEntries(personsByNeed).forEach(([type, persons]) => {
      personsByNeed[type] = orderBy(persons, (person) =>
        person.fullName?.surname?.toLowerCase(),
      );
    });

    return personsByNeed;
  }

  toggleSelectedTaskCategory(category: SupervisionTaskCategory): void {
    this.selectedCategory =
      this.selectedCategory === category ? "DUE_THIS_MONTH" : category;

    this.workflowsStore.rootStore.analyticsStore.trackTaskFilterSelected({
      taskCategory: this.selectedCategory,
      selectedSearchIds: this.workflowsStore.selectedSearchIds,
    });
  }

  get clientsPartitionedByStatus(): [
    JusticeInvolvedPerson[],
    JusticeInvolvedPerson[],
  ] {
    const personsWithOverdueTasks = this.workflowsStore.caseloadPersonsSorted
      .filter(
        (person) =>
          !!person.supervisionTasks &&
          person.supervisionTasks.overdueTasks.length > 0,
      )
      .sort((personA, personB) => {
        if (!personA.supervisionTasks || !personB.supervisionTasks) return 0;
        return (
          +personA.supervisionTasks.orderedTasks[0].dueDate -
          +personB.supervisionTasks.orderedTasks[0].dueDate
        );
      });

    const personsWithUpcomingTasks = this.workflowsStore.caseloadPersonsSorted
      .filter(
        (person) =>
          !!person.supervisionTasks &&
          person.supervisionTasks.upcomingTasks.length > 0 &&
          !(person.supervisionTasks.overdueTasks.length > 0),
      )
      .sort((personA, personB) => {
        if (!personA.supervisionTasks || !personB.supervisionTasks) return 0;
        return (
          +personA.supervisionTasks.orderedTasks[0].dueDate -
          +personB.supervisionTasks.orderedTasks[0].dueDate
        );
      });

    return [personsWithOverdueTasks, personsWithUpcomingTasks];
  }
}
