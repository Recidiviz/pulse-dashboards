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

import dedent from "dedent";
import { makeAutoObservable } from "mobx";

import { formatTexasAddress, formatWorkflowsDate } from "../../utils";
import { WorkflowsStore } from "../../WorkflowsStore";
import { Officer } from "../../WorkflowsStore/Officer";
import { RoutePlannerClientsPresenter } from "./RoutePlannerClientsPresenter";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
// The Google Maps Embed API is documented here: https://developers.google.com/maps/documentation/embed/embedding-map
const BASE_EMBED_URL_NO_POINTS = "https://www.google.com/maps/embed/v1/view";
const BASE_EMBED_URL = "https://www.google.com/maps/embed/v1/directions";

// The Google Maps directions URLs API is documented here: https://developers.google.com/maps/documentation/urls/get-started
const BASE_DIRECTIONS_URL = "https://www.google.com/maps/dir/";

type MapDirectionsRequestProps = {
  userEmail: string;
  emailSubject: string;
  emailBody: string;
};

function formatTexasDpoAddress(address: {
  line1: string;
  line2?: string | undefined;
  city: string;
  zip: string;
}): string {
  return formatTexasAddress(
    `${address.line1}${address.line2 ? " " + address.line2 : ""}, ${address.city}, TX ${address.zip}`,
  );
}

/**
 * Responsible for handling map-related data for the Tasks Route Planner page.
 * The child clientsPresenter keeps track of the list of selected officers
 * and clients.
 */
export class RoutePlannerPresenter {
  public readonly clientsPresenter: RoutePlannerClientsPresenter;
  userPickedStartingAddress: string | undefined = undefined;

  constructor(private readonly workflowsStore: WorkflowsStore) {
    this.clientsPresenter = new RoutePlannerClientsPresenter(workflowsStore);

    makeAutoObservable(this);
  }

  get mapsApiKey(): string {
    return API_KEY;
  }

  // Starting address picker and autocomplete settings

  get startingAddress() {
    return this.userPickedStartingAddress ?? this.startingAddressPlaceholder;
  }

  get startingAddressPlaceholder(): string {
    const { selectedClients } = this.clientsPresenter;
    let addresses;
    if (selectedClients.length > 0) {
      // If we have any selected people, get potential starting addresses from
      // the officers of the selected people.
      addresses = selectedClients
        .map((client) => client.assignedStaff)
        .map((officer) => {
          if (officer?.recordType !== "supervisionStaff") {
            return;
          }
          return officer?.stateSpecificData?.dpoAddress;
        });
    } else {
      // Otherwise, get addresses for all searched-for officers
      addresses = this.workflowsStore.searchStore.selectedSearchables.map(
        (searchable) => {
          if (
            !(searchable instanceof Officer) ||
            searchable.record.recordType !== "supervisionStaff"
          ) {
            return;
          }
          return searchable.record?.stateSpecificData?.dpoAddress;
        },
      );
    }

    // Pick the first valid address from the list
    const formattedAddresses = addresses
      .filter((address) => !!address)
      .map((address) => formatTexasDpoAddress(address));

    if (formattedAddresses.length !== 0) {
      return formattedAddresses[0];
    }
    return "";
  }
  /**
   * Return the center in meters of the circular region to limit address predictions toward
   */
  get locationBias(): { lat: number; lng: number } {
    // The center of a circle encompassing all of Texas
    return { lat: 31.2, lng: -99.9 };
  }

  /**
   * Return the radius in meters of the circular region to limit address predictions toward
   */
  get radius(): number | undefined {
    // The radius of a circle encompassing all of Texas
    return 660000;
  }

  /**
   * Return the zoom level to use for the map. This can range from 0 to 21.
   * https://developers.google.com/maps/documentation/embed/embedding-map#view_mode
   */
  get zoomLevel(): number {
    return 6;
  }

  // Emailing the user with the URL of the map route

  /**
   * Return a URL that can be opened in a browser to show the current route in Google Maps.
   * The URL is structured using the Google Maps URLs API in "directions" mode.
   */
  get mapDirectionsUrl(): string {
    const { selectedFormattedAddresses, selectedPlaceIds } =
      this.clientsPresenter;

    const formattedWaypoints = selectedFormattedAddresses
      .slice(0, -1)
      .join("|");
    const formattedWaypointPlaceIds = selectedPlaceIds.slice(0, -1).join("|");

    const queryParams = {
      api: 1,
      travelmode: "driving",
      origin: this.startingAddress,
      destination:
        selectedFormattedAddresses[selectedFormattedAddresses.length - 1],
      destination_place_id: selectedPlaceIds[selectedPlaceIds.length - 1],
      // There are only intermediate waypoints when there are 2 or more selected addresses.
      // Giving an empty parameter for waypoints leads to an error.
      ...(selectedFormattedAddresses.length >= 2
        ? {
            waypoints: formattedWaypoints,
            waypoint_place_ids: formattedWaypointPlaceIds,
          }
        : {}),
    };

    const formattedQueryParams = Object.entries(queryParams)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

    return `${BASE_DIRECTIONS_URL}?${formattedQueryParams}`;
  }

  /**
   * Return an HTML-formatted email containing the directions the user has selected,
   * or undefined if no valid email request body can be created.
   */
  get mapDirectionsBody(): MapDirectionsRequestProps | undefined {
    if (!this.userEmailAddress) return;

    const today = formatWorkflowsDate(new Date());
    const emailBody = dedent`
      <p>Hi,</p>
      <p>Here is the Google Maps link, generated on ${today}, that you requested from the Recidiviz Home Contact Route Planner: <a href="${this.mapDirectionsUrl}">${this.mapDirectionsUrl}</a></p>
      <p>Best,<br/>The Recidiviz Team</p>
      <br />
      <i>If you believe you’ve received this email in error or this email contains incorrect information, please email feedback@recidiviz.org to let us know.</i>
    `;
    return {
      userEmail: this.userEmailAddress,
      emailSubject: `Recidiviz Route Planner - Maps Link (${today})`,
      emailBody: emailBody,
    };
  }

  /**
   * Return the currently-logged-in user's email address
   */
  get userEmailAddress(): string | undefined {
    const { userStore } = this.workflowsStore.rootStore;
    if (userStore.isImpersonating) return;
    return this.workflowsStore.rootStore.userStore.userEmail;
  }

  async sendDirectionsEmail() {
    const requestBody = this.mapDirectionsBody;
    if (!requestBody) {
      return;
    }
    return this.workflowsStore.rootStore.apiStore.client.post(
      `${import.meta.env.VITE_NEW_BACKEND_API_URL}/workflows/external_request/US_TX/email_user`,
      requestBody,
    );
  }

  // Embedding the map itself

  /**
   * Return a URL that can be used as the source of an iframe to show a route
   * in Google Maps. The URL is structured using the Google Maps Embed API in "directions" mode
   */
  get mapIframeUrl(): string {
    const { selectedPlaceIds } = this.clientsPresenter;

    if (selectedPlaceIds.length === 0) {
      const queryParams = new URLSearchParams({
        key: this.mapsApiKey,
        center: `${this.locationBias.lat},${this.locationBias.lng}`,
        zoom: String(this.zoomLevel),
      }).toString();
      return `${BASE_EMBED_URL_NO_POINTS}?${queryParams}`;
    }

    const formattedAddresses = selectedPlaceIds.map(
      (placeId) => `place_id:${placeId}`,
    );
    const formattedWaypoints = formattedAddresses.slice(0, -1).join("|");
    const queryParams = new URLSearchParams({
      key: this.mapsApiKey,
      mode: "driving",
      origin: this.startingAddress,
      destination: formattedAddresses[formattedAddresses.length - 1],
      // There are only intermediate waypoints when there are 2 or more selected addresses.
      // Giving an empty parameter for waypoints leads to an error.
      ...(formattedAddresses.length >= 2
        ? {
            waypoints: formattedWaypoints,
          }
        : {}),
    }).toString();

    return `${BASE_EMBED_URL}?${queryParams}`;
  }

  // Controls related to the mobile map view
  isMapView = false;

  /**
   * Returns whether a button to switch to the map view of the tool should be displayed
   */
  get showMobileMapViewButton() {
    return (
      this.clientsPresenter.selectedClients.length > 0 ||
      this.clientsPresenter.isAddingPerson
    );
  }

  /**
   * Returns copy for a button to switch to the map view of the tool
   */
  get mapViewButtonCopy() {
    return this.clientsPresenter.isAddingPerson
      ? `Loading map...`
      : `See map view (${this.clientsPresenter.selectedClients.length} selected)`;
  }
}
