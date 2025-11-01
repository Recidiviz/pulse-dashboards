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
const BASE_EMBED_URL = "https://www.google.com/maps/embed/v1/directions";
const BASE_DIRECTIONS_URL = "https://www.google.com/maps/dir/";

type MapDirectionsRequestProps = {
  userEmail: string;
  emailSubject: string;
  emailBody: string;
};

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
    // Assemble addresses for all selected officers
    const addresses = this.workflowsStore.searchStore.selectedSearchables.map(
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
    const formattedAddresses = addresses
      .filter((address) => !!address)
      .map(
        (address) =>
          `${address.line1}${address.line2 ? " " + address.line2 : ""}, ${address.city}, TX ${address.zip}`,
      );

    if (formattedAddresses.length === 0) {
      return "";
    } else {
      // Pick the first address as the placeholder
      return formatTexasAddress(formattedAddresses[0]);
    }
  }
  /**
   * Return the center in meters of the circular region to limit address predictions toward
   */
  get locationBias(): { lat: number; lng: number } | undefined {
    // The center of a circle encompassing all of Texas
    return { lat: 31.3003, lng: -99.5935 };
  }

  /**
   * Return the radius in meters of the circular region to limit address predictions toward
   */
  get radius(): number | undefined {
    // The radius of a circle encompassing all of Texas
    return 679100;
  }

  // Emailing the user with the URL of the map route

  /**
   * Return a URL that can be opened in a browser to show the current route, using
   * the Google Maps Directions URLs API
   */
  get mapDirectionsUrl(): string {
    const { selectedAddresses } = this.clientsPresenter;
    const waypoints =
      selectedAddresses.length === 0
        ? {}
        : {
            waypoints: selectedAddresses.join("|"),
          };

    const queryParams = {
      api: 1,
      travelmode: "driving",
      origin: this.startingAddress,
      destination: this.startingAddress,
      ...waypoints,
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
   * Return a URL of a route from the Google Maps Embed API in "directions" mode
   */
  get mapIframeUrl(): string {
    const { selectedAddresses } = this.clientsPresenter;
    const waypoints =
      selectedAddresses.length === 0
        ? {}
        : {
            waypoints: selectedAddresses.join("|"),
          };

    const queryParams = {
      key: this.mapsApiKey,
      mode: "driving",
      origin: this.startingAddress,
      destination: this.startingAddress,
      ...waypoints,
    };

    const formattedQueryParams = Object.entries(queryParams)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

    return `${BASE_EMBED_URL}?${formattedQueryParams}`;
  }
}
