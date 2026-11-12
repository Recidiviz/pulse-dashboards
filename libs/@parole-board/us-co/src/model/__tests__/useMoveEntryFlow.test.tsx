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

import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import toast from "react-hot-toast";

import type { EntryDto, MonthDetail } from "~@parole-board/common";
import {
  ParoleBoardHostProvider,
  useCalendarConfig,
  useMoveEntries,
} from "~@parole-board/common";
import {
  calendarApiError,
  queryResult,
  september2026Config,
  september2026MonthDetail,
} from "~@parole-board/common/fixtures";
import { createFakeHost } from "~@parole-board/common/testing";

import {
  alreadyOnByDay,
  dayDelta,
  duplicateOnDay,
  MOVE_TOAST_ID,
  type MoveMethod,
  placeEntriesOn,
  useMoveEntryFlow,
} from "../useMoveEntryFlow";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("~@parole-board/common", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~@parole-board/common")>()),
  useCalendarConfig: vi.fn(),
  useMoveEntries: vi.fn(),
}));

const entryById = (id: string): EntryDto => {
  const entry = september2026MonthDetail.entries.find((e) => e.id === id);
  if (!entry) throw new Error(`No fixture entry ${id}`);
  return entry;
};
const fcf14 = entryById("2026-09-14:HEARING:FCF");
const ccf15 = { ...entryById("2026-09-15:HEARING:CCF"), version: 4 };
const ccf16 = entryById("2026-09-16:HEARING:CCF");
const avcf17 = entryById("2026-09-17:HEARING:AVCF");
const fullBoard11 = entryById("2026-09-11:FULL_BOARD:Full Board");
const fullBoard18 = entryById("2026-09-18:FULL_BOARD:Full Board");

const month = {
  ...september2026MonthDetail,
  entries: september2026MonthDetail.entries.map((entry) =>
    entry.id === ccf15.id ? ccf15 : entry,
  ),
};

let mutateAsync: ReturnType<typeof vi.fn>;

function renderFlow() {
  const host = createFakeHost();
  const track = vi.spyOn(
    host.analyticsStore,
    "trackPbPublicCalendarHearingMoved",
  );
  const clearSelection = vi.fn();
  const { result, rerender, unmount } = renderHook(
    ({ shown }: { shown: MonthDetail }) =>
      useMoveEntryFlow({ month: shown, clearSelection }),
    {
      initialProps: { shown: month },
      wrapper: ({ children }: { children: ReactNode }) => (
        <ParoleBoardHostProvider host={host}>
          {children}
        </ParoleBoardHostProvider>
      ),
    },
  );
  const move = (targets: EntryDto[], date: string, method: MoveMethod) =>
    act(() => result.current.move(targets, date, method));
  /** Starts a move without waiting for it, and returns its outcome. */
  const startMove = (targets: EntryDto[], date: string, method: MoveMethod) => {
    let outcome: ReturnType<typeof result.current.move> | undefined;
    act(() => {
      outcome = result.current.move(targets, date, method);
    });
    return outcome as ReturnType<typeof result.current.move>;
  };
  /** Shows month as the month the page now reads, as after a refetch. */
  const showMonth = (shown: MonthDetail) => rerender({ shown });
  return {
    result,
    move,
    startMove,
    showMonth,
    unmount,
    track,
    clearSelection,
  };
}

/** A promise for mutateAsync to return, settled by the test. */
function deferred() {
  let resolve: (value: unknown) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const labelsOn = (entries: readonly EntryDto[], date: string) =>
  entries.filter((entry) => entry.date === date).map(({ label }) => label);

/** month with each entry of ids on date, as the server would return it. */
const movedMonth = (ids: string[], date: string): MonthDetail => ({
  ...month,
  revision: month.revision + 1,
  entries: placeEntriesOn(month.entries, new Set(ids), date, {
    kinds: september2026Config.kinds,
    resources: september2026Config.resources,
  }).map((entry) =>
    ids.includes(entry.id) ? { ...entry, version: entry.version + 1 } : entry,
  ),
});

beforeEach(() => {
  vi.mocked(toast).mockClear();
  vi.mocked(toast.error).mockClear();
  mutateAsync = vi.fn(() => Promise.resolve({ ok: true }));
  vi.mocked(useCalendarConfig).mockReturnValue(
    queryResult(september2026Config) as ReturnType<typeof useCalendarConfig>,
  );
  vi.mocked(useMoveEntries).mockReturnValue({
    isPending: false,
    mutateAsync,
  } as unknown as ReturnType<typeof useMoveEntries>);
});

describe("useMoveEntryFlow", () => {
  test("a drop sends one move with the entry's version, then tracks, toasts and clears the selection", async () => {
    const { move, track, clearSelection } = renderFlow();

    const outcome = await move([ccf15], "2026-09-21", "drag");

    expect(outcome).toEqual({ status: "moved" });
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith({
      entries: [{ entryId: ccf15.id, expectedVersion: 4 }],
      newDate: "2026-09-21",
    });
    expect(track).toHaveBeenCalledExactlyOnceWith({
      year: 2026,
      month: 9,
      kind: "HEARING",
      method: "drag",
      dayDelta: 6,
    });
    expect(toast).toHaveBeenCalledWith("Moved CCF to September 21", {
      id: MOVE_TOAST_ID,
    });
    expect(clearSelection).toHaveBeenCalled();
  });

  test("a drop of three selected hearings sends one move with all three and tracks each", async () => {
    const { move, track } = renderFlow();

    await move([fcf14, ccf15, avcf17], "2026-09-21", "drag");

    expect(mutateAsync).toHaveBeenCalledExactlyOnceWith({
      entries: [
        { entryId: fcf14.id, expectedVersion: 1 },
        { entryId: ccf15.id, expectedVersion: 4 },
        { entryId: avcf17.id, expectedVersion: 1 },
      ],
      newDate: "2026-09-21",
    });
    expect(track.mock.calls.map(([metadata]) => metadata.dayDelta)).toEqual([
      7, 6, 4,
    ]);
    expect(toast).toHaveBeenCalledWith("Moved 3 hearings to September 21", {
      id: MOVE_TOAST_ID,
    });
  });

  test("a meeting moves with its own kind", async () => {
    const { move, track } = renderFlow();

    await move([fullBoard11], "2026-09-10", "drag");

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "FULL_BOARD", dayDelta: -1 }),
    );
  });

  test("a drop onto a day that already has the facility sends nothing and toasts the duplicate", async () => {
    const { move, track, clearSelection } = renderFlow();

    const outcome = await move([ccf15], "2026-09-16", "drag");

    expect(outcome).toEqual({ status: "blocked" });
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      "CCF is already on September 16.",
      { id: MOVE_TOAST_ID },
    );
    expect(track).not.toHaveBeenCalled();
    expect(clearSelection).not.toHaveBeenCalled();
  });

  test("a drop of several hearings sends nothing when one would duplicate a slot on the day", async () => {
    const { move } = renderFlow();

    await move([fcf14, ccf15, avcf17], "2026-09-16", "drag");

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "CCF is already on September 16.",
      { id: MOVE_TOAST_ID },
    );
  });

  test("two moving hearings for one facility can't land on the same day", async () => {
    const { move } = renderFlow();

    const outcome = await move([ccf15, ccf16], "2026-09-21", "drag");

    expect(outcome).toEqual({ status: "blocked" });
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      "Only one CCF can be on September 21.",
      { id: MOVE_TOAST_ID },
    );
  });

  test("a CONFLICT toasts the server's message once and moves nothing", async () => {
    mutateAsync.mockRejectedValue(
      calendarApiError(
        "CONFLICT",
        "Someone else changed this entry. Refresh to see the latest calendar, then try again.",
      ),
    );
    const { move, track, clearSelection } = renderFlow();

    const outcome = await move([ccf15], "2026-09-21", "drag");

    expect(outcome).toEqual({ status: "failed" });
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      "Someone else changed this entry. Refresh to see the latest calendar, then try again.",
      { id: MOVE_TOAST_ID },
    );
    expect(toast).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
    expect(clearSelection).not.toHaveBeenCalled();
  });

  test("a drag on a month another tab has published toasts the server's message", async () => {
    mutateAsync.mockRejectedValue(
      calendarApiError(
        "PRECONDITION_FAILED",
        "September 2026 is published. Click Edit month to change it.",
      ),
    );
    const { move, track, clearSelection } = renderFlow();

    const outcome = await move([ccf15], "2026-09-21", "drag");

    expect(outcome).toEqual({ status: "failed" });
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      "September 2026 is published. Click Edit month to change it.",
      { id: MOVE_TOAST_ID },
    );
    expect(track).not.toHaveBeenCalled();
    expect(clearSelection).not.toHaveBeenCalled();
  });

  test("the server's duplicate message from two editors at once reaches the toast", async () => {
    mutateAsync.mockRejectedValue(
      calendarApiError("CONFLICT", "CCF is already on September 17."),
    );
    const { move } = renderFlow();

    await move([ccf15], "2026-09-17", "drag");

    expect(toast.error).toHaveBeenCalledWith(
      "CCF is already on September 17.",
      { id: MOVE_TOAST_ID },
    );
  });

  test("Move to… tracks move_to and keeps the selection", async () => {
    const { move, track, clearSelection } = renderFlow();

    await move([ccf15], "2026-09-21", "move_to");

    expect(track).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ method: "move_to", dayDelta: 6 }),
    );
    expect(clearSelection).not.toHaveBeenCalled();
  });

  test("a throw from the analytics after a move still counts as moved", async () => {
    const { move, track } = renderFlow();
    track.mockImplementation(() => {
      throw new Error("analytics down");
    });

    const outcome = await move([ccf15], "2026-09-21", "move_to");

    expect(outcome).toEqual({ status: "moved" });
    expect(toast).toHaveBeenCalledWith("Moved CCF to September 21", {
      id: MOVE_TOAST_ID,
    });
  });

  test("Move to… throws a failure trying again might fix, for the dialog to show, with no toast", async () => {
    const error = calendarApiError("INTERNAL_SERVER_ERROR", "db down");
    mutateAsync.mockRejectedValue(error);
    const { move, track } = renderFlow();

    await expect(move([ccf15], "2026-09-21", "move_to")).rejects.toBe(error);

    expect(toast.error).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  test.each(["CONFLICT", "NOT_FOUND", "PRECONDITION_FAILED"] as const)(
    "Move to… toasts the server's message for %s",
    async (code) => {
      mutateAsync.mockRejectedValue(calendarApiError(code, "Server says no."));
      const { move } = renderFlow();

      const outcome = await move([ccf15], "2026-09-21", "move_to");

      expect(outcome).toEqual({ status: "failed" });
      expect(toast.error).toHaveBeenCalledWith("Server says no.", {
        id: MOVE_TOAST_ID,
      });
    },
  );

  test("sends nothing while a move is running", async () => {
    vi.mocked(useMoveEntries).mockReturnValue({
      isPending: true,
      mutateAsync,
    } as unknown as ReturnType<typeof useMoveEntries>);
    const { move } = renderFlow();

    expect(await move([ccf15], "2026-09-21", "drag")).toEqual({
      status: "blocked",
    });
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});

describe("useMoveEntryFlow while a drag saves", () => {
  test("shows the entries on the target day in the server's order, and marks them and their days busy", () => {
    mutateAsync.mockReturnValue(deferred().promise);
    const { result, startMove } = renderFlow();

    startMove([fcf14, ccf15], "2026-09-18", "drag");

    // Hearings before Full Board, and CCF before FCF in resource order.
    expect(labelsOn(result.current.entries, "2026-09-18")).toEqual([
      "CCF",
      "FCF",
      "Full Board",
    ]);
    expect(labelsOn(result.current.entries, "2026-09-15")).toEqual(["SCF"]);
    expect([...result.current.busyEntryIds]).toEqual([fcf14.id, ccf15.id]);
    expect([...result.current.busyDates].sort()).toEqual([
      "2026-09-14",
      "2026-09-15",
      "2026-09-18",
    ]);
    expect(result.current.pendingStatus).toBe(
      "Moving FCF and CCF to September 18…",
    );
    expect(result.current.entries).toHaveLength(month.entries.length);
  });

  test("on success, the server's month stays, with nothing busy", async () => {
    const request = deferred();
    mutateAsync.mockReturnValue(request.promise);
    const { result, startMove, showMonth } = renderFlow();
    const saved = movedMonth([ccf15.id], "2026-09-21");

    const outcome = startMove([ccf15], "2026-09-21", "drag");
    // useMoveEntries caches the server's month before mutateAsync resolves.
    showMonth(saved);
    await act(async () => {
      request.resolve({ month: saved });
      await outcome;
    });

    await waitFor(() => expect(result.current.busyEntryIds.size).toBe(0));
    expect(result.current.entries).toBe(saved.entries);
    expect(result.current.busyDates.size).toBe(0);
    expect(result.current.pendingStatus).toBe("");
  });

  test("on BAD_REQUEST, the entries go back to their days", async () => {
    const request = deferred();
    mutateAsync.mockReturnValue(request.promise);
    const { result, startMove } = renderFlow();

    const outcome = startMove([ccf15], "2026-09-21", "drag");
    expect(labelsOn(result.current.entries, "2026-09-21")).toContain("CCF");
    await act(async () => {
      request.reject(calendarApiError("BAD_REQUEST", "Not a weekday."));
      await outcome;
    });

    await waitFor(() => expect(result.current.busyEntryIds.size).toBe(0));
    expect(result.current.entries).toBe(month.entries);
    expect(labelsOn(result.current.entries, "2026-09-15")).toContain("CCF");
    expect(toast.error).toHaveBeenCalledWith("Not a weekday.", {
      id: MOVE_TOAST_ID,
    });
  });

  test("on a network error, the entries go back to their days", async () => {
    const request = deferred();
    mutateAsync.mockReturnValue(request.promise);
    const { result, startMove } = renderFlow();

    const outcome = startMove([ccf15], "2026-09-21", "drag");
    await act(async () => {
      request.reject(new Error("Failed to fetch"));
      await outcome;
    });

    await waitFor(() => expect(result.current.busyEntryIds.size).toBe(0));
    expect(result.current.entries).toBe(month.entries);
  });

  test("on CONFLICT, the refetched month shows", async () => {
    const request = deferred();
    mutateAsync.mockReturnValue(request.promise);
    const { result, startMove, showMonth } = renderFlow();
    // Another editor moved CCF to the 17th first.
    const refetched = movedMonth([ccf15.id], "2026-09-17");

    const outcome = startMove([ccf15], "2026-09-21", "drag");
    // useMoveEntries refetches the month before mutateAsync rejects.
    showMonth(refetched);
    await act(async () => {
      request.reject(calendarApiError("CONFLICT", "Someone else changed it."));
      await outcome;
    });

    await waitFor(() => expect(result.current.busyEntryIds.size).toBe(0));
    expect(result.current.entries).toBe(refetched.entries);
    expect(labelsOn(result.current.entries, "2026-09-17")).toContain("CCF");
  });

  test("Move to… marks nothing busy and leaves the entries where they are", () => {
    mutateAsync.mockReturnValue(deferred().promise);
    const { result, startMove } = renderFlow();

    startMove([ccf15], "2026-09-21", "move_to");

    expect(mutateAsync).toHaveBeenCalledOnce();
    expect(result.current.entries).toBe(month.entries);
    expect(result.current.busyEntryIds.size).toBe(0);
    expect(result.current.busyDates.size).toBe(0);
    expect(result.current.pendingStatus).toBe("");
  });

  test("a blocked drag marks nothing busy", async () => {
    const { result, move } = renderFlow();

    await move([ccf15], "2026-09-16", "drag");

    expect(result.current.busyEntryIds.size).toBe(0);
    expect(result.current.entries).toBe(month.entries);
  });

  test("unmounting while a drag saves still lands its outcome, and a new page starts with nothing busy", async () => {
    const request = deferred();
    mutateAsync.mockReturnValue(request.promise);
    const first = renderFlow();
    const outcome = first.startMove([ccf15], "2026-09-21", "drag");

    first.unmount();
    request.resolve({ month });

    expect(await outcome).toEqual({ status: "moved" });
    expect(renderFlow().result.current.busyEntryIds.size).toBe(0);
  });
});

describe("placeEntriesOn", () => {
  const config = {
    kinds: september2026Config.kinds,
    resources: september2026Config.resources,
  };

  test("keeps every other day's order", () => {
    const placed = placeEntriesOn(
      month.entries,
      new Set([ccf15.id]),
      "2026-09-18",
      config,
    );
    const others = (entries: readonly EntryDto[]) =>
      entries
        .filter((entry) => entry.id !== ccf15.id && entry.date !== "2026-09-18")
        .map(({ id }) => id);
    expect(others(placed)).toEqual(others(month.entries));
    expect(placed.map(({ date }) => date)).toEqual(
      [...placed.map(({ date }) => date)].sort(),
    );
  });

  test("puts an entry whose resource config.get doesn't list after the rest of its kind", () => {
    const retired = {
      ...fcf14,
      id: "retired",
      resource: fcf14.resource && { ...fcf14.resource, id: "inactive" },
    };
    const placed = placeEntriesOn(
      [...month.entries, retired],
      new Set([retired.id, ccf15.id]),
      "2026-09-18",
      config,
    );
    expect(
      placed.filter((entry) => entry.date === "2026-09-18").map(({ id }) => id),
    ).toEqual([ccf15.id, "retired", fullBoard18.id]);
  });
});

describe("alreadyOnByDay", () => {
  test("lists the days where another entry holds a moving entry's slot", () => {
    expect(alreadyOnByDay(month.entries, [ccf15])).toEqual({
      "2026-09-16": ["CCF"],
    });
  });

  test("counts cancelled entries, since the slot key covers them too", () => {
    const cancelled = { ...ccf16, cancelled: true };
    expect(alreadyOnByDay([ccf15, cancelled], [ccf15])).toEqual({
      "2026-09-16": ["CCF"],
    });
  });
});

describe("duplicateOnDay", () => {
  test("names an entry whose slot another entry on the day already holds", () => {
    expect(duplicateOnDay(month.entries, [ccf15], "2026-09-16")).toEqual({
      label: "CCF",
      kind: "existing",
    });
  });

  test("names an entry whose slot another moving entry would take", () => {
    expect(duplicateOnDay(month.entries, [ccf15, ccf16], "2026-09-21")).toEqual(
      { label: "CCF", kind: "moving" },
    );
  });

  test("gives nothing when every moving entry can go", () => {
    expect(
      duplicateOnDay(month.entries, [fcf14, ccf15], "2026-09-21"),
    ).toBeUndefined();
  });
});

describe("dayDelta", () => {
  test.each([
    ["2026-09-15", "2026-09-21", 6],
    ["2026-09-21", "2026-09-15", -6],
    // Across the start of daylight saving time in Colorado.
    ["2027-03-01", "2027-03-31", 30],
  ])("from %s to %s is %i days", (from, to, days) => {
    expect(dayDelta(from, to)).toBe(days);
  });
});
