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

import type { YearMonthOption } from "~@parole-board/common";
import { useMonthsList } from "~@parole-board/common";
import {
  december2026Summary,
  infiniteQueryResult,
  monthListPage,
  monthSummary,
  november2026Summary,
  september2026Summary,
} from "~@parole-board/common/fixtures";

import { useNeighborMonths } from "../useNeighborMonths";

vi.mock("~@parole-board/common", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~@parole-board/common")>()),
  useMonthsList: vi.fn(),
}));

const OCTOBER_2026 = { year: 2026, month: 10 };

// The page centred on October 2026: September, November and December, with
// more months on both sides.
const centredPage = monthListPage([
  september2026Summary,
  november2026Summary,
  december2026Summary,
]);

function mockList(more: { hasNextPage?: boolean; hasPreviousPage?: boolean }) {
  const result = infiniteQueryResult([centredPage], more);
  vi.spyOn(result, "fetchNextPage");
  vi.spyOn(result, "fetchPreviousPage");
  vi.mocked(useMonthsList).mockReturnValue(
    result as unknown as ReturnType<typeof useMonthsList>,
  );
  return result;
}

const neighbours = (viewed: YearMonthOption) =>
  renderHook(() => useNeighborMonths(viewed, OCTOBER_2026)).result.current;

describe("useNeighborMonths", () => {
  test("reads the picker's list, centred on the current month", () => {
    mockList({});

    neighbours({ year: 2026, month: 11 });

    expect(useMonthsList).toHaveBeenCalledWith({ around: OCTOBER_2026 });
  });

  test("returns the nearest stored month each side, skipping missing months", () => {
    mockList({ hasNextPage: true, hasPreviousPage: true });

    expect(neighbours({ year: 2026, month: 11 })).toEqual({
      previous: { year: 2026, month: 9 },
      next: { year: 2026, month: 12 },
    });
  });

  test("returns null at the ends of the list", () => {
    mockList({});

    expect(neighbours({ year: 2026, month: 9 }).previous).toBeNull();
    expect(neighbours({ year: 2026, month: 12 }).next).toBeNull();
  });

  test("loads the next page for the last loaded month, and has no next month until it arrives", () => {
    const list = mockList({ hasNextPage: true });

    expect(neighbours({ year: 2026, month: 12 })).toEqual({
      previous: { year: 2026, month: 11 },
      next: null,
    });
    expect(list.fetchNextPage).toHaveBeenCalled();
    expect(list.fetchPreviousPage).not.toHaveBeenCalled();
  });

  test("doesn't ask again for a page that failed to load", () => {
    const list = mockList({ hasNextPage: true });
    Object.assign(list, { isFetchNextPageError: true });

    expect(neighbours({ year: 2026, month: 12 }).next).toBeNull();
    expect(list.fetchNextPage).not.toHaveBeenCalled();
  });

  test("past the loaded pages, it loads the next page and knows neither neighbour", () => {
    const list = mockList({ hasNextPage: true, hasPreviousPage: true });

    expect(neighbours({ year: 2027, month: 6 })).toEqual({
      previous: null,
      next: null,
    });
    expect(list.fetchNextPage).toHaveBeenCalled();
  });

  test("before the loaded pages, it loads the previous page", () => {
    const list = mockList({ hasNextPage: true, hasPreviousPage: true });

    expect(neighbours({ year: 2026, month: 1 })).toEqual({
      previous: null,
      next: null,
    });
    expect(list.fetchPreviousPage).toHaveBeenCalled();
    expect(list.fetchNextPage).not.toHaveBeenCalled();
  });

  test("finds the next month on a later page once it has loaded", () => {
    const result = infiniteQueryResult(
      [centredPage, monthListPage([monthSummary({ year: 2027, month: 2 })])],
      { hasNextPage: true },
    );
    vi.spyOn(result, "fetchNextPage");
    vi.mocked(useMonthsList).mockReturnValue(
      result as unknown as ReturnType<typeof useMonthsList>,
    );

    expect(neighbours({ year: 2026, month: 12 }).next).toEqual({
      year: 2027,
      month: 2,
    });
    expect(result.fetchNextPage).not.toHaveBeenCalled();
  });
});
