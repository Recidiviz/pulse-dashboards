// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { mapValues } from "lodash";
import { makeAutoObservable } from "mobx";

import {
  compositeHydrationState,
  Hydratable,
  HydrationState,
  isHydrated,
} from "~hydration-utils";

import { PartialRecord } from "../../utils/typeUtils";
import {
  Client,
  SupervisionTask,
  SupervisionTaskType,
  WorkflowsStore,
} from "../../WorkflowsStore";
import { SearchStore } from "../../WorkflowsStore/SearchStore";

/**
 * Responsible for keeping track of selected clients and officers on the
 * Tasks Route Planner page.
 */
export class RoutePlannerClientsPresenter implements Hydratable {
  private readonly searchStore: SearchStore;

  private TASK_TYPE_COPY: PartialRecord<SupervisionTaskType, string> = {
    usTxHomeContactScheduled: "Scheduled",
    usTxHomeContactUnscheduled: "Unscheduled",
    usTxHomeContactEdgeCase: "Ad Hoc",
  };
  private SHORT_SUPERVISION_LEVEL_COPY: Record<string, string> = {
    High: "H",
    Moderate: "M",
    "Low-Moderate": "L–M",
    Low: "L",
    Annual: "A",
    "In-custody": "I–C",
  };

  constructor(private readonly workflowsStore: WorkflowsStore) {
    this.searchStore = workflowsStore.searchStore;
    makeAutoObservable(this);
  }

  hydrate() {
    this.workflowsStore.caseloadPersons.forEach((person) => {
      if (
        person instanceof Client &&
        person.supervisionTasks &&
        !isHydrated(person.supervisionTasks)
      ) {
        person.supervisionTasks.hydrate();
      }
    });
  }

  get hydrationState(): HydrationState {
    const taskHydrators = this.workflowsStore.caseloadPersons.flatMap(
      (person) => (person.supervisionTasks ? [person.supervisionTasks] : []),
    );

    return compositeHydrationState([this.workflowsStore, ...taskHydrators]);
  }

  get selectedOfficers() {
    return this.searchStore.selectedSearchables;
  }

  /**
   * @returns Record mapping selected caseload IDs to a list of home contact tasks
   * for each caseload.
   */
  get contacts() {
    return mapValues(this.searchStore.caseloadPersonsGrouped, (persons) =>
      persons.flatMap((person) => {
        if (person.supervisionTasks) {
          return person.supervisionTasks.readyOrderedTasks.filter(({ type }) =>
            Object.keys(this.TASK_TYPE_COPY).includes(type),
          );
        }
        return [];
      }),
    );
  }

  /**
   * @returns copy used in ClientCard for a specific task
   */
  getClientCardCopy(task: SupervisionTask) {
    const person = task.person as Client;

    return {
      supervisionLevelShort:
        this.SHORT_SUPERVISION_LEVEL_COPY[person.supervisionLevel] ?? "Other",
      supervisionTooltip: person.supervisionLevel,
      type: this.TASK_TYPE_COPY[task.type] ?? "Other",
      scheduledStatus: "To-Do",
    };
  }
}
