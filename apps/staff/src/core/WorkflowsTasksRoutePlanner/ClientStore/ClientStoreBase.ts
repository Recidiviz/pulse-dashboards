// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { makeAutoObservable } from "mobx";

import { Client } from "../../../WorkflowsStore/Client";
import { WorkflowsStore } from "../../../WorkflowsStore/WorkflowsStore";

export default class RoutePlannerClientStore {
  showAddMoreClientWindow = false;
  // this is for individuals selected in Route Planner Client Card
  private _selectedPeople: Client[] = [];
  // this is for all people added formally in the Add More Client side Panel
  private _addMorePeopleList: Client[] = [];

  // this is for everyone selected in both locations
  private _allPeople: Client[] = [];

  constructor(protected readonly workflowsStore: WorkflowsStore) {
    makeAutoObservable(this);
  }

  // WINDOW FUNCTIONS

  updateShowWindow() {
    this.showAddMoreClientWindow = !this.showAddMoreClientWindow;
  }

  // SELECTED PEOPLE - MAP ROUTE PLANNER

  get selectedPeople() {
    return this._selectedPeople;
  }

  addSelectedPeople(person: Client) {
    this._selectedPeople.push(person);
  }

  get allPeople() {
    return this._allPeople;
  }

  // this removes one client
  removeSelectedPeople(person: Client) {
    const i = this._selectedPeople.findIndex(
      (p) => p.pseudonymizedId === person.pseudonymizedId,
    );
    if (i !== -1) {
      this._selectedPeople.splice(i, 1);
    }
  }

  setAddMorePeopleList(finalizedSelections: Client[]) {
    const finalizedIds = new Set(
      finalizedSelections.map((p) => p.pseudonymizedId),
    );

    this._addMorePeopleList
      .filter((p) => !finalizedIds.has(p.pseudonymizedId))
      .forEach((p) => this.removeFromAllPeople(p));

    this._addMorePeopleList = [...finalizedSelections];
    this._allPeople = [
      ...new Set([...this._allPeople, ...finalizedSelections]),
    ];
  }

  removeFromAllPeople(person: Client) {
    const i = this._allPeople.findIndex(
      (p) => p.pseudonymizedId === person.pseudonymizedId,
    );
    if (i === -1) {
      captureException(
        new Error(
          `Trying to remove person ${person.pseudonymizedId} who isn't in list of selected people`,
        ),
      );
    } else {
      this._allPeople.splice(i, 1);
    }
  }

  // ----------------------------------------
  // ADDED PEOPLE - SIDE PANEL

  get addMorePeople(): Client[] {
    return this._addMorePeopleList;
  }
}
