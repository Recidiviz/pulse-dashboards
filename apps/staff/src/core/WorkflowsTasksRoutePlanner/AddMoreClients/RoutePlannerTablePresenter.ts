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

import { RootStore } from "../../../RootStore";
import { Client, JusticeInvolvedPerson } from "../../../WorkflowsStore";
import RoutePlannerClientStore from "./../ClientStore/ClientStoreBase";

export type TableColumnId =
  | "SELECTED"
  | "PERSON_NAME"
  | "PERSON_DISPLAY_ID"
  | "ASSIGNED_STAFF_NAME"
  | "CLIENT_SUPERVISION_TYPE"
  | "LEVEL"
  | "ADDRESS";

export class RoutePlannerTablePresenter {
  private readonly routePlannerClientStore: RoutePlannerClientStore;

  private _potentialPeople: Client[] = [];

  constructor(
    private readonly rootStore: RootStore,
    private readonly clientStore: RoutePlannerClientStore,
  ) {
    this.routePlannerClientStore = clientStore;

    this._potentialPeople = [...this.routePlannerClientStore.addMorePeople];

    makeAutoObservable(this, {}, { autoBind: true });
  }

  // BUTTONS
  onCancel() {
    this._potentialPeople = [];
    this.routePlannerClientStore.updateShowWindow();
  }

  onClickAdd() {
    this.routePlannerClientStore.setAddMorePeopleList(this._potentialPeople);
    this.routePlannerClientStore.updateShowWindow();
  }

  // CLIENT ADD IN SIDE PANEL

  get potentialPeople() {
    return this._potentialPeople;
  }

  isSelected(person: Client): boolean {
    return this.potentialPeople.some(
      (p) => p.pseudonymizedId === person.pseudonymizedId,
    );
  }

  updateSelected(person: Client) {
    if (this.isSelected(person)) {
      this.removeSelected(person);
    } else {
      this._potentialPeople.push(person);
    }
  }

  removeSelected(person: Client) {
    const i = this._potentialPeople.findIndex(
      (p) => p.pseudonymizedId === person.pseudonymizedId,
    );
    if (i === -1) {
      captureException(
        new Error(
          `Trying to remove person ${person.pseudonymizedId} who isn't in list of selected people`,
        ),
      );
    } else {
      this._potentialPeople.splice(i, 1);
    }
  }

  indexOfPerson(person: Client) {
    return this._potentialPeople.findIndex(
      (p: Client) => p.pseudonymizedId === person.pseudonymizedId,
    );
  }

  // CHECKBOX SUPPORTING FEATURES

  /**
   * This function calculates the place a client is selected in
   * the overarching list by calculating how many people are selected
   * in the Add More Modal and the Client Cards on the main page
   * and returns that value
   */
  getCardinal(person: Client): number {
    const addMore = this.routePlannerClientStore.addMorePeople.length;
    const existing = this.routePlannerClientStore.allPeople.length;

    return existing - addMore + this.indexOfPerson(person) + 1;
  }

  // GENERAL DISPLAY

  clientsInSelectedSearchesCount(): number {
    const { caseloadPersonsGrouped, selectedSearchables } =
      this.rootStore.workflowsStore.searchStore;

    let count = 0;
    selectedSearchables.forEach((searchable) => {
      if (!caseloadPersonsGrouped[searchable.searchId]) return;
      count += caseloadPersonsGrouped[searchable.searchId].filter(
        (person: JusticeInvolvedPerson) => person instanceof Client,
      ).length;
    });
    return count;
  }

  // GENERAL DISPLAY

  get people(): Client[] {
    return this.rootStore.workflowsStore.searchStore.caseloadPersons.filter(
      (person: JusticeInvolvedPerson) => person instanceof Client,
    );
  }

  get displayIdHeader(): string {
    return this.rootStore.tenantStore.getDisplayIdCopy(
      this.rootStore.workflowsStore.activeSystem,
    );
  }
}
