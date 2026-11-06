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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";

import {
  calendarApiError,
  monthDetail,
  monthListPage,
  monthSummary,
} from "../../fixtures";
import { ParoleBoardHost, ParoleBoardHostProvider } from "../../host";
import {
  createFakeCalendarTrpc,
  createFakeHost,
  FakeCalendarProcedures,
} from "../../testing";
import type { CalendarErrorCode } from "../errors";
import {
  useAddEntry,
  useCancelEntry,
  useCreateMonths,
  useDeleteEntry,
  useMoveEntries,
  usePublishMonth,
  useUncancelEntry,
  useUnpublishMonth,
} from "../mutations";
import { useMonth, useMonthsList, usePublishPreview } from "../queries";
import type { MonthDetail, PublishPreview } from "../types";

const MONTH = { year: 2026, month: 11 };
const MONTH_ID = "month-2026-11";

// The open month as the screen holds it, and as the server sends it after
// the write: one revision on, with the hearing moved to November 4.
const openMonth = monthDetail(MONTH);
const writtenEntry = {
  ...openMonth.entries[0],
  date: "2026-11-04",
  version: 2,
};
const writtenMonth: MonthDetail = {
  ...openMonth,
  revision: 2,
  entries: [writtenEntry],
};

const preview: PublishPreview = {
  monthId: MONTH_ID,
  year: 2026,
  month: 11,
  status: "DRAFT",
  revision: 1,
  counts: openMonth.counts,
  holidayWarnings: [],
  latestPublication: null,
};

/**
 * Renders hooks with the open month, the month list and the publish preview
 * already loaded and on screen, as the month screen would hold them. The
 * reads' fakes answer with the server's copy, and are cleared after the
 * first render, so a test sees only the fetches the write causes.
 */
function setup(
  writes: FakeCalendarProcedures,
  { serverMonth = openMonth }: { serverMonth?: MonthDetail } = {},
) {
  const reads = {
    "admin.months.get": vi.fn(() => serverMonth),
    "admin.months.list": vi.fn(() => monthListPage([monthSummary(MONTH)])),
    "admin.months.publishPreview": vi.fn(() => preview),
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const calendarTrpc = createFakeCalendarTrpc({
    procedures: { ...reads, ...writes },
    queryClient,
  });
  const { querier } = calendarTrpc;
  const reportError = vi.fn<(error: unknown) => void>();
  const host: ParoleBoardHost = createFakeHost({ calendarTrpc, reportError });
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <ParoleBoardHostProvider host={host}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ParoleBoardHostProvider>
    );
  }

  const monthKey = querier.admin.months.get.queryKey(MONTH);
  queryClient.setQueryData(monthKey, openMonth);
  queryClient.setQueryData(querier.admin.months.list.infiniteQueryKey({}), {
    pages: [monthListPage([monthSummary(MONTH)])],
    pageParams: [null],
  });
  queryClient.setQueryData(
    querier.admin.months.publishPreview.queryKey({ monthId: MONTH_ID }),
    preview,
  );

  /** Renders useWrite alongside the reads the month screen keeps mounted. */
  function renderWrite<T>(useWrite: () => T) {
    const rendered = renderHook(
      () => {
        useMonth(MONTH);
        useMonthsList({});
        usePublishPreview({ monthId: MONTH_ID });
        return useWrite();
      },
      { wrapper },
    );
    Object.values(reads).forEach((read) => read.mockClear());
    return rendered;
  }

  /** The keys of queries marked stale and not refetched. */
  const invalidatedKeys = () =>
    queryClient
      .getQueryCache()
      .getAll()
      .filter((query) => query.state.isInvalidated)
      .map((query) => query.queryKey);

  return {
    queryClient,
    querier,
    monthKey,
    reads,
    reportError,
    wrapper,
    renderWrite,
    invalidatedKeys,
  };
}

type Mutate = (input: unknown) => Promise<unknown>;

const MONTH_WRITES = [
  [
    "useAddEntry",
    useAddEntry,
    "admin.entries.add",
    {
      monthId: MONTH_ID,
      date: "2026-11-04",
      kindCode: "HEARING",
      resourceId: "resource-a",
    },
    { entry: writtenEntry, monthRevision: 2, month: writtenMonth },
  ],
  [
    "useDeleteEntry",
    useDeleteEntry,
    "admin.entries.delete",
    { entryId: "entry-1", expectedVersion: 1 },
    { deletedEntryId: "entry-1", monthRevision: 2, month: writtenMonth },
  ],
  [
    "useMoveEntries",
    useMoveEntries,
    "admin.entries.move",
    {
      entries: [{ entryId: "entry-1", expectedVersion: 1 }],
      newDate: "2026-11-04",
    },
    { entries: [writtenEntry], monthRevision: 2, month: writtenMonth },
  ],
  [
    "useCancelEntry",
    useCancelEntry,
    "admin.entries.cancel",
    { entryId: "entry-1", expectedVersion: 1 },
    { entry: writtenEntry, monthRevision: 2, month: writtenMonth },
  ],
  [
    "useUncancelEntry",
    useUncancelEntry,
    "admin.entries.uncancel",
    { entryId: "entry-1", expectedVersion: 1 },
    { entry: writtenEntry, monthRevision: 2, month: writtenMonth },
  ],
  [
    "usePublishMonth",
    usePublishMonth,
    "admin.months.publish",
    { monthId: MONTH_ID, expectedRevision: 1 },
    {
      monthId: MONTH_ID,
      status: "PUBLISHED",
      revision: 2,
      month: { ...writtenMonth, status: "PUBLISHED" },
    },
  ],
  [
    "useUnpublishMonth",
    useUnpublishMonth,
    "admin.months.unpublish",
    { monthId: MONTH_ID },
    {
      monthId: MONTH_ID,
      status: "DRAFT",
      revision: 2,
      month: writtenMonth,
    },
  ],
] as const;

describe("writes that return the month", () => {
  it.each(MONTH_WRITES)(
    "%s stores the month it returns, and refetches nothing",
    async (_, useWrite, path, input, output) => {
      const write = vi.fn(() => output);
      const { queryClient, monthKey, reads, renderWrite, invalidatedKeys } =
        setup({ [path]: write });
      const { result } = renderWrite(() => useWrite());

      await act(() => (result.current.mutateAsync as Mutate)(input));

      expect(write).toHaveBeenCalledWith(input);
      expect(queryClient.getQueryData(monthKey)).toEqual(output.month);
      expect(reads["admin.months.get"]).not.toHaveBeenCalled();
      expect(reads["admin.months.list"]).not.toHaveBeenCalled();
      expect(reads["admin.months.publishPreview"]).not.toHaveBeenCalled();
      expect(invalidatedKeys()).toEqual([]);
    },
  );

  it("drops a refetch of the month that was in flight when the write went out", async () => {
    let answerRefetch: (month: MonthDetail) => void = () => undefined;
    const { queryClient, monthKey, reads, renderWrite } = setup({
      "admin.entries.move": () => ({
        entries: [writtenEntry],
        monthRevision: 2,
        month: writtenMonth,
      }),
    });
    const { result } = renderWrite(() => useMoveEntries());
    reads["admin.months.get"].mockImplementationOnce(
      () =>
        new Promise<MonthDetail>((resolve) => {
          answerRefetch = resolve;
        }) as never,
    );

    void queryClient.refetchQueries({ queryKey: monthKey });
    await waitFor(() =>
      expect(reads["admin.months.get"]).toHaveBeenCalledTimes(1),
    );
    await act(() =>
      result.current.mutateAsync({
        entries: [{ entryId: "entry-1", expectedVersion: 1 }],
        newDate: "2026-11-04",
      }),
    );
    await act(async () => answerRefetch(openMonth));

    expect(queryClient.getQueryData(monthKey)).toEqual(writtenMonth);
  });

  it("lets another month's fetch finish while a write goes out", async () => {
    const DECEMBER = { year: 2026, month: 12 };
    const december = monthDetail(DECEMBER);
    let answerDecember: (month: MonthDetail) => void = () => undefined;
    const { queryClient, querier, reads, renderWrite } = setup({
      "admin.entries.move": () => ({
        entries: [writtenEntry],
        monthRevision: 2,
        month: writtenMonth,
      }),
    });
    const { result } = renderWrite(() => useMoveEntries());
    reads["admin.months.get"].mockImplementationOnce(
      () =>
        new Promise<MonthDetail>((resolve) => {
          answerDecember = resolve;
        }) as never,
    );

    const decemberFetch = queryClient.fetchQuery(
      querier.admin.months.get.queryOptions(DECEMBER),
    );
    await waitFor(() =>
      expect(reads["admin.months.get"]).toHaveBeenCalledTimes(1),
    );
    await act(() =>
      result.current.mutateAsync({
        entries: [{ entryId: "entry-1", expectedVersion: 1 }],
        newDate: "2026-11-04",
      }),
    );
    answerDecember(december);

    await expect(decemberFetch).resolves.toEqual(december);
    expect(
      queryClient.getQueryData(querier.admin.months.get.queryKey(DECEMBER)),
    ).toEqual(december);
  });

  it.each([
    "CONFLICT",
    "NOT_FOUND",
    "PRECONDITION_FAILED",
    "INTERNAL_SERVER_ERROR",
  ] as const)(
    "refetches the open month after a %s, before the write's promise rejects",
    async (code) => {
      const serverMonth: MonthDetail = { ...openMonth, revision: 5 };
      let answerRefetch: (month: MonthDetail) => void = () => undefined;
      const { queryClient, monthKey, reads, renderWrite } = setup({
        "admin.entries.move": () => {
          throw calendarApiError(code, "This hearing was just changed.");
        },
      });
      const { result } = renderWrite(() => useMoveEntries());
      reads["admin.months.get"].mockImplementationOnce(
        () =>
          new Promise<MonthDetail>((resolve) => {
            answerRefetch = resolve;
          }) as never,
      );

      let settled = false;
      const write = result.current
        .mutateAsync({
          entries: [{ entryId: "entry-1", expectedVersion: 1 }],
          newDate: "2026-11-04",
        })
        .catch(() => undefined)
        .finally(() => {
          settled = true;
        });
      await waitFor(() =>
        expect(reads["admin.months.get"]).toHaveBeenCalledTimes(1),
      );
      expect(settled).toBe(false);
      answerRefetch(serverMonth);
      await act(() => write);

      expect(queryClient.getQueryData(monthKey)).toEqual(serverMonth);
      expect(reads["admin.months.list"]).not.toHaveBeenCalled();
    },
  );

  it("refetches nothing after a BAD_REQUEST, since the server changed nothing", async () => {
    const { reads, renderWrite, invalidatedKeys } = setup({
      "admin.entries.add": () => {
        throw calendarApiError("BAD_REQUEST", "Pick a day in November 2026.");
      },
    });
    const { result } = renderWrite(() => useAddEntry());

    await act(() =>
      result.current
        .mutateAsync({
          monthId: MONTH_ID,
          date: "2026-12-01",
          kindCode: "HEARING",
          resourceId: "resource-a",
        })
        .catch(() => undefined),
    );

    expect(reads["admin.months.get"]).not.toHaveBeenCalled();
    expect(invalidatedKeys()).toEqual([]);
  });

  it.each([
    ["CONFLICT", 1],
    ["PRECONDITION_FAILED", 0],
  ] as const)(
    "refetches the publish preview after a publish %s only when it's CONFLICT",
    async (code: CalendarErrorCode, previewFetches) => {
      const { reads, renderWrite } = setup({
        "admin.months.publish": () => {
          throw calendarApiError(
            code,
            "This month changed since you reviewed it.",
          );
        },
      });
      const { result } = renderWrite(() => usePublishMonth());

      await act(() =>
        result.current
          .mutateAsync({ monthId: MONTH_ID, expectedRevision: 1 })
          .catch(() => undefined),
      );

      expect(reads["admin.months.publishPreview"]).toHaveBeenCalledTimes(
        previewFetches,
      );
      expect(reads["admin.months.get"]).toHaveBeenCalledTimes(1);
    },
  );

  it("leaves an error written for editors for the screen to show, without reporting it", async () => {
    const { reportError, renderWrite } = setup({
      "admin.entries.add": () => {
        throw calendarApiError(
          "PRECONDITION_FAILED",
          "November 2026 is published. Click Edit month to change it.",
        );
      },
    });
    const { result } = renderWrite(() => useAddEntry());

    await act(() =>
      result.current
        .mutateAsync({
          monthId: MONTH_ID,
          date: "2026-11-03",
          kindCode: "HEARING",
          resourceId: "resource-a",
        })
        .catch(() => undefined),
    );

    await waitFor(() =>
      expect(result.current.error?.message).toBe(
        "November 2026 is published. Click Edit month to change it.",
      ),
    );
    expect(reportError).not.toHaveBeenCalled();
  });

  it("reports an error the server didn't write for editors", async () => {
    const error = calendarApiError("INTERNAL_SERVER_ERROR", "db down");
    const { reportError, renderWrite } = setup({
      "admin.entries.delete": () => {
        throw error;
      },
    });
    const { result } = renderWrite(() => useDeleteEntry());

    await act(() =>
      result.current
        .mutateAsync({ entryId: "entry-1", expectedVersion: 1 })
        .catch(() => undefined),
    );

    expect(reportError).toHaveBeenCalledWith(error);
  });
});

describe("useCreateMonths", () => {
  const DECEMBER = { year: 2026, month: 12 };

  it("marks the lists, Add month's choices and each created month stale, and no other month", async () => {
    const { queryClient, querier, wrapper, invalidatedKeys } = setup({
      "admin.months.create": () => ({
        created: [
          { id: "month-2026-12", ...DECEMBER, entryCount: 30, notices: [] },
        ],
      }),
    });
    const decemberKey = querier.admin.months.get.queryKey(DECEMBER);
    const addOptionsKey = querier.admin.months.addOptions.queryKey();
    queryClient.setQueryData(decemberKey, null);
    queryClient.setQueryData(addOptionsKey, [DECEMBER]);
    const { result } = renderHook(() => useCreateMonths(), { wrapper });

    await act(() => result.current.mutateAsync({ months: [DECEMBER] }));

    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([
        querier.admin.months.list.infiniteQueryKey({}),
        addOptionsKey,
        decemberKey,
      ]),
    );
    expect(invalidatedKeys()).toHaveLength(3);
  });

  it("marks the lists and Add month's choices stale after a CONFLICT", async () => {
    const { queryClient, querier, wrapper, invalidatedKeys, reportError } =
      setup({
        "admin.months.create": () => {
          throw calendarApiError(
            "CONFLICT",
            "December 2026 already exists. Refresh to see it.",
          );
        },
      });
    const addOptionsKey = querier.admin.months.addOptions.queryKey();
    queryClient.setQueryData(addOptionsKey, [DECEMBER]);
    const { result } = renderHook(() => useCreateMonths(), { wrapper });

    await act(() =>
      result.current.mutateAsync({ months: [DECEMBER] }).catch(() => undefined),
    );

    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([
        querier.admin.months.list.infiniteQueryKey({}),
        addOptionsKey,
      ]),
    );
    expect(invalidatedKeys()).toHaveLength(2);
    expect(reportError).not.toHaveBeenCalled();
  });
});
