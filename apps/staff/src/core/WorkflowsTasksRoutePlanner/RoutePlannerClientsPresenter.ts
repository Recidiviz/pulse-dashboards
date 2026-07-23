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

import { RoutePlannerClientEvent } from "../../RootStore/AnalyticsStore/AnalyticsStore";
import { formatWorkflowsDateWithoutYear } from "../../utils";
import {
  Client,
  SupervisionTask,
  SupervisionTaskType,
  WorkflowsStore,
} from "../../WorkflowsStore";
import { SearchStore } from "../../WorkflowsStore/SearchStore";
import RoutePlannerClientStore from "./ClientStore/ClientStoreBase";

const BASE_SEARCH_URL = "https://www.google.com/maps/search/";

/**
 * Responsible for keeping track of selected clients and officers on the
 * Tasks Route Planner page.
 */
export class RoutePlannerClientsPresenter implements Hydratable {
  private readonly searchStore: SearchStore;

  private SHORT_SUPERVISION_LEVEL_COPY: Record<string, string> = {
    High: "H",
    Moderate: "M",
    "Low-Moderate": "L–M",
    Low: "L",
    Annual: "A",
    "In-custody": "I–C",
  };

  constructor(
    private readonly workflowsStore: WorkflowsStore,
    private readonly routePlannerClientStore: RoutePlannerClientStore,
  ) {
    this.routePlannerClientStore = routePlannerClientStore;
    this.searchStore = workflowsStore.searchStore;
    makeAutoObservable(this);
  }

  hydrate() {
    if (!isHydrated(this.workflowsStore)) this.workflowsStore.hydrate();

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

  get isOptimizing(): boolean {
    return this.routePlannerClientStore.isOptimizing;
  }

  get isAddingPerson(): boolean {
    return this.routePlannerClientStore.isAddingPerson;
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

  displayName(person: Client) {
    if (person.stateCode === "US_TX")
      return person.displayPreferredNameLastFirst;
    return person.displayPreferredName;
  }

  /**
   * @returns Record mapping selected caseload IDs to a list of home contact tasks
   * for each caseload.
   */
  get contacts(): Record<string, SupervisionTask<SupervisionTaskType>[][]> {
    return mapValues(this.searchStore.caseloadPersonsGrouped, (persons) =>
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

  async sendGeocodingRequest(address: string) {
    return await this.routePlannerClientStore.sendGeocodingRequest(address);
  }

  // route planner store functions

  removeAddedPerson(person: Client) {
    this.routePlannerClientStore.removeAddedMorePeople(person);
  }

  get getAddMorePeople(): Client[] {
    return this.routePlannerClientStore.addMorePeople;
  }

  indexOfAllPeople(person: Client) {
    return this.routePlannerClientStore.allPeople.findIndex(
      (p) => p.pseudonymizedId === person.pseudonymizedId,
    );
  }

  getBadAddressCopy() {
    return this.routePlannerClientStore.getBadAddressCopy();
  }

  getNoAddressFoundCopy() {
    return this.routePlannerClientStore.getNoAddressFoundCopy();
  }

  /**
   * @returns copy and information used in ClientCard for a specific task
   */
  getClientCardCopy(tasks: SupervisionTask[] | undefined, person: Client) {
    if (tasks) {
      const taskInfo = tasks.map((task) => {
        return {
          type: task.routePlannerDisplayName ?? "Other",
          // idaho does not have the ability to view
          // or schedule appointment dates presently
          ...(person.stateCode !== "US_ID" && {
            scheduledStatus: task.hasFutureScheduledContact
              ? `Scheduled for ${task.futureScheduledContacts?.map((date) => formatWorkflowsDateWithoutYear(date)).join(", ")}`
              : "To-Do",
            isScheduled: task.hasFutureScheduledContact,
          }),
        };
      });

      return {
        supervisionLevelShort:
          this.SHORT_SUPERVISION_LEVEL_COPY[person.supervisionLevel] ?? "Other",
        supervisionTooltip: person.supervisionLevel,
        tasksInfo: taskInfo,
      };
    }
    return {
      tasksInfo: undefined,
      supervisionLevelShort:
        this.SHORT_SUPERVISION_LEVEL_COPY[person.supervisionLevel] ?? "Other",
      supervisionTooltip: person.supervisionLevel,
    };
  }

  /**
   * Creates a Google Maps Search URL to the given address
   */
  mapsAddressLink(address: string) {
    const params = new URLSearchParams({
      api: "1",
      query: address,
    }).toString();
    return `${BASE_SEARCH_URL}?${params}`;
  }

  hasBadAddress(person: Client): boolean {
    return this.routePlannerClientStore.hasBadAddress(person);
  }

  // Public methods for handling the list of selected people

  // Ordered list of formatted addresses used for display and Google Maps links
  get selectedFormattedAddresses(): string[] {
    return this.routePlannerClientStore.allPeople.map(
      (person) => (person as Client).formattedAddress ?? "",
    );
  }

  // Ordered list of place IDs used for generating Google Maps links
  get selectedPlaceIds(): string[] {
    return this.routePlannerClientStore.selectedPlaceIds;
  }

  get selectedClients(): readonly Client[] {
    return this.routePlannerClientStore.allPeople;
  }

  get selectedClientPseudoIds(): string[] {
    return this.routePlannerClientStore.selectedClientPseudoIds;
  }

  get canOptimizeRoute(): boolean {
    return this.routePlannerClientStore.canOptimizeRoute;
  }

  isPersonSelected(person: Client) {
    return this.routePlannerClientStore.indexOfPerson(person) !== -1;
  }

  indexOfPerson(person: Client): number {
    return this.routePlannerClientStore.indexOfPerson(person);
  }

  /**
   * Adds a person to the list of addresses, geocoding their address if necessary.
   */
  async addPerson(person: Client) {
    await this.routePlannerClientStore.addPerson(person);
  }

  removePerson(person: Client) {
    this.routePlannerClientStore.removeFromAllPeople(person);
  }

  async optimizeRoute(startingAddress: string, endingAddress?: string) {
    await this.routePlannerClientStore.optimizeRoute(
      startingAddress,
      endingAddress,
    );
  }

  trackRoutePlannerClientEvent(
    eventType: RoutePlannerClientEvent,
    client: Client,
  ) {
    this.routePlannerClientStore.trackRoutePlannerClientEvent(
      eventType,
      client,
    );
  }
}
