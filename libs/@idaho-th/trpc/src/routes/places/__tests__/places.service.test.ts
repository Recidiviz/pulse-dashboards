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

import { TRPCError } from "@trpc/server";

import {
  PlacesNotFoundError,
  PlacesRateLimitError,
  PlacesRequestError,
  PlacesResponseError,
  PlacesTimeoutError,
} from "~@idaho-th/trpc/routes/places/places.errors";
import type {
  IPlacesClient,
  PlacesProcedureMeta,
} from "~@idaho-th/trpc/routes/places/places.types";

const loggerMocks = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/routes/common/logger", () => ({
  getLogger: () => loggerMocks,
}));

const { resetPlaceDetailsCacheForTesting } = await import(
  "~@idaho-th/trpc/routes/places/places.cache"
);
const { resetPlacesConfigForTesting } = await import(
  "~@idaho-th/trpc/routes/places/config"
);
const { autocompleteAddressesService, getPlaceDetailsService } = await import(
  "~@idaho-th/trpc/routes/places/places.service"
);

const QUERY_TEXT = "123 Main St, Boise";
const PLACE_ID = "place-abc";
const SESSION_TOKEN = "11111111-1111-4111-8111-111111111111";

const META: PlacesProcedureMeta = {
  traceId: "trace-1",
  procedureName: "places.autocompleteAddresses",
  staffPseudonymizedId: "staff-1",
};

const RAW_AUTOCOMPLETE = {
  suggestions: [
    {
      placePrediction: {
        placeId: PLACE_ID,
        text: { text: "123 Main St, Boise, ID, USA" },
        structuredFormat: {
          mainText: { text: "123 Main St" },
          secondaryText: { text: "Boise, ID, USA" },
        },
      },
    },
  ],
};

const RAW_DETAILS = {
  id: PLACE_ID,
  formattedAddress: "123 Main St, Boise, ID 83702, USA",
  addressComponents: [
    { types: ["route"], longText: "Main St", shortText: "Main St" },
    { types: ["street_number"], longText: "123", shortText: "123" },
    { types: ["locality"], longText: "Boise", shortText: "Boise" },
    {
      types: ["administrative_area_level_1"],
      longText: "Idaho",
      shortText: "ID",
    },
    { types: ["postal_code"], longText: "83702", shortText: "83702" },
  ],
  location: { latitude: 43.6, longitude: -116.2 },
};

function buildClient(overrides: Partial<IPlacesClient> = {}): IPlacesClient {
  return {
    autocomplete: vi.fn().mockResolvedValue(RAW_AUTOCOMPLETE),
    placeDetails: vi.fn().mockResolvedValue(RAW_DETAILS),
    ...overrides,
  };
}

beforeEach(() => {
  resetPlaceDetailsCacheForTesting();
  resetPlacesConfigForTesting();
  vi.stubEnv("IDAHO_TH_GOOGLE_PLACES_API_KEY", "test-places-key");
});

describe("autocompleteAddressesService", () => {
  it("maps the transport response into predictions", async () => {
    const client = buildClient();

    await expect(
      autocompleteAddressesService(
        { input: QUERY_TEXT, sessionToken: SESSION_TOKEN },
        META,
        client,
      ),
    ).resolves.toEqual({
      predictions: [
        {
          placeId: PLACE_ID,
          description: "123 Main St, Boise, ID, USA",
          primaryText: "123 Main St",
          secondaryText: "Boise, ID, USA",
        },
      ],
    });

    expect(client.autocomplete).toHaveBeenCalledWith({
      input: QUERY_TEXT,
      sessionToken: SESSION_TOKEN,
    });
  });

  it("logs the prediction count and never the typed address", async () => {
    await autocompleteAddressesService(
      { input: QUERY_TEXT },
      META,
      buildClient(),
    );

    expect(loggerMocks.info).toHaveBeenCalledWith(
      "Resolved address autocomplete predictions",
      {
        traceId: META.traceId,
        procedureName: META.procedureName,
        staffPseudonymizedId: META.staffPseudonymizedId,
        predictionCount: 1,
        hasSessionToken: false,
      },
    );
    expect(JSON.stringify(loggerMocks.info.mock.calls)).not.toContain(
      QUERY_TEXT,
    );
  });
});

describe("getPlaceDetailsService", () => {
  it("maps the transport response into structured details", async () => {
    const client = buildClient();

    await expect(
      getPlaceDetailsService({ placeId: PLACE_ID }, META, client),
    ).resolves.toMatchObject({
      placeId: PLACE_ID,
      formattedAddress: RAW_DETAILS.formattedAddress,
      address: expect.objectContaining({ city: "Boise", state: "ID" }),
      location: { latitude: 43.6, longitude: -116.2 },
    });
  });

  it("serves a second lookup from the cache without a second request", async () => {
    const client = buildClient();

    await getPlaceDetailsService({ placeId: PLACE_ID }, META, client);
    await getPlaceDetailsService({ placeId: PLACE_ID }, META, client);

    expect(client.placeDetails).toHaveBeenCalledTimes(1);
    expect(
      loggerMocks.info.mock.calls.map(([, meta]) => meta?.cacheHit),
    ).toEqual([false, true]);
  });

  it("keys the cache per place id", async () => {
    const client = buildClient();

    await getPlaceDetailsService({ placeId: PLACE_ID }, META, client);
    await getPlaceDetailsService({ placeId: "place-other" }, META, client);

    expect(client.placeDetails).toHaveBeenCalledTimes(2);
  });

  it("never logs the resolved address text", async () => {
    await getPlaceDetailsService({ placeId: PLACE_ID }, META, buildClient());

    expect(JSON.stringify(loggerMocks.info.mock.calls)).not.toContain(
      "123 Main St",
    );
  });
});

describe("error mapping", () => {
  const cases: [
    label: string,
    thrown: unknown,
    code: string,
    message: string,
  ][] = [
    ["a not-found", new PlacesNotFoundError(), "NOT_FOUND", "Place not found"],
    [
      "a rate limit",
      new PlacesRateLimitError(),
      "TOO_MANY_REQUESTS",
      "Address lookup is temporarily rate limited",
    ],
    [
      "a timeout",
      new PlacesTimeoutError(),
      "TIMEOUT",
      "Address autocomplete timed out",
    ],
    [
      "a 400",
      new PlacesRequestError("bad request", 400),
      "BAD_REQUEST",
      "Invalid address lookup request",
    ],
    [
      "a 500",
      new PlacesRequestError("upstream 500", 500),
      "INTERNAL_SERVER_ERROR",
      "Address autocomplete failed",
    ],
    [
      "a malformed body",
      new PlacesResponseError("unparseable body"),
      "INTERNAL_SERVER_ERROR",
      "Address autocomplete failed",
    ],
    [
      "a non-Places error",
      new Error("socket hang up"),
      "INTERNAL_SERVER_ERROR",
      "Address autocomplete failed",
    ],
    [
      "a non-Error throw",
      "something broke",
      "INTERNAL_SERVER_ERROR",
      "Address autocomplete failed",
    ],
  ];

  it.each(cases)("maps %s to %s", async (_label, thrown, code, message) => {
    const client = buildClient({
      autocomplete: vi.fn().mockRejectedValue(thrown),
    });

    const error: unknown = await autocompleteAddressesService(
      { input: QUERY_TEXT },
      META,
      client,
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe(code);
    // Nothing from the upstream response reaches the client message.
    expect((error as TRPCError).message).toBe(message);
  });

  it("passes a TRPCError through untouched", async () => {
    const thrown = new TRPCError({ code: "FORBIDDEN", message: "nope" });
    const client = buildClient({
      autocomplete: vi.fn().mockRejectedValue(thrown),
    });

    await expect(
      autocompleteAddressesService({ input: QUERY_TEXT }, META, client),
    ).rejects.toBe(thrown);
  });

  it("names the failing operation in the details message", async () => {
    const client = buildClient({
      placeDetails: vi.fn().mockRejectedValue(new PlacesTimeoutError()),
    });

    await expect(
      getPlaceDetailsService({ placeId: PLACE_ID }, META, client),
    ).rejects.toMatchObject({
      code: "TIMEOUT",
      message: "Address details timed out",
    });
  });

  it("logs the failure with the trace context and no address text", async () => {
    const client = buildClient({
      autocomplete: vi
        .fn()
        .mockRejectedValue(new PlacesRequestError("upstream 500", 500)),
    });

    await autocompleteAddressesService(
      { input: QUERY_TEXT },
      META,
      client,
    ).catch(() => undefined);

    expect(loggerMocks.error).toHaveBeenCalledWith(
      "Google Places operation failed",
      expect.objectContaining({
        traceId: META.traceId,
        staffPseudonymizedId: META.staffPseudonymizedId,
        operation: "autocomplete",
        errorName: "PlacesRequestError",
        httpStatus: 500,
      }),
    );
    expect(JSON.stringify(loggerMocks.error.mock.calls)).not.toContain(
      QUERY_TEXT,
    );
  });
});
