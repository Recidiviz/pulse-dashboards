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

import { makeAutoObservable } from "mobx";

import {
  compositeHydrationState,
  Hydratable,
  isHydrated,
} from "~hydration-utils";

import { Client, WorkflowsStore } from "../../WorkflowsStore";
import { SearchStore } from "../../WorkflowsStore/SearchStore";

/**
 * Responsible for keeping track of selected clients and officers on the
 * Tasks Route Planner page.
 */
export class RoutePlannerClientsPresenter implements Hydratable {
  private readonly searchStore: SearchStore;

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

  get hydrationState() {
    const taskHydrators = this.workflowsStore.caseloadPersons.flatMap(
      (person) => (person.supervisionTasks ? [person.supervisionTasks] : []),
    );

    return compositeHydrationState([this.workflowsStore, ...taskHydrators]);
  }

  get selectedOfficers() {
    return this.searchStore.selectedSearchables;
  }
}
