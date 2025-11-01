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

  constructor(private readonly workflowsStore: WorkflowsStore) {
    this.clientsPresenter = new RoutePlannerClientsPresenter(workflowsStore);

    makeAutoObservable(this);
  }

  get mapsApiKey(): string {
    return API_KEY;
  }

  get startingAddress(): string {
    // TODO(#9405): Replace with the address of the logged-in user's DPO
    return formatTexasAddress(
      "5400 N.SAM HOUSTON PKWY EAST HOUSTON TX 770320000",
    );
  }

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
