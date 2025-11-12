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
import { makeAutoObservable, reaction, runInAction } from "mobx";
import toast from "react-hot-toast";

import {
  compositeHydrationState,
  Hydratable,
  HydrationState,
  isHydrated,
} from "~hydration-utils";

import { GeocodingResponse, GeocodingStatus } from "../../FirestoreStore";
import { PartialRecord } from "../../utils/typeUtils";
import {
  Client,
  JusticeInvolvedPerson,
  SupervisionTask,
  SupervisionTaskType,
  WorkflowsStore,
} from "../../WorkflowsStore";
import { SearchStore } from "../../WorkflowsStore/SearchStore";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const BASE_SEARCH_URL = "https://www.google.com/maps/search/";
const BASE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const TOAST_DURATION = 7000;

/**
 * Responsible for keeping track of selected clients and officers on the
 * Tasks Route Planner page.
 */
export class RoutePlannerClientsPresenter implements Hydratable {
  private readonly searchStore: SearchStore;
  private selectedPeople: JusticeInvolvedPerson[] = [];
  // Map from pseudonymized IDs of clients to formatted place ID strings that can be used as
  // a waypoint (address) in a Google Maps embed.
  private placeIds: Record<string, string> = {};

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

  // Methods relating to copy in the clients page

  badAddressCopy =
    "We couldn't find any results for this address. Please check for typos and correct the address in OIMS. Updates in OIMS will be reflected in 1-2 business days.";

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

  // Methods relating to geocoding and getting addresses

  /**
   * Attempt to geocode the provided address and write the results to Firestore
   * for the provided person.
   * @returns The result of the geocoding request as a GeocodingResponse
   */
  async geocode(person: Client, address: string): Promise<GeocodingResponse> {
    const result = await this.sendGeocodingRequest(address);
    await person.updateAddressUpdates({
      address,
      result,
    });
    return result;
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
   * Returns true if we know the given person's address is definitely "bad"
   * i.e. we have tried to geocode it and the result gave us an error.
   *
   * If this method returns false, the "badness" of the person's address is
   * uncertain: for example, they might not have an address, or we might not
   * have tried to geocode it before.
   */
  hasBadAddress(person: JusticeInvolvedPerson): boolean {
    const { validatedAddressUpdate } = person as Client;
    return Boolean(
      validatedAddressUpdate &&
        validatedAddressUpdate.result.status === GeocodingStatus.BadResult,
    );
  }

  // Public methods for handling the list of selected people

  get selectedAddresses(): string[] {
    return this.selectedPeople.map(
      (person) =>
        this.placeIds[person.pseudonymizedId] ??
        (person as Client).formattedAddress,
    );
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

  /**
   * Adds a person to the list of addresses, geocoding their address if necessary.
   */
  async addPerson(person: Client) {
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
      this.selectedPeople.push(person);
      return;
    }

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
        this.placeIds[person.pseudonymizedId] = `place_id:${result.placeId}`;
        this.selectedPeople.push(person);
      });
    } else {
      toast(this.badAddressCopy, {
        duration: TOAST_DURATION,
        id: `${person.pseudonymizedId}-address-no-results`, // prevent duplicate toasts
      });
    }
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
