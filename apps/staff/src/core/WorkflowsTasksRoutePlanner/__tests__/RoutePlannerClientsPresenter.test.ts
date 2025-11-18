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

import { Mock } from "vitest";

import { GeocodingStatus } from "../../../FirestoreStore";
import { Client, WorkflowsStore } from "../../../WorkflowsStore";
import { RoutePlannerClientsPresenter } from "../RoutePlannerClientsPresenter";

const mockWorkflowsStore = {
  searchStore: {
    selectedSearchIds: [],
  },
} as any as WorkflowsStore;
let presenter: RoutePlannerClientsPresenter;

const clients = [
  { pseudonymizedId: "test123", formattedAddress: "test123" },
  { pseudonymizedId: "test456", formattedAddress: "test456" },
  { pseudonymizedId: "test789", formattedAddress: "test789" },
] as Client[];

const fakePlaceId = "test123id";

describe("Selected client methods with locally stored addresses", () => {
  beforeEach(() => {
    presenter = new RoutePlannerClientsPresenter(mockWorkflowsStore);
    for (const client of clients) {
      // @ts-expect-error accessing private property for test
      presenter.placeIds[client.pseudonymizedId] = client.formattedAddress;
    }
  });

  it("Reports clients are selected after they are added", async () => {
    await presenter.addPerson(clients[0]);
    await presenter.addPerson(clients[1]);

    expect(presenter.isPersonSelected(clients[0])).toBeTrue();
    expect(presenter.indexOfPerson(clients[0])).toEqual(0);
    expect(presenter.isPersonSelected(clients[1])).toBeTrue();
    expect(presenter.indexOfPerson(clients[1])).toEqual(1);
  });

  it("No longer reports clients are selected after they are removed", async () => {
    await presenter.addPerson(clients[0]);
    expect(presenter.isPersonSelected(clients[0])).toBeTrue();
    expect(presenter.indexOfPerson(clients[0])).toEqual(0);

    presenter.removePerson(clients[0]);
    expect(presenter.isPersonSelected(clients[0])).toBeFalse();
    expect(presenter.indexOfPerson(clients[0])).toEqual(-1);
  });

  it("Changes sequence of clients when removed out of order", async () => {
    await presenter.addPerson(clients[0]);
    await presenter.addPerson(clients[1]);
    await presenter.addPerson(clients[2]);
    presenter.removePerson(clients[0]);

    expect(presenter.isPersonSelected(clients[0])).toBeFalse();
    expect(presenter.indexOfPerson(clients[0])).toEqual(-1);

    expect(presenter.isPersonSelected(clients[1])).toBeTrue();
    expect(presenter.indexOfPerson(clients[1])).toEqual(0);

    expect(presenter.isPersonSelected(clients[2])).toBeTrue();
    expect(presenter.indexOfPerson(clients[2])).toEqual(1);
  });
});

describe("Gets address info from addressUpdate when not locally stored", () => {
  beforeEach(() => {
    presenter = new RoutePlannerClientsPresenter(mockWorkflowsStore);
  });

  it("Adds client with SUCCESS geocoding result from Firestore", async () => {
    const client = {
      ...clients[0],
      validatedAddressUpdate: {
        result: {
          status: GeocodingStatus.Success,
          placeId: fakePlaceId,
        },
      },
    } as Client;

    expect(presenter.selectedPlaceIds).toBeEmpty();

    await presenter.addPerson(client);
    expect(presenter.isPersonSelected(client)).toBeTrue();
    expect(presenter.indexOfPerson(client)).toEqual(0);
    expect(presenter.selectedPlaceIds).toEqual([fakePlaceId]);
  });

  it("Does not add client with BAD_RESULT geocoding result from Firestore", async () => {
    const client = {
      ...clients[0],
      validatedAddressUpdate: {
        result: {
          status: GeocodingStatus.BadResult,
        },
      },
    } as Client;

    expect(presenter.hasBadAddress(client)).toBeTrue();

    await presenter.addPerson(client);
    expect(presenter.isPersonSelected(client)).toBeFalse();
    expect(presenter.selectedPlaceIds).toBeEmpty();
  });
});

describe("Geocodes addresses when not in Firestore", () => {
  beforeEach(() => {
    presenter = new RoutePlannerClientsPresenter(mockWorkflowsStore);
  });

  it("Adds client with SUCCESS geocoding result from API", async () => {
    vi.spyOn(presenter, "geocode").mockResolvedValue({
      placeId: fakePlaceId,
      status: GeocodingStatus.Success,
    });
    await presenter.addPerson(clients[0]);

    expect(presenter.isPersonSelected(clients[0])).toBeTrue();
    expect(presenter.indexOfPerson(clients[0])).toEqual(0);
  });

  it("Does not add client with ERROR geocoding result from API", async () => {
    vi.spyOn(presenter, "geocode").mockResolvedValue({
      status: GeocodingStatus.Error,
    });
    await presenter.addPerson(clients[0]);
    expect(presenter.isPersonSelected(clients[0])).toBeFalse();
  });

  it("Does not add client with BAD_RESULT geocoding result from API", async () => {
    vi.spyOn(presenter, "geocode").mockResolvedValue({
      status: GeocodingStatus.BadResult,
    });
    await presenter.addPerson(clients[0]);
    expect(presenter.isPersonSelected(clients[0])).toBeFalse();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
});

describe("sendGeocodingRequest response parsing", () => {
  presenter = new RoutePlannerClientsPresenter(mockWorkflowsStore);
  const fakeAddress = "123 Main St";
  const mockResponseResult = {
    address_components: [
      {
        long_name: "123",
        short_name: "123",
        types: ["street_number"],
      },
      {
        long_name: "Main Street",
        short_name: "Main St",
        types: ["route"],
      },
      {
        long_name: "Texas",
        short_name: "TX",
        types: ["administrative_area_level_1", "political"],
      },
      {
        long_name: "United States",
        short_name: "US",
        types: ["country", "political"],
      },
      { long_name: "12345", short_name: "12345", types: ["postal_code"] },
    ],
    formatted_address: "123 Main St",
    partial_match: false,
    place_id: fakePlaceId,
    types: ["street_address", "subpremise"],
  };

  test("SUCCESS when response gives a street address", async () => {
    const mockResponse = {
      status: "OK",
      results: [mockResponseResult],
    };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    ) as Mock;

    expect(await presenter.sendGeocodingRequest(fakeAddress)).toEqual({
      placeId: fakePlaceId,
      status: GeocodingStatus.Success,
    });
  });

  test("ERROR when non-ok request status", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      }),
    ) as Mock;

    expect(await presenter.sendGeocodingRequest(fakeAddress)).toEqual({
      status: GeocodingStatus.Error,
    });
  });

  test("ERROR when request status is UNKNOWN_ERROR", async () => {
    const mockResponse = {
      status: "UNKNOWN_ERROR",
    };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    ) as Mock;

    expect(await presenter.sendGeocodingRequest(fakeAddress)).toEqual({
      status: GeocodingStatus.Error,
    });
  });

  test("BAD_RESULT when multiple addresses in response", async () => {
    const mockResponse = {
      status: "OK",
      results: [
        mockResponseResult,
        { ...mockResponseResult, partial_match: true, place_id: "other123" },
      ],
    };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    ) as Mock;

    expect(await presenter.sendGeocodingRequest(fakeAddress)).toEqual({
      status: GeocodingStatus.BadResult,
    });
  });

  test("BAD_RESULT when zero results in response", async () => {
    const mockResponse = { status: "ZERO_RESULTS", results: [] };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    ) as Mock;

    expect(await presenter.sendGeocodingRequest(fakeAddress)).toEqual({
      status: GeocodingStatus.BadResult,
    });
  });

  test("BAD_RESULT when response is an area, not a street address", async () => {
    const mockResponse = {
      status: "OK",
      results: [
        {
          ...mockResponseResult,
          address_components: mockResponseResult.address_components.slice(1),
          types: ["locality", "political"],
          partial_match: true,
        },
      ],
    };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    ) as Mock;

    expect(await presenter.sendGeocodingRequest(fakeAddress)).toEqual({
      status: GeocodingStatus.BadResult,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
});
