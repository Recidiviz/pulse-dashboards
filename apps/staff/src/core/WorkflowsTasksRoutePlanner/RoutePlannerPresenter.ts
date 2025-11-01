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

import { formatTexasAddress } from "../../utils";
import { WorkflowsStore } from "../../WorkflowsStore";
import { RoutePlannerClientsPresenter } from "./RoutePlannerClientsPresenter";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const BASE_EMBED_URL = "https://www.google.com/maps/embed/v1/directions";

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
