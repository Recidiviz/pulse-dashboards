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

import { PLACES_ADDRESS_COMPONENT_TYPES } from "~@idaho-th/trpc/routes/places/constants";
import { PlacesResponseError } from "~@idaho-th/trpc/routes/places/places.errors";
import type {
  AddressPrediction,
  GeoLocation,
  PlaceDetails,
  RawAddressComponent,
  RawAutocompleteResponse,
  RawPlaceDetailsResponse,
  StructuredAddress,
} from "~@idaho-th/trpc/routes/places/places.types";

export function mapAutocompleteResponse(
  raw: RawAutocompleteResponse,
): AddressPrediction[] {
  const suggestions = raw.suggestions ?? [];

  return suggestions.flatMap((suggestion): AddressPrediction[] => {
    const prediction = suggestion.placePrediction;
    const placeId = prediction?.placeId;
    if (!prediction || !placeId) return [];

    return [
      {
        placeId,
        description: prediction.text?.text ?? "",
        primaryText: prediction.structuredFormat?.mainText?.text ?? "",
        secondaryText: prediction.structuredFormat?.secondaryText?.text ?? "",
      },
    ];
  });
}

function findComponent(
  components: RawAddressComponent[],
  type: string,
): RawAddressComponent | undefined {
  return components.find((component) => component.types?.includes(type));
}

function longText(
  components: RawAddressComponent[],
  type: string,
): string | null {
  return findComponent(components, type)?.longText ?? null;
}

function shortText(
  components: RawAddressComponent[],
  type: string,
): string | null {
  const component = findComponent(components, type);
  return component?.shortText ?? component?.longText ?? null;
}

function buildStreet(components: RawAddressComponent[]): string | null {
  const { streetNumber, route } = PLACES_ADDRESS_COMPONENT_TYPES;
  const number = longText(components, streetNumber);
  const street = longText(components, route);
  const parts = [number, street].filter((part): part is string => !!part);
  return parts.length > 0 ? parts.join(" ") : null;
}

export function extractStructuredAddress(
  components: RawAddressComponent[],
): StructuredAddress {
  const { locality, postalTown, county, state, postalCode, country } =
    PLACES_ADDRESS_COMPONENT_TYPES;

  return {
    street: buildStreet(components),
    city: longText(components, locality) ?? longText(components, postalTown),
    county: longText(components, county),
    state: shortText(components, state),
    postalCode: longText(components, postalCode),
    country: shortText(components, country),
  };
}

function extractLocation(raw: RawPlaceDetailsResponse): GeoLocation | null {
  const { latitude, longitude } = raw.location ?? {};
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }
  return { latitude, longitude };
}

export function mapPlaceDetailsResponse(
  raw: RawPlaceDetailsResponse,
): PlaceDetails {
  if (!raw.id) {
    throw new PlacesResponseError(
      "Google Places details response missing place id",
    );
  }

  return {
    placeId: raw.id,
    formattedAddress: raw.formattedAddress ?? null,
    address: extractStructuredAddress(raw.addressComponents ?? []),
    location: extractLocation(raw),
  };
}
