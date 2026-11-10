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
import { describe, expect, it } from "vitest";

import { USER_ROLE } from "~@idaho-th/shared";

import { EMPTY_APPLICATIONS_TABLE_FILTERS } from "../../components/HousingApplications/ApplicationsTable/applicationsTable.filters";
import {
  PAGE_SIZE,
  useApplicationsTableState,
} from "../useApplicationsTableState";

/** Moves the hook off page one so a reset is observable. */
function goToPageTwo(result: {
  current: ReturnType<typeof useApplicationsTableState>;
}) {
  act(() => result.current.pagination.goNext("cursor-2"));
  expect(result.current.query.pagination.cursor).toBe("cursor-2");
}

describe("useApplicationsTableState", () => {
  it("starts on page one, unfiltered, sorted by expected release date", () => {
    const { result } = renderHook(() =>
      useApplicationsTableState(USER_ROLE.STAFF),
    );

    expect(result.current.sorting).toEqual([
      { id: "expectedReleaseDate", desc: false },
    ]);
    expect(result.current.filters).toEqual(EMPTY_APPLICATIONS_TABLE_FILTERS);
    expect(result.current.hasSearch).toBe(false);
    expect(result.current.query).toEqual({
      pagination: { cursor: undefined, pageSize: PAGE_SIZE },
      sorting: { field: "expectedReleaseDate", direction: "asc" },
      search: undefined,
      filters: {},
    });
  });

  describe("search", () => {
    it("builds a case-insensitive contains filter on the client name", () => {
      const { result } = renderHook(() =>
        useApplicationsTableState(USER_ROLE.STAFF),
      );

      act(() => result.current.handleSearchChange("doe"));

      expect(result.current.hasSearch).toBe(true);
      expect(result.current.query.search).toEqual({
        clientName: { contains: "doe", mode: "insensitive" },
      });
    });

    it("clears the filter for an empty search rather than matching everything", () => {
      const { result } = renderHook(() =>
        useApplicationsTableState(USER_ROLE.STAFF),
      );
      act(() => result.current.handleSearchChange("doe"));

      act(() => result.current.handleSearchChange(""));

      expect(result.current.hasSearch).toBe(false);
      expect(result.current.query.search).toBeUndefined();
    });

    it("returns to page one, so results are not read against a stale cursor", () => {
      const { result } = renderHook(() =>
        useApplicationsTableState(USER_ROLE.STAFF),
      );
      goToPageTwo(result);

      act(() => result.current.handleSearchChange("doe"));

      expect(result.current.query.pagination.cursor).toBeUndefined();
    });
  });

  describe("filters", () => {
    it("maps the selected filters into the query shape", () => {
      const { result } = renderHook(() =>
        useApplicationsTableState(USER_ROLE.STAFF),
      );

      act(() =>
        result.current.handleFiltersChange({
          ...EMPTY_APPLICATIONS_TABLE_FILTERS,
          releaseDate: ["Next 30 days"] as never,
        }),
      );

      expect(result.current.filters.releaseDate).toEqual(["Next 30 days"]);
      expect(result.current.query.filters).toEqual({
        releaseDate: ["Next 30 days"],
      });
    });

    it("returns to page one when the filters change", () => {
      const { result } = renderHook(() =>
        useApplicationsTableState(USER_ROLE.STAFF),
      );
      goToPageTwo(result);

      act(() =>
        result.current.handleFiltersChange(EMPTY_APPLICATIONS_TABLE_FILTERS),
      );

      expect(result.current.query.pagination.cursor).toBeUndefined();
    });
  });

  describe("sorting", () => {
    it("accepts a new sort state directly", () => {
      const { result } = renderHook(() =>
        useApplicationsTableState(USER_ROLE.STAFF),
      );

      act(() =>
        result.current.handleSortingChange([{ id: "clientName", desc: true }]),
      );

      expect(result.current.query.sorting).toEqual({
        field: "clientName",
        direction: "desc",
      });
    });

    it("accepts an updater function, the form react-table passes", () => {
      const { result } = renderHook(() =>
        useApplicationsTableState(USER_ROLE.STAFF),
      );

      act(() =>
        result.current.handleSortingChange((previous) => [
          { id: previous[0]?.id ?? "clientName", desc: true },
        ]),
      );

      expect(result.current.query.sorting).toEqual({
        field: "expectedReleaseDate",
        direction: "desc",
      });
    });

    it("sorts the alerts column by its underlying updatedAt field", () => {
      // "alerts" is a derived column with no column of its own to sort on.
      const { result } = renderHook(() =>
        useApplicationsTableState(USER_ROLE.STAFF),
      );

      act(() =>
        result.current.handleSortingChange([{ id: "alerts", desc: true }]),
      );

      expect(result.current.query.sorting).toEqual({
        field: "updatedAt",
        direction: "desc",
      });
    });

    it("sends no sort when the table clears its sort state", () => {
      const { result } = renderHook(() =>
        useApplicationsTableState(USER_ROLE.STAFF),
      );

      act(() => result.current.handleSortingChange([]));

      expect(result.current.query.sorting).toBeUndefined();
    });

    it("returns to page one when the sort changes", () => {
      const { result } = renderHook(() =>
        useApplicationsTableState(USER_ROLE.STAFF),
      );
      goToPageTwo(result);

      act(() =>
        result.current.handleSortingChange([{ id: "clientName", desc: true }]),
      );

      expect(result.current.query.pagination.cursor).toBeUndefined();
    });
  });

  it("always requests the shared page size", () => {
    const { result } = renderHook(() =>
      useApplicationsTableState(USER_ROLE.STAFF),
    );

    act(() => result.current.pagination.goNext("cursor-2"));

    expect(result.current.query.pagination).toEqual({
      cursor: "cursor-2",
      pageSize: PAGE_SIZE,
    });
  });
});
