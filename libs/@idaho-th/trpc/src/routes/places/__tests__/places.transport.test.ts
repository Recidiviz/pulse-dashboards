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

import { fetch as undiciFetch } from "undici";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";

import type { PlacesConfig } from "../config";
import {
  PlacesNotFoundError,
  PlacesRateLimitError,
  PlacesRequestError,
  PlacesResponseError,
  PlacesTimeoutError,
} from "../places.errors";
import { fetchAutocomplete, fetchPlaceDetails } from "../places.transport";

vi.mock("undici", () => ({
  Agent: class {},
  fetch: vi.fn(),
}));

const mockFetch = undiciFetch as unknown as Mock;

const config: PlacesConfig = {
  apiKey: "test-key",
  baseUrl: "https://places.test/v1",
  regionCode: "US",
  languageCode: "en",
  timeoutMs: 10_000,
};

function makeResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status: status,
    statusText: `HTTP ${status}`,
    json: async () => body,
  };
}

describe("places transport retry", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries a transient 5xx then succeeds", async () => {
    mockFetch
      .mockResolvedValueOnce(
        makeResponse(503, { error: { status: "UNAVAILABLE" } }),
      )
      .mockResolvedValueOnce(makeResponse(200, { suggestions: [] }));

    const result = await fetchAutocomplete(config, { input: "123 Main" });

    expect(result).toEqual({ suggestions: [] });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("gives up after exhausting retries on persistent 5xx", async () => {
    mockFetch.mockResolvedValue(makeResponse(503, {}));

    await expect(
      fetchAutocomplete(config, { input: "123 Main" }),
    ).rejects.toBeInstanceOf(PlacesRequestError);

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("does not retry a 400", async () => {
    mockFetch.mockResolvedValue(
      makeResponse(400, { error: { status: "INVALID_ARGUMENT" } }),
    );

    await expect(
      fetchAutocomplete(config, { input: "" }),
    ).rejects.toBeInstanceOf(PlacesRequestError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 429 rate limit", async () => {
    mockFetch.mockResolvedValue(
      makeResponse(429, { error: { status: "RESOURCE_EXHAUSTED" } }),
    );

    await expect(
      fetchAutocomplete(config, { input: "123 Main" }),
    ).rejects.toBeInstanceOf(PlacesRateLimitError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 404 from place details", async () => {
    mockFetch.mockResolvedValue(makeResponse(404, {}));

    await expect(
      fetchPlaceDetails(config, { placeId: "missing" }),
    ).rejects.toBeInstanceOf(PlacesNotFoundError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("sends regionCode, languageCode, and includedRegionCodes", async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { suggestions: [] }));

    await fetchAutocomplete(config, { input: "123 Main" });

    const [, requestInit] = mockFetch.mock.calls[0] as [
      URL,
      { method: string; body?: string },
    ];
    const body = JSON.parse(requestInit.body ?? "{}") as Record<
      string,
      unknown
    >;

    expect(requestInit.method).toBe("POST");
    expect(body).toMatchObject({
      input: "123 Main",
      regionCode: "US",
      languageCode: "en",
      includedRegionCodes: ["US"],
      includedPrimaryTypes: ["street_address", "premise", "subpremise"],
    });
    expect(body).not.toHaveProperty("locationRestriction");
  });
});

describe("places transport failure shapes", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [
      "an AbortError",
      Object.assign(new Error("aborted"), { name: "AbortError" }),
    ],
    [
      "a TimeoutError",
      Object.assign(new Error("timed out"), { name: "TimeoutError" }),
    ],
    [
      "an undici headers timeout",
      Object.assign(new Error("headers"), { code: "UND_ERR_HEADERS_TIMEOUT" }),
    ],
    [
      "an undici body timeout",
      Object.assign(new Error("body"), { code: "UND_ERR_BODY_TIMEOUT" }),
    ],
    [
      "an undici connect timeout",
      Object.assign(new Error("connect"), { code: "UND_ERR_CONNECT_TIMEOUT" }),
    ],
  ])("surfaces %s as a timeout", async (_label, thrown) => {
    mockFetch.mockRejectedValue(thrown);

    // Timeouts must always read as TIMEOUT, never as a generic failure.
    await expect(
      fetchAutocomplete(config, { input: "123 Main" }),
    ).rejects.toBeInstanceOf(PlacesTimeoutError);
  });

  it.each([
    ["a plain network error", new Error("ECONNRESET")],
    [
      "an unrelated code",
      Object.assign(new Error("dns"), { code: "ENOTFOUND" }),
    ],
    ["a non-Error throw", "socket closed"],
  ])("wraps %s as a response error", async (_label, thrown) => {
    mockFetch.mockRejectedValue(thrown);

    await expect(
      fetchAutocomplete(config, { input: "123 Main" }),
    ).rejects.toBeInstanceOf(PlacesResponseError);
  });

  it("wraps an unparseable success body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    });

    await expect(
      fetchAutocomplete(config, { input: "123 Main" }),
    ).rejects.toThrow("Failed to parse Google Places response");
  });

  it.each([
    [
      "the error status",
      { error: { status: "INVALID_ARGUMENT", message: "bad" } },
      "INVALID_ARGUMENT",
    ],
    ["the error message", { error: { message: "bad input" } }, "bad input"],
    ["the status text", {}, "HTTP 400"],
  ])("reports %s in the request error", async (_label, body, expected) => {
    mockFetch.mockResolvedValue(makeResponse(400, body));

    await expect(
      fetchAutocomplete(config, { input: "123 Main" }),
    ).rejects.toThrow(expected);
  });

  it("falls back to the status text when the error body is unparseable", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "HTTP 400",
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    });

    await expect(
      fetchAutocomplete(config, { input: "123 Main" }),
    ).rejects.toThrow("HTTP 400");
  });

  it("retries a timeout and then succeeds", async () => {
    mockFetch
      .mockRejectedValueOnce(
        Object.assign(new Error("aborted"), { name: "AbortError" }),
      )
      .mockResolvedValueOnce(makeResponse(200, { suggestions: [] }));

    await expect(
      fetchAutocomplete(config, { input: "123 Main" }),
    ).resolves.toEqual({ suggestions: [] });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry an unparseable body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    });

    await expect(
      fetchAutocomplete(config, { input: "123 Main" }),
    ).rejects.toBeInstanceOf(PlacesResponseError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("places transport request shape", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(makeResponse(200, {}));
  });

  it("sends the API key and content type on every request", async () => {
    await fetchAutocomplete(config, { input: "123 Main" });

    const [, requestInit] = mockFetch.mock.calls[0] as [
      URL,
      { headers: Record<string, string> },
    ];
    expect(requestInit.headers).toMatchObject({
      "X-Goog-Api-Key": config.apiKey,
      "Content-Type": "application/json",
    });
  });

  it("includes the autocomplete session token only when supplied", async () => {
    await fetchAutocomplete(config, { input: "123 Main" });
    await fetchAutocomplete(config, {
      input: "123 Main",
      sessionToken: "session-1",
    });

    const bodies = mockFetch.mock.calls.map(
      ([, init]) =>
        JSON.parse((init as { body: string }).body) as Record<string, unknown>,
    );
    expect(bodies[0]).not.toHaveProperty("sessionToken");
    expect(bodies[1]).toMatchObject({ sessionToken: "session-1" });
  });

  it("sends place details as a GET with a field mask", async () => {
    await fetchPlaceDetails(config, { placeId: "place-abc" });

    const [url, requestInit] = mockFetch.mock.calls[0] as [
      URL,
      { method: string; headers: Record<string, string>; body?: string },
    ];
    expect(requestInit.method).toBe("GET");
    expect(requestInit.body).toBeUndefined();
    expect(requestInit.headers["X-Goog-FieldMask"]).toBeTruthy();
    expect(url.pathname).toContain("place-abc");
    expect(url.searchParams.get("languageCode")).toBe(config.languageCode);
    expect(url.searchParams.get("regionCode")).toBe(config.regionCode);
    expect(url.searchParams.get("sessionToken")).toBeNull();
  });

  it("includes the details session token only when supplied", async () => {
    await fetchPlaceDetails(config, {
      placeId: "place-abc",
      sessionToken: "session-1",
    });

    const [url] = mockFetch.mock.calls[0] as [URL];
    expect(url.searchParams.get("sessionToken")).toBe("session-1");
  });

  it("percent-encodes a place id so it cannot alter the path", async () => {
    await fetchPlaceDetails(config, { placeId: "../../admin?x=1" });

    const [url] = mockFetch.mock.calls[0] as [URL];
    expect(url.pathname).toContain("..%2F..%2Fadmin%3Fx%3D1");
    expect(url.searchParams.get("x")).toBeNull();
  });
});
