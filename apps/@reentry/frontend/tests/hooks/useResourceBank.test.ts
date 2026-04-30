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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useResourceBank } from "~@reentry/frontend/hooks/useResourceBank";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "~@reentry/frontend-shared";
import type { components } from "~@reentry/openapi-types";

import { mockResourceBank } from "../mocks/mockResourceBank";

type Resource = components["schemas"]["Resource"];

vi.mock("~@reentry/frontend-shared", () => ({
  showInfoToast: vi.fn(),
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

vi.mock("~@reentry/frontend/lib/auth/authContext", () => ({
  useAuth: () => ({ getAccessToken: () => "mock-token" }),
}));

const mockUseQuery = vi.hoisted(() => vi.fn());
const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue({}));
vi.mock("../../app/api", () => ({
  $api: {
    useQuery: mockUseQuery,
    useMutation: () => ({ mutateAsync: mockMutateAsync }),
  },
}));

const makeResource = (id: string, name: string): Resource =>
  ({ id, name, category: "Housing", resource_id: 999 }) as Resource;

const HOUSING_SECTION = "Housing Stability";
const housingSection = mockResourceBank.resources_by_sections.find(
  (s) => s.title === HOUSING_SECTION,
);
if (!housingSection)
  throw new Error(`Section "${HOUSING_SECTION}" not found in mockResourceBank`);
const housingResources = housingSection.resources;

const getSectionResources = (
  result: { current: ReturnType<typeof useResourceBank> },
  title: string,
) => result.current.sections.find((s) => s.title === title)?.resources;

beforeEach(() => {
  mockUseQuery.mockReturnValue({
    data: mockResourceBank,
    isLoading: false,
    isError: false,
  });
});

afterEach(() => {
  vi.clearAllMocks();
  mockMutateAsync.mockResolvedValue({});
});

describe("useResourceBank", () => {
  describe("initial state", () => {
    it("populates sections from plan data", () => {
      const { result } = renderHook(() => useResourceBank("mock-gen-id-001"));
      expect(getSectionResources(result, HOUSING_SECTION)).toEqual(
        housingResources,
      );
    });

    it("reflects isLoading and isError from the API query", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
      });
      const { result } = renderHook(() => useResourceBank("mock-gen-id-001"));
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);
    });
  });

  describe("addResource", () => {
    it("optimistically appends the resource", () => {
      const { result } = renderHook(() => useResourceBank("mock-gen-id-001"));
      const newResource = makeResource("r-new", "New Shelter");

      act(() => {
        result.current.addResource(HOUSING_SECTION, newResource);
      });

      expect(getSectionResources(result, HOUSING_SECTION)).toContainEqual(
        newResource,
      );
    });

    it("does nothing when the resource is already in the section", () => {
      const { result } = renderHook(() => useResourceBank("mock-gen-id-001"));

      act(() => {
        result.current.addResource(
          HOUSING_SECTION,
          housingResources[0] as Resource,
        );
      });

      expect(vi.mocked(showInfoToast)).toHaveBeenCalledWith(
        `${housingResources[0].name} is already in ${HOUSING_SECTION}.`,
      );

      expect(getSectionResources(result, HOUSING_SECTION)).toHaveLength(
        housingResources.length,
      );
    });

    it("shows an error and does not add when the section has 20 resources", () => {
      const fullResources = Array.from({ length: 20 }, (_, i) =>
        makeResource(`full-${i}`, `Resource ${i}`),
      );
      mockUseQuery.mockReturnValue({
        data: {
          resources_by_sections: [
            { title: HOUSING_SECTION, resources: fullResources },
          ],
        },
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useResourceBank("mock-gen-id-001"));

      act(() => {
        result.current.addResource(
          HOUSING_SECTION,
          makeResource("r-new", "New Resource"),
        );
      });

      expect(vi.mocked(showErrorToast)).toHaveBeenCalledWith(
        "Cannot add more than 20 resources per section.",
      );
      expect(getSectionResources(result, HOUSING_SECTION)).toHaveLength(20);
    });

    it("shows a success toast after the API resolves", async () => {
      const { result } = renderHook(() => useResourceBank("mock-gen-id-001"));
      const newResource = makeResource("r-new", "New Shelter");

      await act(async () => {
        result.current.addResource(HOUSING_SECTION, newResource);
      });

      expect(vi.mocked(showSuccessToast)).toHaveBeenCalledWith(
        expect.stringContaining("New Shelter"),
      );
    });

    it("rolls back and shows error toast when the API rejects", async () => {
      mockMutateAsync.mockRejectedValue(new Error("network error"));
      const { result } = renderHook(() => useResourceBank("mock-gen-id-001"));
      const newResource = makeResource("r-new", "New Shelter");

      await act(async () => {
        result.current.addResource(HOUSING_SECTION, newResource);
      });

      expect(vi.mocked(showErrorToast)).toHaveBeenCalledWith(
        expect.stringContaining("New Shelter"),
      );
      expect(getSectionResources(result, HOUSING_SECTION)).not.toContainEqual(
        newResource,
      );
    });
  });

  describe("removeResource", () => {
    it("optimistically removes the resource", () => {
      const { result } = renderHook(() => useResourceBank("mock-gen-id-001"));
      const [first] = housingResources;

      act(() => {
        result.current.removeResource(HOUSING_SECTION, first.id);
      });

      expect(getSectionResources(result, HOUSING_SECTION)).not.toContainEqual(
        first,
      );
      expect(getSectionResources(result, HOUSING_SECTION)).toHaveLength(
        housingResources.length - 1,
      );
    });

    it("shows a success toast with name and section after the API resolves", async () => {
      const { result } = renderHook(() => useResourceBank("mock-gen-id-001"));
      const [first] = housingResources;

      await act(async () => {
        result.current.removeResource(HOUSING_SECTION, first.id);
      });

      expect(vi.mocked(showSuccessToast)).toHaveBeenCalledWith(
        expect.stringContaining(first.name),
      );
      expect(vi.mocked(showSuccessToast)).toHaveBeenCalledWith(
        expect.stringContaining(HOUSING_SECTION),
      );
    });

    it("does nothing when the resource is not found", () => {
      const { result } = renderHook(() => useResourceBank("mock-gen-id-001"));

      act(() => {
        result.current.removeResource("Nonexistent Section", "res-housing-001");
      });

      expect(getSectionResources(result, HOUSING_SECTION)).toHaveLength(
        housingResources.length,
      );
    });

    it("rolls back and shows error toast when the API rejects", async () => {
      mockMutateAsync.mockRejectedValue(new Error("network error"));
      const { result } = renderHook(() => useResourceBank("mock-gen-id-001"));
      const [first] = housingResources;

      await act(async () => {
        result.current.removeResource(HOUSING_SECTION, first.id);
      });

      expect(vi.mocked(showErrorToast)).toHaveBeenCalledWith(
        expect.stringContaining(first.name),
      );
      expect(getSectionResources(result, HOUSING_SECTION)).toContainEqual(
        first,
      );
    });
  });
});
