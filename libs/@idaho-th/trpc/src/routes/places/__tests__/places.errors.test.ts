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
  formatPlacesErrorForLog,
  isRetryablePlacesError,
  placesErrorForStatus,
  PlacesNotFoundError,
  PlacesRateLimitError,
  PlacesRequestError,
  PlacesResponseError,
  PlacesTimeoutError,
} from "../places.errors";

/** The text a staff member typed — it must never reach a log payload. */
const QUERY_TEXT = "123 Main St, Boise";

describe("placesErrorForStatus", () => {
  it("maps 404 to a not-found error", () => {
    const error = placesErrorForStatus(404, QUERY_TEXT);

    expect(error).toBeInstanceOf(PlacesNotFoundError);
    expect(error.message).toBe("Place not found");
  });

  it("maps 429 to a rate-limit error", () => {
    const error = placesErrorForStatus(429, QUERY_TEXT);

    expect(error).toBeInstanceOf(PlacesRateLimitError);
    expect(error.message).toBe("Google Places rate limit exceeded");
  });

  it.each([400, 401, 403, 418, 500, 502, 503])(
    "maps %i to a request error carrying the status",
    (httpStatus) => {
      const error = placesErrorForStatus(httpStatus, "upstream said no");

      expect(error).toBeInstanceOf(PlacesRequestError);
      expect((error as PlacesRequestError).httpStatus).toBe(httpStatus);
      expect(error.message).toBe("upstream said no");
    },
  );

  it("keeps the caller's query text out of the 404 and 429 messages", () => {
    for (const status of [404, 429]) {
      expect(placesErrorForStatus(status, QUERY_TEXT).message).not.toContain(
        QUERY_TEXT,
      );
    }
  });
});

describe("isRetryablePlacesError", () => {
  it.each([
    ["a timeout", new PlacesTimeoutError(), true],
    ["a 500", new PlacesRequestError("boom", 500), true],
    ["a 503", new PlacesRequestError("boom", 503), true],
    ["a 400", new PlacesRequestError("boom", 400), false],
    ["a 429", new PlacesRateLimitError(), false],
    ["a not-found", new PlacesNotFoundError(), false],
    ["a response error", new PlacesResponseError("bad body"), false],
    ["a plain Error", new Error("boom"), false],
    ["a non-Error", "boom", false],
    ["undefined", undefined, false],
  ])("treats %s as retryable=%s", (_label, error, expected) => {
    expect(isRetryablePlacesError(error)).toBe(expected);
  });
});

describe("formatPlacesErrorForLog", () => {
  it("includes the http status for a request error", () => {
    expect(
      formatPlacesErrorForLog(new PlacesRequestError("upstream 500", 500)),
    ).toEqual({
      errorName: "PlacesRequestError",
      errorMessage: "upstream 500",
      httpStatus: 500,
    });
  });

  it.each([
    ["a not-found", new PlacesNotFoundError(), "PlacesNotFoundError"],
    ["a rate limit", new PlacesRateLimitError(), "PlacesRateLimitError"],
    ["a timeout", new PlacesTimeoutError(), "PlacesTimeoutError"],
    [
      "a response error",
      new PlacesResponseError("bad body"),
      "PlacesResponseError",
    ],
  ])("names %s without a status field", (_label, error, errorName) => {
    const payload = formatPlacesErrorForLog(error);

    expect(payload).toMatchObject({ errorName });
    expect(payload).not.toHaveProperty("httpStatus");
  });

  it("stringifies a non-Error throw", () => {
    expect(formatPlacesErrorForLog({ code: 7 })).toEqual({
      errorReason: "[object Object]",
    });
    expect(formatPlacesErrorForLog(undefined)).toEqual({
      errorReason: "undefined",
    });
  });

  it("never carries the typed query text", () => {
    // Every error built from a user query keeps that query out of its message,
    // so the log payload cannot leak it either.
    for (const error of [
      placesErrorForStatus(404, QUERY_TEXT),
      placesErrorForStatus(429, QUERY_TEXT),
      new PlacesTimeoutError(),
      new PlacesNotFoundError(),
    ]) {
      expect(JSON.stringify(formatPlacesErrorForLog(error))).not.toContain(
        QUERY_TEXT,
      );
    }
  });
});
