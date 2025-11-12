// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { UpdateLog } from "./metadata";

export type PersonUpdateType = "preferredName" | "preferredContactMethod";
export const contactMethods = ["Call", "Text", "Email", "None"];
export type ContactMethodType = (typeof contactMethods)[number];
export type PortionServedDates = {
  heading: string;
  date: Date | undefined;
}[];

/**
 * Person-level data generated within this application
 */
export type PersonUpdateRecord = {
  preferredName?: string;
  preferredContactMethod?: ContactMethodType;

  // Information related to Google Maps Geocoding API results for a client's address
  addressUpdate?: ClientAddressUpdate;
};

export enum GeocodingStatus {
  // The request succeeded and gave a result referring to a valid street address
  Success = "SUCCESS",
  // The request succeeded but returned multiple results, zero results, or a result
  // referring to a non-street address
  BadResult = "BAD_RESULT",
  // The request resulted in an error
  Error = "ERROR",
}

export type GeocodingResponse =
  | {
      status: GeocodingStatus.BadResult | GeocodingStatus.Error;
      placeId?: never;
    }
  | {
      status: GeocodingStatus.Success;
      placeId: string;
    };

export type ClientAddressInfo = {
  address: string; // The address we sent to Google Maps Geocoding API
  result: GeocodingResponse; // The response from Google Maps Geocoding API
};

export type ClientAddressUpdate = {
  updated: UpdateLog;
} & ClientAddressInfo;
