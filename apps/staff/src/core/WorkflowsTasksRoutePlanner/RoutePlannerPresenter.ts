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

import { WorkflowsStore } from "../../WorkflowsStore";
import { RoutePlannerClientsPresenter } from "./RoutePlannerClientsPresenter";

/**
 * Responsible for handling data for the Tasks Route Planner page.
 * The child clientsPresenter keeps track of the list of selected officers
 * and clients.
 */
export class RoutePlannerPresenter {
  public readonly clientsPresenter: RoutePlannerClientsPresenter;

  constructor(private readonly workflowsStore: WorkflowsStore) {
    this.clientsPresenter = new RoutePlannerClientsPresenter(workflowsStore);

    makeAutoObservable(this);
  }
}
