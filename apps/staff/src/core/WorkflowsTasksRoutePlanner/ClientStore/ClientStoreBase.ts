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
import { makeAutoObservable, reaction, runInAction } from "mobx";
import toast from "react-hot-toast";

import {
  GeocodingResponse,
  GeocodingStatus,
} from "../../../FirestoreStore/types";
import AnalyticsStore, {
  RoutePlannerClientEvent,
  RoutePlannerRouteEvent,
} from "../../../RootStore/AnalyticsStore/AnalyticsStore";
import { Client } from "../../../WorkflowsStore/Client";
import {
  SupervisionTask,
  SupervisionTaskType,
} from "../../../WorkflowsStore/Task/types";
import { WorkflowsStore } from "../../../WorkflowsStore/WorkflowsStore";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const BASE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const TOAST_DURATION = 7000;
export default class RoutePlannerClientStore {
  // this is for all people added formally in the Add More Client side Panel
  private _addMorePeopleList: Client[] = [];
  // this is for everyone selected in both locations
  private _allPeople: Client[] = [];

  private OMS: string | undefined;

  // Map from pseudonymized IDs of clients to formatted place ID strings that can be used as
  // a waypoint (address) in a Google Maps embed.
  private placeIds: Record<string, string> = {};

  // Prevent trying to add multiple people while we're waiting to see if some person can be added
  isAddingPerson = false;
  // Prevent trying to optimize while an optimization is in progress
  isOptimizing = false;

  showAddMoreClientWindow = false;

  private readonly analyticsStore: AnalyticsStore;
  constructor(protected readonly workflowsStore: WorkflowsStore) {
    makeAutoObservable(this);
    this.analyticsStore = workflowsStore.rootStore.analyticsStore;
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

  // Window functions

  updateShowWindow() {
    this.showAddMoreClientWindow = !this.showAddMoreClientWindow;
  }

  //  functions on all people

  get allPeople() {
    return this._allPeople;
  }

  addSelectedPerson(person: Client) {
    this._allPeople.push(person);
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

  /** this removes people when clicked from the main screen */
  removeAddedMorePeople(person: Client) {
    this.spliceIndexOf(person, this._addMorePeopleList);
    this.removeFromAllPeople(person);
  }

  /** functions on add more people */
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

  get addMorePeople(): Client[] {
    return this._addMorePeopleList;
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
    const { validatedAddressUpdate } = person;
    return Boolean(
      validatedAddressUpdate &&
        validatedAddressUpdate.result.status === GeocodingStatus.BadResult,
    );
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
   * due for each person for each caseload.
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

  getBadAddressCopy() {
    return `We couldn't find any results for this address. Please check for typos and correct the address in ${this.OMS}. Updates in ${this.OMS} will be reflected in 1-2 business days.`;
  }

  getNoAddressFoundCopy() {
    return `No address on file in ${this.OMS}`;
  }

  // Ordered list of place IDs used for generating Google Maps links
  get selectedPlaceIds(): string[] {
    return this.allPeople.map(
      (person) => this.placeIds[person.pseudonymizedId],
    );
  }

  get selectedClientPseudoIds(): string[] {
    return this.allPeople.map((client) => client.pseudonymizedId);
  }

  /**
   * Send a request to the Google Maps Geocoding API for the provided address.
   * This API returns a Google Maps Place ID that refers to the address.
   *
   * The API response format is documented here: https://developers.google.com/maps/documentation/geocoding/requests-geocoding
   *
   * @returns The result of the geocoding request as a GeocodingResponse
   */
  async sendGeocodingRequest(address: string): Promise<GeocodingResponse> {
    const params = new URLSearchParams({
      key: API_KEY,
      address: address,
    });
    const response = await fetch(`${BASE_GEOCODING_URL}?${params}`);
    const body = await response.json();

    if (!response.ok || !["OK", "ZERO_RESULTS"].includes(body["status"])) {
      // The request failed
      return {
        status: GeocodingStatus.Error,
      };
    }

    // The request succeeded, and we got one result that refers to a street address
    if (
      body["status"] === "OK" &&
      body["results"].length === 1 &&
      body["results"][0]["address_components"].some(
        ({ types }: { types: string[] }) => types.includes("street_number"),
      )
    ) {
      return {
        status: GeocodingStatus.Success,
        placeId: body["results"][0]["place_id"],
      };
    }

    // The request succeeded, but we got multiple/0 results or a result that wasn't a street address
    return {
      status: GeocodingStatus.BadResult,
    };
  }

  /**
   * Attempt to geocode the provided address and write the results to Firestore
   * for the provided person.
   * @returns The result of the geocoding request as a GeocodingResponse
   */
  async geocode(person: Client, address: string): Promise<GeocodingResponse> {
    this.analyticsStore.trackRoutePlannerClientEvent(
      RoutePlannerClientEvent.AddressGeocoded,
      { pseudonymizedId: person.pseudonymizedId },
    );

    const result = await this.sendGeocodingRequest(address);
    await person.updateAddressUpdates({
      address,
      result,
    });
    return result;
  }

  /**
   * Adds a person to the list of addresses, geocoding their address if necessary.
   */
  async addPerson(person: Client, list?: Client[]) {
    if (this.isAddingPerson) return;
    if (!person.formattedAddress) {
      captureException(
        new Error(
          `Trying to add person ${person.pseudonymizedId} without valid address`,
        ),
      );
      return;
    }

    // If we have a place ID for this person in our local record, we definitely don't need
    // to make a new geocoding API request, so don't even check.
    if (Object.keys(this.placeIds).includes(person.pseudonymizedId)) {
      if (!list) {
        this.addSelectedPerson(person);
        return;
      } else {
        list.push(person);
      }
      return;
    }

    this.isAddingPerson = true;

    // If the person has a valid address update, we can use its results.
    // If they don't (i.e. no update stored in Firestore, or it isn't valid,
    // or the status was Error (which might be a transient Google Maps platform error)),
    // we should make another geocoding API request.
    const { validatedAddressUpdate } = person;
    let result: GeocodingResponse;
    if (
      validatedAddressUpdate &&
      validatedAddressUpdate.result.status !== GeocodingStatus.Error
    ) {
      result = validatedAddressUpdate.result;
    } else {
      result = await this.geocode(person, person.formattedAddress);
    }

    if (result.status === GeocodingStatus.Success) {
      runInAction(() => {
        this.placeIds[person.pseudonymizedId] = result.placeId;
        if (!list) this.addSelectedPerson(person);
        else {
          list.push(person);
        }
        this.isAddingPerson = false;
        this.analyticsStore.trackRoutePlannerClientSelected({
          pseudonymizedId: person.pseudonymizedId,
          selectedCount: this.selectedClientPseudoIds.length,
        });
      });
    } else {
      toast(this.getBadAddressCopy(), {
        duration: TOAST_DURATION,
        id: `${person.pseudonymizedId}-address-no-results`, // prevent duplicate toasts
      });
      this.isAddingPerson = false;
      this.analyticsStore.trackRoutePlannerClientEvent(
        RoutePlannerClientEvent.AddressGeocodingFailure,
        {
          pseudonymizedId: person.pseudonymizedId,
        },
      );
    }
  }

  get canOptimizeRoute(): boolean {
    return this.allPeople.length >= 2 && this.allPeople.length <= 25;
  }

  async optimizeRoute(startingAddress: string, endingAddress?: string) {
    if (this.isOptimizing || !this.canOptimizeRoute) return;

    this.isOptimizing = true;

    try {
      const waypoints = this.allPeople.map((person) => ({
        pseudonymizedId: person.pseudonymizedId,
        placeId: this.placeIds[person.pseudonymizedId],
        formattedAddress: (person as Client).formattedAddress,
      }));

      const apiStore = this.workflowsStore.rootStore.apiStore;
      const result = await apiStore.optimizeRoute({
        origin: startingAddress,
        destination: endingAddress,
        waypoints,
      });

      runInAction(() => {
        this._allPeople = result.optimizedOrder
          .map((id) => this.allPeople.find((p) => p.pseudonymizedId === id))
          .filter((person): person is Client => person !== undefined);
        this.isOptimizing = false;
      });

      if (result.isChanged) {
        toast("Route optimized! New order may reduce travel time.", {
          duration: 5000,
        });
      } else {
        toast("Route is already optimal!", {
          duration: 5000,
        });
      }

      this.analyticsStore.trackRoutePlannerRouteEvent(
        RoutePlannerRouteEvent.RouteOptimizationAttempted,
        {
          hasStartingAddress: !!startingAddress,
          hasEndingAddress: !!endingAddress,
          waypointCount: this.selectedClientPseudoIds.length,
          orderChanged: result.isChanged,
        },
      );
    } catch (e) {
      runInAction(() => {
        this.isOptimizing = false;
      });
      toast.error("Unable to optimize route. Please try again.");
      captureException(e);
    }
  }

  // Tracking
  trackRoutePlannerClientEvent(
    eventType: RoutePlannerClientEvent,
    client: Client,
  ) {
    this.analyticsStore.trackRoutePlannerClientEvent(eventType, {
      pseudonymizedId: client.pseudonymizedId,
    });
  }
}
