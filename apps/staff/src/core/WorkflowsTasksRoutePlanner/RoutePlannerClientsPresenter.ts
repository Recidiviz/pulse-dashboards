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

import { captureException } from "@sentry/react";
import { mapValues } from "lodash";
import { makeAutoObservable, reaction } from "mobx";

import {
  compositeHydrationState,
  Hydratable,
  HydrationState,
  isHydrated,
} from "~hydration-utils";

import { PartialRecord } from "../../utils/typeUtils";
import {
  Client,
  JusticeInvolvedPerson,
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
  private selectedPeople: JusticeInvolvedPerson[] = [];

  private TASK_TYPE_COPY: PartialRecord<SupervisionTaskType, string> = {
    usTxHomeContactScheduled: "Scheduled",
    usTxHomeContactUnscheduled: "Unscheduled",
    usTxHomeContactEdgeCase: "Residence Validation",
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

    // If the selected officers change, deselect people who were on a caseload that was removed
    reaction(
      () => this.searchStore.selectedSearchIds,
      (newIds, oldIds) => {
        // only run if search IDs could have been removed
        if (newIds.length <= oldIds.length) {
          this.selectedPeople = this.selectedPeople.filter(
            (person) =>
              person.assignedStaffId && newIds.includes(person.assignedStaffId),
          );
        }
      },
    );
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

  // Public methods for handling the list of selected people

  get selectedAddresses() {
    return this.selectedPeople.map((person) => (person as Client).address);
  }

  get selectedClients(): readonly JusticeInvolvedPerson[] {
    return this.selectedPeople;
  }

  isPersonSelected(person: JusticeInvolvedPerson) {
    return this.indexOfPerson(person) !== -1;
  }

  indexOfPerson(person: JusticeInvolvedPerson) {
    return this.selectedPeople.findIndex(
      (p) => p.pseudonymizedId === person.pseudonymizedId,
    );
  }

  addPerson(person: JusticeInvolvedPerson) {
    this.selectedPeople.push(person);
  }

  removePerson(person: JusticeInvolvedPerson) {
    const i = this.indexOfPerson(person);
    if (i === -1) {
      captureException(
        new Error(
          `Trying to remove person ${person.pseudonymizedId} who isn't in list of selected people`,
        ),
      );
    } else {
      this.selectedPeople.splice(i, 1);
    }
  }
}
