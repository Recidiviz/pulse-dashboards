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
import { mapValues } from "lodash";
import { makeAutoObservable, reaction } from "mobx";

import { GeocodingStatus } from "../../../FirestoreStore/types";
import { Client } from "../../../WorkflowsStore/Client";
import {
  SupervisionTask,
  SupervisionTaskType,
} from "../../../WorkflowsStore/Task/types";
import { WorkflowsStore } from "../../../WorkflowsStore/WorkflowsStore";

export default class RoutePlannerClientStore {
  showAddMoreClientWindow = false;

  // this is for individuals selected in Route Planner Client Card
  private _selectedPeople: Client[] = [];
  // this is for all people added formally in the Add More Client side Panel
  private _addMorePeopleList: Client[] = [];

  // this is for everyone selected in both locations
  private _allPeople: Client[] = [];

  private OMS: string | undefined;

  constructor(protected readonly workflowsStore: WorkflowsStore) {
    makeAutoObservable(this);
    this.OMS = this.getOMSSystem(workflowsStore.rootStore.currentTenantId);

    reaction(
      () => this.workflowsStore.searchStore.selectedSearchIds,
      (newIds, oldIds) => {
        // only run if search IDs could have been removed
        if (newIds.length <= oldIds.length) {
          this._allPeople = this._allPeople.filter(
            (person) =>
              person.assignedStaffId && newIds.includes(person.assignedStaffId),
          );
          this._addMorePeopleList = this._addMorePeopleList.filter(
            (person) =>
              person.assignedStaffId && newIds.includes(person.assignedStaffId),
          );
        }
      },
    );
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
    this._allPeople.push(person);
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

  indexOfPerson(person: Client) {
    return this._allPeople.findIndex(
      (p: Client) => p.pseudonymizedId === person.pseudonymizedId,
    );
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

  // this removes people when clicked from the main screen
  removeAddedMorePeople(person: Client) {
    this.spliceIndexOf(person, this._addMorePeopleList);
    this.removeFromAllPeople(person as Client);
  }

  spliceIndexOf(person: Client, people: Client[]) {
    const i = people.findIndex(
      (p) => p.pseudonymizedId === person.pseudonymizedId,
    );
    if (i === -1) {
      throw new Error(
        `Trying to remove person ${person.pseudonymizedId} who isn't in list of selected people`,
      );
    } else {
      people.splice(i, 1);
    }
  }

  hasBadAddress(person: Client): boolean {
    const { validatedAddressUpdate } = person as Client;
    return Boolean(
      validatedAddressUpdate &&
        validatedAddressUpdate.result.status === GeocodingStatus.BadResult,
    );
  }

  getBadAddressCopy() {
    return `We couldn't find any results for this address. Please check for typos and correct the address in ${this.OMS}. Updates in ${this.OMS} will be reflected in 1-2 business days.`;
  }

  getOMSSystem(stateCode: string | undefined): string | undefined {
    switch (stateCode) {
      case "US_ID":
        return "Atlas";
      case "US_TX":
        return "OIMS";
      default:
        return;
    }
  }

  /**
   * @returns Record mapping selected caseload IDs to a list of home contact tasks
   * for each caseload.
   */
  get contacts(): Record<string, SupervisionTask<SupervisionTaskType>[][]> {
    return mapValues(
      this.workflowsStore.searchStore.caseloadPersonsGrouped,
      (persons) =>
        persons
          .map((person) => {
            if (person.supervisionTasks) {
              return person.supervisionTasks.readyOrderedTasks.filter(
                (task) => task.includeInRoutePlanner,
              );
            }
            return [];
          })
          .filter((x: any) => x.length !== 0),
    );
  }

  // ----------------------------------------
  // ADDED PEOPLE - SIDE PANEL

  get addMorePeople(): Client[] {
    return this._addMorePeopleList;
  }
}
