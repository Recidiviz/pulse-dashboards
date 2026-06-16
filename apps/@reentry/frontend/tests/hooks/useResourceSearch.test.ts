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

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useResourceSearch from "~@reentry/frontend/hooks/useResourceSearch";

const mockGetAccessToken = vi.fn().mockReturnValue("test-token");
vi.mock("~@reentry/frontend/lib/auth/authContext", () => ({
  useAuth: () => ({ getAccessToken: mockGetAccessToken }),
}));

const mockMutateAsync = vi.hoisted(() => vi.fn());
vi.mock("../../app/api", () => ({
  $api: {
    useMutation: () => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
    }),
  },
}));

const CATEGORY = "Housing";
const SUBCATEGORY = "Emergency housing and shelters";
const ADDRESS = "123 Main St, Portland, OR 97201";

const makeResource = (overrides = {}) => ({
  id: "place-1",
  name: "Test Shelter",
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  address: ADDRESS,
  travel_distance_miles: 2.5,
  ...overrides,
});

const makeApiResponse = (overrides = {}) => ({
  failure_reason: "success",
  error_message: null,
  resources: [makeResource()],
  ...overrides,
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useResourceSearch", () => {
  describe("initial state", () => {
    it("returns null results and no error before search", () => {
      const { result } = renderHook(() => useResourceSearch(ADDRESS));
      expect(result.current.results).toBeNull();
      expect(result.current.searchError).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("search", () => {
    it("does nothing when clientAddress is empty", async () => {
      const { result } = renderHook(() => useResourceSearch(""));

      await act(async () => {
        await result.current.search(CATEGORY, SUBCATEGORY, 50);
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
      expect(result.current.results).toBeNull();
    });

    it("calls the API with the correct body", async () => {
      mockMutateAsync.mockResolvedValue(makeApiResponse());
      const { result } = renderHook(() => useResourceSearch(ADDRESS));

      await act(async () => {
        await result.current.search(CATEGORY, SUBCATEGORY, 25);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            category: CATEGORY,
            subcategory: SUBCATEGORY,
            address: ADDRESS,
            distance_miles: 25,
            travel_mode: "DRIVE",
            use_search: true,
            limit: 50,
            include_physical_resources: true,
            include_digital_resources: false,
          }),
        }),
      );
    });

    it("includes the auth token in the request headers", async () => {
      mockMutateAsync.mockResolvedValue(makeApiResponse());
      const { result } = renderHook(() => useResourceSearch(ADDRESS));

      await act(async () => {
        await result.current.search(CATEGORY, SUBCATEGORY, 50);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    it("sorts physical resources nearest-first", async () => {
      const near = makeResource({ id: "near", travel_distance_miles: 1 });
      const far = makeResource({ id: "far", travel_distance_miles: 10 });
      mockMutateAsync.mockResolvedValue(
        makeApiResponse({ resources: [far, near] }),
      );

      const { result } = renderHook(() => useResourceSearch(ADDRESS));
      await act(async () => {
        await result.current.search(CATEGORY, SUBCATEGORY, 50);
      });

      expect(result.current.results?.map((r) => r.id)).toEqual(["near", "far"]);
    });

    it("places DIGITAL resources before physical resources", async () => {
      const physical = makeResource({
        id: "physical",
        resource_type: "COMMUNITY",
        travel_distance_miles: 1,
      });
      const digital = makeResource({
        id: "digital",
        resource_type: "DIGITAL",
        travel_distance_miles: null,
      });
      mockMutateAsync.mockResolvedValue(
        makeApiResponse({ resources: [physical, digital] }),
      );

      const { result } = renderHook(() => useResourceSearch(ADDRESS));
      await act(async () => {
        await result.current.search(CATEGORY, SUBCATEGORY, 50);
      });

      expect(result.current.results?.map((r) => r.id)).toEqual([
        "digital",
        "physical",
      ]);
    });

    it("places non-digital resources without distance after those with distance", async () => {
      const withDistance = makeResource({
        id: "with-distance",
        resource_type: "COMMUNITY",
        travel_distance_miles: 5,
      });
      const noDistance = makeResource({
        id: "no-distance",
        resource_type: "COMMUNITY",
        travel_distance_miles: null,
      });
      mockMutateAsync.mockResolvedValue(
        makeApiResponse({ resources: [noDistance, withDistance] }),
      );

      const { result } = renderHook(() => useResourceSearch(ADDRESS));
      await act(async () => {
        await result.current.search(CATEGORY, SUBCATEGORY, 50);
      });

      expect(result.current.results?.map((r) => r.id)).toEqual([
        "with-distance",
        "no-distance",
      ]);
    });

    it("applies full sort order: digital first, then by distance, then undistanced physical last", async () => {
      const resources = [
        makeResource({
          id: "no-distance",
          resource_type: "COMMUNITY",
          travel_distance_miles: null,
        }),
        makeResource({
          id: "far",
          resource_type: "COMMUNITY",
          travel_distance_miles: 10,
        }),
        makeResource({
          id: "digital",
          resource_type: "DIGITAL",
          travel_distance_miles: null,
        }),
        makeResource({
          id: "near",
          resource_type: "COMMUNITY",
          travel_distance_miles: 1,
        }),
      ];
      mockMutateAsync.mockResolvedValue(makeApiResponse({ resources }));

      const { result } = renderHook(() => useResourceSearch(ADDRESS));
      await act(async () => {
        await result.current.search(CATEGORY, SUBCATEGORY, 50);
      });

      expect(result.current.results?.map((r) => r.id)).toEqual([
        "digital",
        "near",
        "far",
        "no-distance",
      ]);
    });

    it("sets searchError and no results on api_error", async () => {
      mockMutateAsync.mockResolvedValue(
        makeApiResponse({ failure_reason: "api_error", resources: [] }),
      );

      const { result } = renderHook(() => useResourceSearch(ADDRESS));

      await act(async () => {
        await result.current.search(CATEGORY, SUBCATEGORY, 50);
      });

      expect(result.current.searchError).toBe("Search error.");
      expect(result.current.results).toBeNull();
    });

    it("still returns results on partial_failure", async () => {
      mockMutateAsync.mockResolvedValue(
        makeApiResponse({ failure_reason: "partial_failure" }),
      );

      const { result } = renderHook(() => useResourceSearch(ADDRESS));

      await act(async () => {
        await result.current.search(CATEGORY, SUBCATEGORY, 50);
      });

      expect(result.current.results).not.toBeNull();
      expect(result.current.searchError).toBeNull();
    });

    it("sets searchError when the mutation throws", async () => {
      mockMutateAsync.mockRejectedValue(new Error("network error"));

      const { result } = renderHook(() => useResourceSearch(ADDRESS));

      await act(async () => {
        await result.current.search(CATEGORY, SUBCATEGORY, 50);
      });

      expect(result.current.searchError).toBe("Search error.");
      expect(result.current.results).toBeNull();
    });
  });

  describe("address change", () => {
    it("clears results when clientAddress changes", async () => {
      mockMutateAsync.mockResolvedValue(makeApiResponse());
      const { result, rerender } = renderHook(
        ({ addr }) => useResourceSearch(addr),
        { initialProps: { addr: ADDRESS } },
      );

      await act(async () => {
        await result.current.search(CATEGORY, SUBCATEGORY, 50);
      });
      expect(result.current.results).not.toBeNull();

      act(() => {
        rerender({ addr: "456 Other St, Portland, OR 97202" });
      });

      expect(result.current.results).toBeNull();
    });
  });
});
