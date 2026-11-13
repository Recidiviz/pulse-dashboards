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

import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode, Suspense } from "react";

import {
  calendarApiError,
  publicDecember2026,
} from "~@parole-board/common/fixtures";

import { createTestServices } from "../../__tests__/testUtils";
import { PublicCalendarServicesProvider } from "../../services";
import {
  PUBLIC_MONTH_REFETCH_INTERVAL,
  publicMonthQueryOptions,
  usePublicMonth,
} from "../usePublicMonth";

const notFound = () => calendarApiError("NOT_FOUND", "Month not found");

function renderUsePublicMonth(
  services: ReturnType<typeof createTestServices>,
  month?: string,
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PublicCalendarServicesProvider services={services}>
      <QueryClientProvider client={services.trpc.queryClient}>
        <Suspense fallback={null}>{children}</Suspense>
      </QueryClientProvider>
    </PublicCalendarServicesProvider>
  );
  return renderHook(() => usePublicMonth(month), { wrapper });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("publicMonthQueryOptions", () => {
  test("polls every minute and on window focus", () => {
    const { trpc } = createTestServices(() => publicDecember2026);
    const options = publicMonthQueryOptions(trpc, "2026-12");
    expect(options.refetchInterval).toBe(60_000);
    expect(options.refetchOnWindowFocus).toBe(true);
  });

  test("retries other errors but not NOT_FOUND", () => {
    const { trpc } = createTestServices(() => publicDecember2026);
    const { retry } = publicMonthQueryOptions(trpc, "2026-12");
    if (typeof retry !== "function") throw new Error("retry isn't a function");
    expect(retry(0, notFound())).toBe(false);
    expect(retry(0, calendarApiError("INTERNAL_SERVER_ERROR", "Boom"))).toBe(
      true,
    );
    expect(retry(3, calendarApiError("INTERNAL_SERVER_ERROR", "Boom"))).toBe(
      false,
    );
  });
});

describe("usePublicMonth", () => {
  test("asks for the named month and returns it as ready", async () => {
    const services = createTestServices(() => publicDecember2026);
    const { result } = renderUsePublicMonth(services, "2026-12");
    await waitFor(() =>
      expect(result.current?.data).toEqual({
        status: "ready",
        month: publicDecember2026,
      }),
    );
    expect(services.getMonth).toHaveBeenCalledWith({ month: "2026-12" });
    expect(result.current.error).toBeNull();
  });

  test("asks with no month for the landing page", async () => {
    const services = createTestServices(() => null);
    const { result } = renderUsePublicMonth(services);
    await waitFor(() =>
      expect(result.current?.data).toEqual({ status: "ready", month: null }),
    );
    expect(services.getMonth).toHaveBeenCalledWith({});
  });

  test("returns the landing read's notPublishedYet as the server sent it", async () => {
    const landed = { ...publicDecember2026, notPublishedYet: "November 2026" };
    const services = createTestServices(() => landed);
    const { result } = renderUsePublicMonth(services);
    await waitFor(() =>
      expect(result.current?.data).toEqual({ status: "ready", month: landed }),
    );
  });

  test("maps NOT_FOUND on the first load to unavailable, without retrying", async () => {
    const services = createTestServices(() => {
      throw notFound();
    });
    const { result } = renderUsePublicMonth(services, "2026-08");
    await waitFor(() =>
      expect(result.current?.data).toEqual({
        status: "unavailable",
        month: null,
      }),
    );
    expect(services.getMonth).toHaveBeenCalledTimes(1);
    expect(result.current.noLongerLive).toBe(false);
  });

  test("keeps the month and returns the error when a poll gets NOT_FOUND", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let published = true;
    const services = createTestServices(() => {
      if (published) return publicDecember2026;
      throw notFound();
    });
    const { result } = renderUsePublicMonth(services, "2026-12");
    await waitFor(() => expect(result.current?.data.status).toBe("ready"));

    published = false;
    await act(() => vi.advanceTimersByTimeAsync(PUBLIC_MONTH_REFETCH_INTERVAL));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.data).toEqual({
      status: "ready",
      month: publicDecember2026,
    });
    expect(result.current.noLongerLive).toBe(true);
    // One load and one poll: NOT_FOUND isn't retried.
    expect(services.getMonth).toHaveBeenCalledTimes(2);
  });

  test("stays unavailable without an error when a poll gets NOT_FOUND again", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const services = createTestServices(() => {
      throw notFound();
    });
    const { result } = renderUsePublicMonth(services, "2026-08");
    await waitFor(() =>
      expect(result.current?.data.status).toBe("unavailable"),
    );

    await act(() => vi.advanceTimersByTimeAsync(PUBLIC_MONTH_REFETCH_INTERVAL));

    await waitFor(() => expect(services.getMonth).toHaveBeenCalledTimes(2));
    expect(result.current.data).toEqual({ status: "unavailable", month: null });
    expect(result.current.error).toBeNull();
  });

  test("keeps polling while no longer live, and clears it with the next month", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let current: unknown = publicDecember2026;
    const services = createTestServices(() => {
      if (current instanceof Error) throw current;
      return current;
    });
    const { result } = renderUsePublicMonth(services, "2026-12");
    await waitFor(() => expect(result.current?.data.status).toBe("ready"));

    current = notFound();
    await act(() => vi.advanceTimersByTimeAsync(PUBLIC_MONTH_REFETCH_INTERVAL));
    await waitFor(() => expect(result.current.noLongerLive).toBe(true));

    // Republished with a change: December 1 no longer has sessions.
    const republished = {
      ...publicDecember2026,
      days: publicDecember2026.days.map((day, i) =>
        i === 0 ? { ...day, entries: [] } : day,
      ),
    };
    current = republished;
    await act(() => vi.advanceTimersByTimeAsync(PUBLIC_MONTH_REFETCH_INTERVAL));
    await waitFor(() => expect(result.current.noLongerLive).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual({
      status: "ready",
      month: republished,
    });
    expect(services.getMonth).toHaveBeenCalledTimes(3);
  });

  test("isn't no longer live when another error follows a loaded month", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let failing = false;
    const services = createTestServices(() => {
      if (failing) throw calendarApiError("INTERNAL_SERVER_ERROR", "Boom");
      return publicDecember2026;
    });
    const { result } = renderUsePublicMonth(services, "2026-12");
    await waitFor(() => expect(result.current?.data.status).toBe("ready"));

    failing = true;
    // A poll, then React Query's three retries, 1, 2 and 4 seconds apart.
    await act(() =>
      vi.advanceTimersByTimeAsync(PUBLIC_MONTH_REFETCH_INTERVAL + 8_000),
    );
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.noLongerLive).toBe(false);
  });

  test("polls again after a minute", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const services = createTestServices(() => publicDecember2026);
    const { result } = renderUsePublicMonth(services, "2026-12");
    await waitFor(() => expect(result.current?.data.status).toBe("ready"));
    expect(services.getMonth).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(PUBLIC_MONTH_REFETCH_INTERVAL));
    await waitFor(() => expect(services.getMonth).toHaveBeenCalledTimes(2));
  });
});
