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

import { PLACES_API_BASE_URL } from "~@idaho-th/trpc/routes/places/constants";

import { getPlacesConfig, resetPlacesConfigForTesting } from "../config";

const API_KEY = "test-places-key";

beforeEach(() => {
  resetPlacesConfigForTesting();
  vi.stubEnv("IDAHO_TH_GOOGLE_PLACES_API_KEY", API_KEY);
});

afterEach(() => {
  resetPlacesConfigForTesting();
});

describe("getPlacesConfig", () => {
  it("falls back to the Google Places host and the documented defaults", () => {
    expect(getPlacesConfig()).toMatchObject({
      apiKey: API_KEY,
      baseUrl: PLACES_API_BASE_URL,
      regionCode: "US",
      languageCode: "en",
    });
  });

  it("honours each optional override", () => {
    vi.stubEnv("IDAHO_TH_GOOGLE_PLACES_BASE_URL", "http://localhost:9999");
    vi.stubEnv("IDAHO_TH_GOOGLE_PLACES_REGION_CODE", "CA");
    vi.stubEnv("IDAHO_TH_GOOGLE_PLACES_LANGUAGE_CODE", "fr");
    vi.stubEnv("IDAHO_TH_GOOGLE_PLACES_TIMEOUT_MS", "1234");

    expect(getPlacesConfig()).toMatchObject({
      baseUrl: "http://localhost:9999",
      regionCode: "CA",
      languageCode: "fr",
      timeoutMs: 1234,
    });
  });

  it("ignores a non-numeric timeout override", () => {
    vi.stubEnv("IDAHO_TH_GOOGLE_PLACES_TIMEOUT_MS", "soon");

    expect(getPlacesConfig().timeoutMs).toBeGreaterThan(0);
  });

  it("caches the resolved config", () => {
    const first = getPlacesConfig();

    vi.stubEnv("IDAHO_TH_GOOGLE_PLACES_REGION_CODE", "CA");

    expect(getPlacesConfig()).toBe(first);
  });

  it("fails clearly when the API key is missing, rather than calling out unkeyed", () => {
    resetPlacesConfigForTesting();
    vi.stubEnv("IDAHO_TH_GOOGLE_PLACES_API_KEY", "");

    expect(() => getPlacesConfig()).toThrow(/Google Places/);
  });
});
