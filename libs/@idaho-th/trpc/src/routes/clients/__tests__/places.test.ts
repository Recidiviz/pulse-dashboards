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

import type { PlacesConfig } from "~@idaho-th/trpc/routes/places/config";

const transportMocks = vi.hoisted(() => ({
  fetchAutocomplete: vi.fn(),
  fetchPlaceDetails: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/routes/places/places.transport", () => ({
  ...transportMocks,
}));

const { getPlacesClient, PlacesClient, resetPlacesClientForTesting } =
  await import("~@idaho-th/trpc/routes/clients/places");
const { resetPlacesConfigForTesting } = await import(
  "~@idaho-th/trpc/routes/places/config"
);

const CONFIG = {
  apiKey: "test-places-key",
  baseUrl: "https://places.example.com",
  regionCode: "US",
  languageCode: "en",
  timeoutMs: 5_000,
} satisfies PlacesConfig;

beforeEach(() => {
  resetPlacesClientForTesting();
  resetPlacesConfigForTesting();
  vi.stubEnv("IDAHO_TH_GOOGLE_PLACES_API_KEY", CONFIG.apiKey);
  transportMocks.fetchAutocomplete.mockResolvedValue({ suggestions: [] });
  transportMocks.fetchPlaceDetails.mockResolvedValue({ id: "place-abc" });
});

afterEach(() => {
  resetPlacesClientForTesting();
  resetPlacesConfigForTesting();
});

describe("PlacesClient", () => {
  it("forwards autocomplete params alongside its own config", async () => {
    const client = new PlacesClient(CONFIG);

    await expect(
      client.autocomplete({ input: "123 Main St" }),
    ).resolves.toEqual({ suggestions: [] });
    expect(transportMocks.fetchAutocomplete).toHaveBeenCalledWith(CONFIG, {
      input: "123 Main St",
    });
  });

  it("forwards place-details params alongside its own config", async () => {
    const client = new PlacesClient(CONFIG);

    await expect(
      client.placeDetails({ placeId: "place-abc" }),
    ).resolves.toEqual({ id: "place-abc" });
    expect(transportMocks.fetchPlaceDetails).toHaveBeenCalledWith(CONFIG, {
      placeId: "place-abc",
    });
  });
});

describe("getPlacesClient", () => {
  it("builds the client once and reuses it", () => {
    expect(getPlacesClient()).toBe(getPlacesClient());
  });

  it("builds a fresh client after a reset", () => {
    const first = getPlacesClient();
    resetPlacesClientForTesting();

    expect(getPlacesClient()).not.toBe(first);
  });

  it("resolves its config from the environment", async () => {
    await getPlacesClient().autocomplete({ input: "123 Main St" });

    expect(transportMocks.fetchAutocomplete.mock.calls[0]?.[0]).toMatchObject({
      apiKey: CONFIG.apiKey,
    });
  });
});
