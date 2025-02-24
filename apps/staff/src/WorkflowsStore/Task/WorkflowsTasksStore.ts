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

import { JusticeInvolvedPerson } from "../types";
import { getEntries } from "../utils";
import type { WorkflowsStore } from "../WorkflowsStore";
import { SUPERVISION_NEED_TYPES, SupervisionNeedType } from "./types";

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

  constructor(workflowsStore: WorkflowsStore) {
    this.workflowsStore = workflowsStore;
    makeAutoObservable(this, {
      clientsPartitionedByStatus: computed,
      orderedPersonsByNeed: computed,
      workflowsStore: false,
    });
  }

  get orderedPersonsByNeed(): PersonsByNeed {
    const { caseloadPersons } = this.workflowsStore;

    const personsByNeed = buildRecordList<
      SupervisionNeedType,
      JusticeInvolvedPerson
    >(SUPERVISION_NEED_TYPES);

    caseloadPersons.forEach((person) => {
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

  get clientsPartitionedByStatus(): [
    JusticeInvolvedPerson[],
    JusticeInvolvedPerson[],
  ] {
    const personsWithOverdueTasks = this.workflowsStore.caseloadPersons
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

    const personsWithUpcomingTasks = this.workflowsStore.caseloadPersons
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
