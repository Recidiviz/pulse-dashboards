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

import { usePagination } from "../usePagination";

describe("usePagination", () => {
  it("starts on page 0 with an undefined cursor", () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.pageIndex).toBe(0);
    expect(result.current.cursor).toBeUndefined();
    expect(result.current.canGoPrevious).toBe(false);
  });

  it("advances to the next page and stores the cursor", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.goNext("cursor-1");
    });

    expect(result.current.pageIndex).toBe(1);
    expect(result.current.cursor).toBe("cursor-1");
    expect(result.current.canGoPrevious).toBe(true);
  });

  it("does not advance when nextCursor is null", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.goNext(null);
    });

    expect(result.current.pageIndex).toBe(0);
    expect(result.current.cursor).toBeUndefined();
  });

  it("returns to the previous page while retaining the cursor stack", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.goNext("cursor-1");
      result.current.goNext("cursor-2");
      result.current.goPrevious();
    });

    expect(result.current.pageIndex).toBe(1);
    expect(result.current.cursor).toBe("cursor-1");
  });

  it("reset returns to the initial state", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.goNext("cursor-1");
      result.current.reset();
    });

    expect(result.current.pageIndex).toBe(0);
    expect(result.current.cursor).toBeUndefined();
    expect(result.current.canGoPrevious).toBe(false);
  });

  it("getProps exposes pagination controls from query data", () => {
    const { result } = renderHook(() => usePagination());

    const initialProps = result.current.getProps({
      data: { total: 42, nextCursor: "next" },
      pageSize: 10,
    });

    expect(initialProps.pageIndex).toBe(0);
    expect(initialProps.pageSize).toBe(10);
    expect(initialProps.totalCount).toBe(42);
    expect(initialProps.canNextPage).toBe(true);
    expect(initialProps.canPreviousPage).toBe(false);

    act(() => {
      initialProps.onNextPage();
    });

    const updatedProps = result.current.getProps({
      data: { total: 42, nextCursor: "next-2" },
      pageSize: 10,
    });

    expect(updatedProps.pageIndex).toBe(1);
    expect(updatedProps.canPreviousPage).toBe(true);
    expect(updatedProps.canNextPage).toBe(true);
  });

  it("blocks navigation while a page transition is in flight", () => {
    const { result } = renderHook(() => usePagination());

    const props = result.current.getProps({
      data: { total: 42, nextCursor: "next" },
      pageSize: 10,
      isNavigating: true,
    });

    expect(props.canNextPage).toBe(false);
    expect(props.canPreviousPage).toBe(false);

    // Rapid clicks while navigating must not advance the page index.
    act(() => {
      props.onNextPage();
      props.onNextPage();
      props.onNextPage();
    });

    expect(result.current.pageIndex).toBe(0);
  });

  it("blocks onPreviousPage while a page transition is in flight", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.goNext("cursor-1");
    });

    expect(result.current.pageIndex).toBe(1);

    const props = result.current.getProps({
      data: { total: 42, nextCursor: "next-2" },
      pageSize: 10,
      isNavigating: true,
    });

    act(() => {
      props.onPreviousPage();
    });

    expect(result.current.pageIndex).toBe(1);
  });
});
