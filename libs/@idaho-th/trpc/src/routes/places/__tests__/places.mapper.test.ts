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

import { describe, expect, it } from "vitest";

import { PlacesResponseError } from "../places.errors";
import {
  mapAutocompleteResponse,
  mapPlaceDetailsResponse,
} from "../places.mapper";
import type {
  RawAutocompleteResponse,
  RawPlaceDetailsResponse,
} from "../places.types";

describe("mapAutocompleteResponse", () => {
  it("maps suggestions to predictions", () => {
    const raw: RawAutocompleteResponse = {
      suggestions: [
        {
          placePrediction: {
            placeId: "place-1",
            text: { text: "123 Main St, Boise, ID, USA" },
            structuredFormat: {
              mainText: { text: "123 Main St" },
              secondaryText: { text: "Boise, ID, USA" },
            },
          },
        },
      ],
    };

    expect(mapAutocompleteResponse(raw)).toEqual([
      {
        placeId: "place-1",
        description: "123 Main St, Boise, ID, USA",
        primaryText: "123 Main St",
        secondaryText: "Boise, ID, USA",
      },
    ]);
  });

  it("drops suggestions missing a placeId and tolerates empty input", () => {
    const raw: RawAutocompleteResponse = {
      suggestions: [
        { placePrediction: { text: { text: "no id" } } },
        { placePrediction: { placeId: "place-2" } },
        {},
      ],
    };

    const result = mapAutocompleteResponse(raw);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      placeId: "place-2",
      description: "",
      primaryText: "",
      secondaryText: "",
    });
    expect(mapAutocompleteResponse({})).toEqual([]);
  });
});

describe("mapPlaceDetailsResponse", () => {
  it("composes the street and extracts short codes for state/country", () => {
    const raw: RawPlaceDetailsResponse = {
      id: "place-1",
      formattedAddress: "123 Main St, Boise, ID 83702, USA",
      addressComponents: [
        { longText: "123", shortText: "123", types: ["street_number"] },
        { longText: "Main Street", shortText: "Main St", types: ["route"] },
        { longText: "Boise", types: ["locality"] },
        { longText: "Ada County", types: ["administrative_area_level_2"] },
        {
          longText: "Idaho",
          shortText: "ID",
          types: ["administrative_area_level_1"],
        },
        { longText: "83702", types: ["postal_code"] },
        { longText: "United States", shortText: "US", types: ["country"] },
      ],
      location: { latitude: 43.6, longitude: -116.2 },
    };

    expect(mapPlaceDetailsResponse(raw)).toEqual({
      placeId: "place-1",
      formattedAddress: "123 Main St, Boise, ID 83702, USA",
      address: {
        street: "123 Main Street",
        city: "Boise",
        county: "Ada County",
        state: "ID",
        postalCode: "83702",
        country: "US",
      },
      location: { latitude: 43.6, longitude: -116.2 },
    });
  });

  it("falls back to postal_town for city and nulls missing pieces", () => {
    const raw: RawPlaceDetailsResponse = {
      id: "place-2",
      addressComponents: [
        { longText: "Main Street", shortText: "Main St", types: ["route"] },
        { longText: "Springfield", types: ["postal_town"] },
      ],
    };

    expect(mapPlaceDetailsResponse(raw)).toEqual({
      placeId: "place-2",
      formattedAddress: null,
      address: {
        street: "Main Street",
        city: "Springfield",
        county: null,
        state: null,
        postalCode: null,
        country: null,
      },
      location: null,
    });
  });

  it("throws when the place id is missing", () => {
    expect(() => mapPlaceDetailsResponse({})).toThrow(PlacesResponseError);
  });
});
