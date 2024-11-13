// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { GoogleAuth } from "google-auth-library";

import { clearCache } from "../../core/cacheManager";
import { fetchAndFilterNewRevocationFile } from "../../core/fetchAndFilterNewRevocationFile";
import { fetchMetrics } from "../../core/fetchMetrics";
import {
  createSubsetFilters,
  createUserRestrictionsFilters,
  getNewRevocationsFiltersByMetricName,
} from "../../filters";
import { getCacheKey } from "../../utils/cacheKeys";
import {
  getImpersonatedUserRestrictions,
  newRevocationFile,
  newRevocations,
  refreshCache,
  responder,
  sanitizeUserHash,
} from "../api";

const mockMetricFiles = {
  file_1: "content_1",
  file_2: "content_2",
};

const mockSubsetFilters = {
  violation_type: [
    "absconded",
    "all",
    "elec_monitoring",
    "escaped",
    "high_tech",
    "low_tech",
    "med_tech",
    "municipal",
    "substance_abuse",
    "technical",
  ],
  charge_category: [
    "all",
    "domestic_violence",
    "general",
    "serious_mental_illness",
  ],
};

const mockUserRestrictionsFilters = {
  level_1_supervision_location: ["08n"],
};

vi.mock("../../core/fetchMetrics");

vi.mock("../../core/fetchAndFilterNewRevocationFile");

vi.mock("../../filters/filterHelpers");

vi.mock("../../utils/cacheKeys");

vi.mock("google-auth-library");

beforeEach(() => {
  // Reduce noise in the test
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);

  vi.mocked(fetchMetrics).mockResolvedValue(mockMetricFiles);
  vi.mocked(fetchAndFilterNewRevocationFile).mockResolvedValue(mockMetricFiles);
  vi.mocked(createSubsetFilters).mockReturnValue(mockSubsetFilters);
  vi.mocked(createUserRestrictionsFilters).mockReturnValue(
    mockUserRestrictionsFilters,
  );
  vi.mocked(getNewRevocationsFiltersByMetricName).mockReturnValue({
    ...mockSubsetFilters,
    ...mockUserRestrictionsFilters,
  });
  vi.mocked(GoogleAuth).mockImplementation(() => ({
    getIdTokenClient: vi.fn().mockImplementation(() => ({
      request: vi.fn().mockReturnValue({
        data: { restrictions: true },
      }),
    })),
  }));
});

describe("API GET tests", () => {
  const stateCode = "test_id";
  const metricType = "newRevocation";

  afterEach(() => {
    clearCache();
  });

  function fakeRequest(
    routeHandler,
    req = { params: { stateCode, metricType } },
  ) {
    return new Promise((resolve) => {
      const send = resolve;
      const status = vi.fn().mockImplementation(() => {
        return { send };
      });
      const set = vi.fn().mockImplementation(() => {
        return { send };
      });
      const res = { send, status, set };
      routeHandler(req, res);
    });
  }

  async function requestAndExpectFetchMetricsCalled(
    controllerFn,
    numCalls,
    request,
    mockFetch = fetchMetrics,
  ) {
    await fakeRequest(controllerFn, request);
    expect(mockFetch.mock.calls.length).toBe(numCalls);
    mockFetch.mockClear();
  }

  describe("API fetching and caching for GET requests", () => {
    const metricControllers = [[newRevocations]];

    // eslint-disable-next-line vitest/expect-expect
    test.each(metricControllers)(
      "%p fetches metrics only if data is not cached in store",
      async (controllerFn) => {
        await requestAndExpectFetchMetricsCalled(controllerFn, 1);
        await requestAndExpectFetchMetricsCalled(controllerFn, 0);

        clearCache();

        await requestAndExpectFetchMetricsCalled(controllerFn, 1);
        await requestAndExpectFetchMetricsCalled(controllerFn, 0);
      },
    );

    it("newRevocations - calls fetchMetrics with the correct args", async () => {
      await fakeRequest(newRevocations);
      expect(fetchMetrics).toHaveBeenCalledWith(
        stateCode,
        "newRevocation",
        null,
        false,
      );
    });

    it("refreshCache - calls fetchMetrics with the correct args", async () => {
      await fakeRequest(refreshCache);

      expect(fetchMetrics).toHaveBeenCalledWith(
        stateCode,
        "newRevocation",
        null,
        false,
      );
    });
  });

  describe("newRevocationFile endpoint", () => {
    const file = "file_1";
    const queryParams = { violationType: "ALL" };
    const appMetadata = {
      state_code: stateCode,
      allowed_supervision_location_ids: ["8N"],
      allowed_supervision_location_level: "level_1_supervision_location",
    };
    const request = {
      user: {
        [`${process.env.METADATA_NAMESPACE}app_metadata`]: appMetadata,
      },
      params: { stateCode, metricType, file },
      query: queryParams,
    };
    const expectedFilters = {
      ...mockSubsetFilters,
      ...mockUserRestrictionsFilters,
    };

    it("newRevocationFile - does not throw when there are no user restrictions", async () => {
      const requestWithoutRestrictions = {
        ...request,
        user: {
          [`${process.env.METADATA_NAMESPACE}app_metadata`]: {},
        },
      };

      expect(async () =>
        fakeRequest(newRevocationFile, requestWithoutRestrictions),
      ).not.toThrow();
    });

    it("newRevocationFile - calls createUserRestrictionsFilters with correct args", async () => {
      await fakeRequest(newRevocationFile, request);
      expect(createUserRestrictionsFilters).toHaveBeenCalledWith(appMetadata);
    });

    it("newRevocationFile - calls createSubsetFilters with correct args", async () => {
      await fakeRequest(newRevocationFile, request);
      expect(createSubsetFilters).toHaveBeenCalledWith({
        filters: { violation_type: "ALL" },
      });
    });

    it("newRevocationFile - calls getNewRevocationsFiltersByMetricName with correct args", async () => {
      await fakeRequest(newRevocationFile, request);
      expect(getNewRevocationsFiltersByMetricName).toHaveBeenCalledWith({
        metricName: file,
        subsetFilters: mockSubsetFilters,
        userRestrictionsFilters: mockUserRestrictionsFilters,
      });
    });

    it("newRevocationFile - calls getCacheKey with correct args", async () => {
      await fakeRequest(newRevocationFile, request);
      expect(getCacheKey).toHaveBeenCalledWith({
        stateCode,
        metricType,
        metricName: file,
        cacheKeySubset: {
          violation_type: "ALL",
          ...mockUserRestrictionsFilters,
        },
      });
    });

    it("newRevocationFile - calls fetchAndFilterNewRevocationFile with correct args", async () => {
      await fakeRequest(newRevocationFile, request);
      expect(fetchAndFilterNewRevocationFile).toHaveBeenCalledWith({
        stateCode,
        metricType,
        metricName: file,
        filters: expectedFilters,
        isOfflineMode: false,
      });
    });

    // eslint-disable-next-line vitest/expect-expect
    it("newRevocationFile - calls fetchAndFilterNewRevocationFile if data is not cached", async () => {
      await requestAndExpectFetchMetricsCalled(
        newRevocationFile,
        1,
        request,
        fetchAndFilterNewRevocationFile,
      );

      await requestAndExpectFetchMetricsCalled(
        newRevocationFile,
        0,
        request,
        fetchAndFilterNewRevocationFile,
      );

      clearCache();

      await requestAndExpectFetchMetricsCalled(
        newRevocationFile,
        1,
        request,
        fetchAndFilterNewRevocationFile,
      );

      await requestAndExpectFetchMetricsCalled(
        newRevocationFile,
        0,
        request,
        fetchAndFilterNewRevocationFile,
      );
    });
  });

  describe("responder test", () => {
    const send = vi.fn();
    const status = vi.fn();
    const set = vi.fn();
    const res = { send, status, set };

    beforeEach(() => {
      status.mockImplementation(() => {
        return { send };
      });

      set.mockImplementation(() => {
        return { send };
      });
    });

    it("should send error status code 500 when no status is on error", () => {
      const error = "some error";
      const callback = responder(res);
      callback(error, null);

      expect(status).toHaveBeenCalledWith(500);
    });

    it("should send the error's status code when the status is on the error", () => {
      const error = { status: 400, errors: ["some error"] };
      const callback = responder(res);
      callback(error, null);

      expect(status).toHaveBeenCalledWith(error.status);
    });

    it("should send the error's status code when the error has a code property", () => {
      const error = { code: 404, error: "File not found" };
      const callback = responder(res);
      callback(error, null);

      expect(status).toHaveBeenCalledWith(error.code);
    });

    it("should send data", () => {
      const data = "some data";
      const callback = responder(res);
      callback(null, data);

      expect(send).toHaveBeenCalledWith(data);
    });

    it("should send the status and error message in the response body", () => {
      const error = new Error("API error");
      const callback = responder(res);
      callback(error, null);
      expect(send).toHaveBeenCalledWith({
        status: 500,
        errors: [error.message],
      });
    });

    it("should send the validation errors in the response body", () => {
      const error = { status: 400, errors: ["Validation errors"] };
      const callback = responder(res);
      callback(error, null);
      expect(send).toHaveBeenCalledWith(error);
    });

    it("should set the Cache-Control header", () => {
      const data = "some data";
      const callback = responder(res);
      callback(null, data);

      expect(set).toHaveBeenCalledWith("Cache-Control", "no-store, max-age=0");
    });

    it("should set the X-Content-Type-Options header", () => {
      const data = "some data";
      const callback = responder(res);
      callback(null, data);

      expect(set).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
    });
  });

  describe("getImpersonatedUserRestrictions", () => {
    beforeEach(async () => {
      vi.resetModules();
      await fakeRequest(getImpersonatedUserRestrictions, {
        query: {
          impersonatedStateCode: "US_TN",
          impersonatedEmail: "test-email",
        },
      });
    });
    it("calls GoogleAuth with the service account credentials", () => {
      expect(GoogleAuth).toHaveBeenCalledWith({
        credentials: { type: "service_account" },
      });
    });
    it("sanitizes bad hashes", () => {
      expect(sanitizeUserHash("/someHash/=")).toBe("_someHash/=");
    });
  });
});
