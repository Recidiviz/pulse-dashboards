// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import { callMetricsApi, callNewMetricsApi } from "../metricsClient";

describe("metricsClient", () => {
  let output;
  const mockToken = "auth0-token";
  const endpoint =
    "newRevocations/revocations_matrix_events_by_month?violationType=All";

  const expectedUrl = `test-url/api/${endpoint}`;
  const expectedNewBEUrl = `test-be-url/${endpoint}`;

  const getTokenSilently = vi.fn();

  beforeEach(() => {
    // do not log the expected error - keep tests less verbose
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    getTokenSilently.mockResolvedValue(mockToken);

    fetchMock.mockResponse(
      JSON.stringify({
        data: [],
      }),
    );
  });

  describe("when callMetricsApi succeeds", () => {
    beforeEach(async () => {
      vi.stubEnv("VITE_API_URL", "test-url");
      output = await callMetricsApi(endpoint, getTokenSilently);
    });

    it("calls fetch with the correct url and headers", () => {
      expect(fetch).toHaveBeenCalledWith(expectedUrl, {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
    });

    it("returns the resolved data response", () => {
      expect(output).toEqual({ data: [] });
    });
  });

  describe("when callNewMetricsApi succeeds", () => {
    beforeEach(async () => {
      vi.stubEnv("VITE_NEW_BACKEND_API_URL", "test-be-url");
      output = await callNewMetricsApi(endpoint, getTokenSilently);
    });

    it("calls fetch with the correct url and headers", () => {
      expect(fetch).toHaveBeenCalledWith(expectedNewBEUrl, {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
    });

    it("returns the resolved data response", () => {
      expect(output).toEqual({ data: [] });
    });
  });

  describe("when callMetricsApi fails from old backend", () => {
    beforeEach(async () => {
      vi.stubEnv("VITE_API_URL", "test-url");
      fetchMock.mockResponse(JSON.stringify({ errors: ["API error"] }), {
        status: 400,
      });
    });

    it("retries 2 more times before throwing an error", async () => {
      expect.assertions(2);
      try {
        await callMetricsApi(endpoint, getTokenSilently);
      } catch (error) {
        expect(fetchMock.mock.calls.length).toEqual(3);
        expect(error).toEqual(
          new Error(
            `Fetching data from API failed.\nStatus: 400 - Bad Request\nErrors: ["API error"]`,
          ),
        );
      }
    });

    it("throws an error", async () => {
      expect.assertions(1);
      try {
        await callMetricsApi(endpoint, getTokenSilently);
      } catch (error) {
        expect(error).toEqual(
          new Error(
            `Fetching data from API failed.\nStatus: 400 - Bad Request\nErrors: ["API error"]`,
          ),
        );
      }
    });
  });

  describe("when callMetricsApi fails from new backend", () => {
    beforeEach(async () => {
      vi.stubEnv("VITE_API_URL", "test-url");
      fetchMock.mockResponse(JSON.stringify({ message: "API error" }), {
        status: 400,
      });
    });

    it("retries 2 more times before throwing an error", async () => {
      expect.assertions(2);
      try {
        await callMetricsApi(endpoint, getTokenSilently);
      } catch (error) {
        expect(fetchMock.mock.calls.length).toEqual(3);
        expect(error).toEqual(
          new Error(
            `Fetching data from API failed.\nStatus: 400 - Bad Request\nErrors: "API error"`,
          ),
        );
      }
    });

    it("throws an error", async () => {
      expect.assertions(1);
      try {
        await callMetricsApi(endpoint, getTokenSilently);
      } catch (error) {
        expect(error).toEqual(
          new Error(
            `Fetching data from API failed.\nStatus: 400 - Bad Request\nErrors: "API error"`,
          ),
        );
      }
    });
  });
});
