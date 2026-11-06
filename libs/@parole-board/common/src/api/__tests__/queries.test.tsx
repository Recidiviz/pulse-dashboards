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
  focusManager,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode, Suspense } from "react";

import {
  calendarApiConfig,
  calendarApiError,
  monthDetail,
  monthListPage,
  monthSummary,
} from "../../fixtures";
import { ParoleBoardHostProvider } from "../../host";
import { SuspenseBoundary } from "../../loading";
import {
  createFakeCalendarTrpc,
  createFakeHost,
  FakeCalendarProcedures,
} from "../../testing";
import {
  MONTH_REFETCH_INTERVAL_MS,
  useAddMonthOptions,
  useCalendarConfig,
  useCurrentPatterns,
  useMonth,
  useMonthQueryOptions,
  useMonthsList,
  usePrefetchMonth,
  usePublishPreview,
} from "../queries";
import type { YearMonthOption } from "../types";

function setup(
  procedures: FakeCalendarProcedures,
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  }),
) {
  const calendarTrpc = createFakeCalendarTrpc({ procedures, queryClient });
  const host = createFakeHost({ calendarTrpc });
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <ParoleBoardHostProvider host={host}>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<p>Loading</p>}>{children}</Suspense>
        </QueryClientProvider>
      </ParoleBoardHostProvider>
    );
  }
  return { queryClient, calendarTrpc, wrapper };
}

describe("useMonth", () => {
  it("reads the month for the year and month it's given", async () => {
    // A month back in draft: published once, then moved back with Edit month.
    const latestPublication = {
      publishedAt: new Date("2026-10-06T17:00:00Z"),
      publishedByEmail: "editor-b@example.com",
    };
    const get = vi.fn(() =>
      monthDetail({
        year: 2026,
        month: 11,
        counts: { entryDays: 12, entryCount: 30 },
        latestPublication,
      }),
    );
    const { wrapper } = setup({ "admin.months.get": get });

    const { result } = renderHook(() => useMonth({ year: 2026, month: 11 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current?.data?.month).toBe(11));
    expect(get).toHaveBeenCalledWith({ year: 2026, month: 11 });
    expect(result.current.data).toMatchObject({
      status: "DRAFT",
      counts: { entryDays: 12, entryCount: 30 },
      latestPublication,
    });
  });

  it("returns null for a month that doesn't exist", async () => {
    const { wrapper } = setup({ "admin.months.get": () => null });

    const { result } = renderHook(() => useMonth({ year: 2027, month: 3 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.data).toBeNull();
  });

  it("refetches every 30 seconds, and on regaining focus once the month is 30 seconds old", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const get = vi.fn(() => monthDetail());
      const { wrapper } = setup({ "admin.months.get": get });
      function MonthTitle() {
        const { data } = useMonth({ year: 2026, month: 11 });
        return <p>Month {data?.month}</p>;
      }
      render(<MonthTitle />, { wrapper });
      expect(await screen.findByText("Month 11")).toBeInTheDocument();
      expect(get).toHaveBeenCalledTimes(1);

      await act(() => vi.advanceTimersByTimeAsync(MONTH_REFETCH_INTERVAL_MS));
      await waitFor(() => expect(get).toHaveBeenCalledTimes(2));

      // A quick switch away and back doesn't refetch a fresh month, once it's
      // past the second Suspense queries always stay fresh.
      await act(() => vi.advanceTimersByTimeAsync(5_000));
      await act(async () => {
        focusManager.setFocused(false);
        focusManager.setFocused(true);
      });
      expect(get).toHaveBeenCalledTimes(2);

      // The interval pauses while the window is in the background, so a month
      // left longer than the interval refetches when focus comes back.
      await act(async () => {
        focusManager.setFocused(false);
      });
      await act(() =>
        vi.advanceTimersByTimeAsync(MONTH_REFETCH_INTERVAL_MS + 1_000),
      );
      expect(get).toHaveBeenCalledTimes(2);
      await act(async () => {
        focusManager.setFocused(true);
      });
      await waitFor(() => expect(get).toHaveBeenCalledTimes(3));
    } finally {
      focusManager.setFocused(undefined);
      vi.useRealTimers();
    }
  });

  it("doesn't refetch a month prefetched less than 30 seconds before it opens", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const get = vi.fn(() => monthDetail());
      const { wrapper } = setup({ "admin.months.get": get });

      const prefetch = renderHook(
        () => usePrefetchMonth({ year: 2026, month: 11 }),
        { wrapper },
      );
      await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
      prefetch.unmount();
      await act(() => vi.advanceTimersByTimeAsync(20_000));

      const { result } = renderHook(() => useMonth({ year: 2026, month: 11 }), {
        wrapper,
      });

      await waitFor(() => expect(result.current?.data?.month).toBe(11));
      expect(get).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows a SuspenseBoundary's skeleton while loading and its error when the read fails, then retries", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const get = vi
      .fn()
      .mockImplementationOnce(() => {
        throw calendarApiError("INTERNAL_SERVER_ERROR", "db down");
      })
      .mockImplementation(() => monthDetail());
    const { wrapper } = setup({ "admin.months.get": get });
    function MonthTitle() {
      const { data } = useMonth({ year: 2026, month: 11 });
      return <p>Month {data?.month}</p>;
    }

    render(
      <SuspenseBoundary fallback={<p>Month skeleton</p>}>
        <MonthTitle />
      </SuspenseBoundary>,
      { wrapper },
    );

    expect(screen.getByText("Month skeleton")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Month 11")).toBeInTheDocument();
  });
});

describe("useMonthsList", () => {
  it("centres the first page on around, with search and no cursor", async () => {
    const list = vi.fn(() =>
      monthListPage([monthSummary({ month: 11 })], {
        nextCursor: { year: 2026, month: 11 },
        prevCursor: { year: 2026, month: 11 },
      }),
    );
    const { wrapper } = setup({ "admin.months.list": list });

    const { result } = renderHook(
      () => useMonthsList({ around: { year: 2026, month: 11 }, search: "Nov" }),
      { wrapper },
    );

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(list).toHaveBeenCalledOnce();
    expect(list.mock.calls[0]).toEqual([
      {
        around: { year: 2026, month: 11 },
        search: "Nov",
        direction: "forward",
      },
    ]);
    expect(result.current.data.pages[0].items.map((m) => m.month)).toEqual([
      11,
    ]);
  });

  it("loads later months from nextCursor and earlier months from prevCursor", async () => {
    const list = vi.fn((input: unknown) => {
      const { cursor, direction } = input as {
        cursor?: { year: number; month: number };
        direction: string;
      };
      if (!cursor) {
        return monthListPage([monthSummary({ month: 11 })], {
          nextCursor: { year: 2026, month: 11 },
          prevCursor: { year: 2026, month: 11 },
        });
      }
      return direction === "forward"
        ? monthListPage([monthSummary({ month: 12 })])
        : monthListPage([monthSummary({ month: 10 })]);
    });
    const { wrapper } = setup({ "admin.months.list": list });
    function MonthPicker() {
      const { data, fetchNextPage, fetchPreviousPage, hasNextPage } =
        useMonthsList({ around: { year: 2026, month: 11 } });
      return (
        <div>
          <p>
            {data.pages.flatMap((p) => p.items.map((m) => m.month)).join(",")}
          </p>
          <p>{hasNextPage ? "more later" : "no more later"}</p>
          <button onClick={() => fetchNextPage()}>Later</button>
          <button onClick={() => fetchPreviousPage()}>Earlier</button>
        </div>
      );
    }
    render(<MonthPicker />, { wrapper });

    await userEvent.click(await screen.findByRole("button", { name: "Later" }));
    expect(await screen.findByText("11,12")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Earlier" }));
    expect(await screen.findByText("10,11,12")).toBeInTheDocument();
    expect(screen.getByText("no more later")).toBeInTheDocument();

    expect(list.mock.calls[1][0]).toMatchObject({
      cursor: { year: 2026, month: 11 },
      direction: "forward",
    });
    expect(list.mock.calls[2][0]).toMatchObject({
      cursor: { year: 2026, month: 11 },
      direction: "backward",
    });
  });
});

describe("the other reads", () => {
  it("useCalendarConfig returns the allowed weekdays and never goes stale", async () => {
    const { wrapper } = setup({ "admin.config.get": () => calendarApiConfig });

    const { result } = renderHook(() => useCalendarConfig(), { wrapper });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.data.calendar.allowedWeekdays).toEqual([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
    ]);
    expect(result.current.isStale).toBe(false);
  });

  it("useAddMonthOptions, usePublishPreview and useCurrentPatterns read their procedures", async () => {
    const publishPreview = vi.fn(() => ({ monthId: "month-2026-11" }));
    const { wrapper } = setup({
      "admin.months.addOptions": () => [{ year: 2026, month: 12 }],
      "admin.months.publishPreview": publishPreview,
      "admin.patterns.listCurrent": () => [],
    });

    const { result } = renderHook(
      () => ({
        options: useAddMonthOptions(),
        preview: usePublishPreview({ monthId: "month-2026-11" }),
        patterns: useCurrentPatterns(),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.options.data).toEqual([{ year: 2026, month: 12 }]);
    expect(publishPreview).toHaveBeenCalledWith({ monthId: "month-2026-11" });
    expect(result.current.patterns.data).toEqual([]);
  });
});

describe("reading a month without suspending", () => {
  it("useMonthQueryOptions gives useQuery the month, pending until it loads", async () => {
    const { wrapper } = setup({ "admin.months.get": () => monthDetail() });

    const { result } = renderHook(
      () => useQuery(useMonthQueryOptions({ year: 2026, month: 11 })),
      { wrapper },
    );

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(monthDetail()));
  });

  it("usePrefetchMonth loads the month it's given, skips no month, and its function fetches again only once the month is 30 seconds old", async () => {
    const get = vi.fn(() => monthDetail({ year: 2026, month: 12 }));
    const { queryClient, calendarTrpc, wrapper } = setup({
      "admin.months.get": get,
    });
    const decemberKey = calendarTrpc.querier.admin.months.get.queryKey({
      year: 2026,
      month: 12,
    });

    const { result, rerender } = renderHook(
      ({ yearMonth }: { yearMonth: YearMonthOption | null }) =>
        usePrefetchMonth(yearMonth),
      {
        wrapper,
        initialProps: {
          yearMonth: { year: 2026, month: 12 } as YearMonthOption | null,
        },
      },
    );

    await waitFor(() =>
      expect(queryClient.getQueryData(decemberKey)).toEqual(
        monthDetail({ year: 2026, month: 12 }),
      ),
    );
    act(() => result.current());
    expect(get).toHaveBeenCalledTimes(1);

    queryClient.setQueryData(
      decemberKey,
      monthDetail({ year: 2026, month: 12 }),
      {
        updatedAt: Date.now() - MONTH_REFETCH_INTERVAL_MS - 1,
      },
    );
    act(() => result.current());
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));

    rerender({ yearMonth: null });
    act(() => result.current());
    expect(get).toHaveBeenCalledTimes(2);
  });
});

describe("retries", () => {
  it("doesn't retry an error written for editors, even when the QueryClient retries", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const publishPreview = vi.fn(() => {
      throw calendarApiError(
        "PRECONDITION_FAILED",
        "November 2026 isn't a draft any more.",
      );
    });
    const { wrapper } = setup(
      { "admin.months.publishPreview": publishPreview },
      new QueryClient({ defaultOptions: { queries: { retry: 3 } } }),
    );
    function Preview() {
      usePublishPreview({ monthId: "month-2026-11" });
      return <p>Preview</p>;
    }

    render(
      <SuspenseBoundary fallback={<p>Preview skeleton</p>}>
        <Preview />
      </SuspenseBoundary>,
      { wrapper },
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(publishPreview).toHaveBeenCalledTimes(1);
  });
});
