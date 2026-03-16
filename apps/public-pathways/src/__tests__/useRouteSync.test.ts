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

import { renderHook } from "@testing-library/react";
import { reaction } from "mobx";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryParams } from "use-query-params";
import { Mock } from "vitest";

import {
  convertLabelsToValues,
  DEFAULT_PATHWAYS_SECTION_BY_PAGE,
  PATHWAYS_SECTIONS,
} from "~shared-pathways";

import { useRootStore } from "../components/StoreProvider";
import { useRouteSync } from "../useRouteSync";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});

vi.mock("use-query-params", () => ({
  StringParam: "string",
  useQueryParams: vi.fn(),
}));

vi.mock("../components/StoreProvider");

vi.mock("mobx", async () => {
  const actual = await vi.importActual("mobx");
  return {
    ...actual,
    reaction: vi.fn(),
  };
});

vi.mock("~shared-pathways", async () => {
  const actual = await vi.importActual("~shared-pathways");
  return {
    ...actual,
    convertLabelsToValues: vi.fn(),
  };
});

const mockUseParams = useParams as Mock;
const mockUseNavigate = useNavigate as Mock;
const mockUseQueryParams = useQueryParams as Mock;
const mockUseRootStore = useRootStore as Mock;
const mockReaction = reaction as Mock;
const mockConvertLabelsToValues = convertLabelsToValues as Mock;

describe("useRouteSync", () => {
  let mockNavigate: Mock;
  let mockSetQuery: Mock;
  let mockRootStore: {
    setPage: Mock;
    setSection: Mock;
    filtersStore: {
      setFilters: Mock;
      filterOptions: Record<string, unknown>;
      filtersLabels: Record<string, string>;
    };
    metricsStore: {
      section: string;
      current: {
        filters: {
          enabledFilters: string[];
          enabledMoreFilters?: string[];
        };
      };
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockNavigate = vi.fn();
    mockSetQuery = vi.fn();

    mockRootStore = {
      setPage: vi.fn(),
      setSection: vi.fn(),
      filtersStore: {
        setFilters: vi.fn(),
        filterOptions: {},
        filtersLabels: { timePeriod: "6 months", sex: "All" },
      },
      metricsStore: {
        section: PATHWAYS_SECTIONS["countOverTime"],
        current: {
          filters: {
            enabledFilters: ["timePeriod", "sex"],
            enabledMoreFilters: [],
          },
        },
      },
    };

    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseRootStore.mockReturnValue(mockRootStore);
    mockReaction.mockReturnValue(vi.fn());
    mockConvertLabelsToValues.mockReturnValue({});
  });

  function setupHook({
    pageId = "prison",
    query = {} as Record<string, string | null | undefined>,
  } = {}) {
    mockUseParams.mockReturnValue({ pageId });
    mockUseQueryParams.mockReturnValue([query, mockSetQuery]);
    return renderHook(() => useRouteSync());
  }

  describe("URL to Store sync", () => {
    it("sets page from route param", () => {
      setupHook({ pageId: "prison" });
      expect(mockRootStore.setPage).toHaveBeenCalledWith("prison");
    });

    it("sets section from query param", () => {
      setupHook({
        pageId: "prison",
        query: { sectionId: "countByRace" },
      });
      expect(mockRootStore.setSection).toHaveBeenCalledWith("countByRace");
    });

    it("sets default section when no sectionId in query", () => {
      setupHook({ pageId: "prison", query: {} });
      expect(mockRootStore.setSection).toHaveBeenCalledWith(
        DEFAULT_PATHWAYS_SECTION_BY_PAGE["prison"],
      );
    });

    it("redirects to /prison for an invalid pageId", () => {
      setupHook({ pageId: "invalidPage" });
      expect(mockNavigate).toHaveBeenCalledWith("/prison", { replace: true });
      expect(mockRootStore.setPage).not.toHaveBeenCalled();
    });

    it("syncs filter labels from query params to store", () => {
      const convertedFilters = { timePeriod: ["6"], sex: ["ALL"] };
      mockConvertLabelsToValues.mockReturnValue(convertedFilters);

      setupHook({
        pageId: "prison",
        query: { timePeriod: "6 months", sex: "All" },
      });

      expect(mockConvertLabelsToValues).toHaveBeenCalledWith(
        { timePeriod: "6 months", sex: "All" },
        mockRootStore.filtersStore.filterOptions,
      );
      expect(mockRootStore.filtersStore.setFilters).toHaveBeenCalledWith(
        convertedFilters,
      );
    });

    it("does not call setFilters when no filter params in URL", () => {
      setupHook({ pageId: "prison", query: {} });
      expect(mockRootStore.filtersStore.setFilters).not.toHaveBeenCalled();
    });
  });

  describe("Store to URL sync", () => {
    it("sets up a MobX reaction on mount", () => {
      setupHook();
      expect(mockReaction).toHaveBeenCalledOnce();
      expect(mockReaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        { fireImmediately: true },
      );
    });

    it("disposes the reaction on unmount", () => {
      const disposeFn = vi.fn();
      mockReaction.mockReturnValue(disposeFn);

      const { unmount } = setupHook();
      unmount();

      expect(disposeFn).toHaveBeenCalledOnce();
    });

    it("reaction callback updates query params with section and enabled filter labels", () => {
      setupHook();

      // Extract the reaction effect callback (second argument)
      const reactionEffect = mockReaction.mock.calls[0][1];

      reactionEffect({
        section: "countByRace",
        filtersLabels: { timePeriod: "6 months", sex: "Female" },
      });

      expect(mockSetQuery).toHaveBeenCalledWith(
        {
          sectionId: "countByRace",
          timePeriod: "6 months",
          sex: "Female",
        },
        "replaceIn",
      );
    });

    it("reaction callback does not update query when metric is falsy", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockRootStore.metricsStore.current = undefined as any;
      setupHook();

      const reactionEffect = mockReaction.mock.calls[0][1];
      reactionEffect({
        section: "countOverTime",
        filtersLabels: {},
      });

      expect(mockSetQuery).not.toHaveBeenCalled();
    });

    it("reaction data function reads section and filtersLabels", () => {
      setupHook();

      // Extract the reaction data function (first argument) and call it
      const reactionData = mockReaction.mock.calls[0][0];
      const result = reactionData();

      expect(result).toEqual({
        section: PATHWAYS_SECTIONS["countOverTime"],
        filtersLabels: mockRootStore.filtersStore.filtersLabels,
      });
    });
  });
});
