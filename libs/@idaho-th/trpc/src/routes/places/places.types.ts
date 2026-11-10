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

export type PlacesProcedureMeta = {
  traceId: string;
  procedureName: string;
  staffPseudonymizedId: string;
};

export type AddressPrediction = {
  placeId: string;
  description: string;
  primaryText: string;
  secondaryText: string;
};

export type AutocompleteResult = {
  predictions: AddressPrediction[];
};

export type StructuredAddress = {
  street: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export type GeoLocation = {
  latitude: number;
  longitude: number;
};

export type PlaceDetails = {
  placeId: string;
  formattedAddress: string | null;
  address: StructuredAddress;
  location: GeoLocation | null;
};

export type AutocompleteParams = {
  input: string;
  sessionToken?: string;
};

export type PlaceDetailsParams = {
  placeId: string;
  sessionToken?: string;
};

export interface IPlacesClient {
  autocomplete(params: AutocompleteParams): Promise<RawAutocompleteResponse>;
  placeDetails(params: PlaceDetailsParams): Promise<RawPlaceDetailsResponse>;
}

export type RawLocalizedText = {
  text?: string;
};

export type RawPlacePrediction = {
  placeId?: string;
  text?: RawLocalizedText;
  structuredFormat?: {
    mainText?: RawLocalizedText;
    secondaryText?: RawLocalizedText;
  };
};

export type RawAutocompleteSuggestion = {
  placePrediction?: RawPlacePrediction;
};

export type RawAutocompleteResponse = {
  suggestions?: RawAutocompleteSuggestion[];
};

export type RawAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

export type RawPlaceDetailsResponse = {
  id?: string;
  formattedAddress?: string;
  addressComponents?: RawAddressComponent[];
  location?: {
    latitude?: number;
    longitude?: number;
  };
};
