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

import type {
  ResourceBankResponse,
  ResourceWithMeta,
} from "~@reentry/frontend/hooks/resourceBank.types";
import { useMockRessourceAPICall } from "~@reentry/frontend/hooks/useMockRessourceAPICall";
import { useResourceBank } from "~@reentry/frontend/hooks/useResourceBank";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";

import { mockResourceBank } from "../mocks/mockResourceBank";

vi.mock("~@reentry/frontend-shared", () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

vi.mock("../../app/hooks/useMockRessourceAPICall");

const makeResource = (id: string, name: string): ResourceWithMeta =>
  ({ id, name, origin: "GOOGLE" }) as ResourceWithMeta;

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
  vi.mocked(useMockRessourceAPICall).mockReturnValue({
    data: mockResourceBank,
    isLoading: false,
    isError: false,
  });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("useResourceBank", () => {
  describe("initial state", () => {
    it("populates sections from plan data", () => {
      const { result } = renderHook(() => useResourceBank());
      expect(getSectionResources(result, HOUSING_SECTION)).toEqual(
        housingResources,
      );
    });

    it("reflects isLoading and isError from useMockRessourceAPICall", () => {
      vi.mocked(useMockRessourceAPICall).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
      });
      const { result } = renderHook(() => useResourceBank());
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);
    });
  });

  describe("addResource", () => {
    it("optimistically appends the resource", () => {
      const { result } = renderHook(() => useResourceBank());
      const newResource = makeResource("r-new", "New Shelter");

      act(() => {
        result.current.addResource(HOUSING_SECTION, newResource);
      });

      expect(getSectionResources(result, HOUSING_SECTION)).toContainEqual(
        newResource,
      );
    });

    it("does nothing when the resource is already in the section", () => {
      const { result } = renderHook(() => useResourceBank());

      act(() => {
        result.current.addResource(
          HOUSING_SECTION,
          housingResources[0] as ResourceWithMeta,
        );
      });

      expect(getSectionResources(result, HOUSING_SECTION)).toHaveLength(
        housingResources.length,
      );
    });

    it("shows an error and does not add when the section has 20 resources", () => {
      const fullResources = Array.from({ length: 20 }, (_, i) =>
        makeResource(`full-${i}`, `Resource ${i}`),
      );
      vi.mocked(useMockRessourceAPICall).mockReturnValue({
        data: {
          resources_by_sections: [
            { title: HOUSING_SECTION, resources: fullResources },
          ],
        } as ResourceBankResponse,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useResourceBank());

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
      const { result } = renderHook(() => useResourceBank());
      const newResource = makeResource("r-new", "New Shelter");

      act(() => {
        result.current.addResource(HOUSING_SECTION, newResource);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(vi.mocked(showSuccessToast)).toHaveBeenCalledWith(
        expect.stringContaining("New Shelter"),
      );
    });
  });

  describe("removeResource", () => {
    it("optimistically removes the resource", () => {
      const { result } = renderHook(() => useResourceBank());
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
      const { result } = renderHook(() => useResourceBank());
      const [first] = housingResources;

      act(() => {
        result.current.removeResource(HOUSING_SECTION, first.id);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(vi.mocked(showSuccessToast)).toHaveBeenCalledWith(
        expect.stringContaining(first.name),
      );
      expect(vi.mocked(showSuccessToast)).toHaveBeenCalledWith(
        expect.stringContaining(HOUSING_SECTION),
      );
    });

    it("does nothing when the section does not exist", () => {
      const { result } = renderHook(() => useResourceBank());

      act(() => {
        result.current.removeResource("Nonexistent Section", "res-housing-001");
      });

      expect(getSectionResources(result, HOUSING_SECTION)).toHaveLength(
        housingResources.length,
      );
    });
  });
});
