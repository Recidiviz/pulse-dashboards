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

export const PLACES_REQUIRED_ENV_KEYS = [
  "IDAHO_TH_GOOGLE_PLACES_API_KEY",
] as const;

export const PLACES_API_BASE_URL = "https://places.googleapis.com/v1";

export const PLACES_AUTOCOMPLETE_PATH = "/places:autocomplete";

export const PLACES_DETAILS_PATH = "/places";

export const PLACES_HTTP_TIMEOUT_MS = 10_000;

export const PLACES_MAX_CONNECTIONS = 50;
export const PLACES_KEEPALIVE_TIMEOUT_MS = 30_000;

export const PLACES_MAX_RETRY_ATTEMPTS = 2;
export const PLACES_RETRY_BASE_DELAY_MS = 200;

export const PLACE_DETAILS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const PLACE_DETAILS_CACHE_MAX_ENTRIES = 1000;

export const PLACES_RATE_LIMIT_WINDOW_MS = 60_000;
export const PLACES_RATE_LIMIT_MAX_REQUESTS = 120;

export const PLACES_DETAILS_FIELD_MASK = [
  "id",
  "formattedAddress",
  "addressComponents",
  "location",
].join(",");

export const PLACES_DEFAULT_REGION_CODE = "US";
export const PLACES_DEFAULT_LANGUAGE_CODE = "en";
export const PLACES_DEFAULT_INCLUDED_REGION_CODES = ["US"] as const;

export const PLACES_AUTOCOMPLETE_INCLUDED_PRIMARY_TYPES = [
  "street_address",
  "premise",
  "subpremise",
] as const;

export const PLACES_ADDRESS_COMPONENT_TYPES = {
  streetNumber: "street_number",
  route: "route",
  subpremise: "subpremise",
  locality: "locality",
  postalTown: "postal_town",
  county: "administrative_area_level_2",
  state: "administrative_area_level_1",
  postalCode: "postal_code",
  country: "country",
} as const;
