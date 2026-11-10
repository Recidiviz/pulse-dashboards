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

import {
  getPlacesConfig,
  type PlacesConfig,
} from "~@idaho-th/trpc/routes/places/config";
import {
  fetchAutocomplete,
  fetchPlaceDetails,
} from "~@idaho-th/trpc/routes/places/places.transport";
import type {
  AutocompleteParams,
  IPlacesClient,
  PlaceDetailsParams,
  RawAutocompleteResponse,
  RawPlaceDetailsResponse,
} from "~@idaho-th/trpc/routes/places/places.types";

export {
  PlacesApiError,
  PlacesNotFoundError,
  PlacesRateLimitError,
  PlacesRequestError,
  PlacesResponseError,
  PlacesTimeoutError,
} from "~@idaho-th/trpc/routes/places/places.errors";

export class PlacesClient implements IPlacesClient {
  constructor(private readonly config: PlacesConfig) {}

  autocomplete(params: AutocompleteParams): Promise<RawAutocompleteResponse> {
    return fetchAutocomplete(this.config, params);
  }

  placeDetails(params: PlaceDetailsParams): Promise<RawPlaceDetailsResponse> {
    return fetchPlaceDetails(this.config, params);
  }
}

let singleton: PlacesClient | null = null;

export function getPlacesClient(): PlacesClient {
  if (!singleton) {
    singleton = new PlacesClient(getPlacesConfig());
  }
  return singleton;
}

export function resetPlacesClientForTesting(): void {
  singleton = null;
}
