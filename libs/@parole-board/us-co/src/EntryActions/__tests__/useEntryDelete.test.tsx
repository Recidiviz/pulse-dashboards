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

import { act, fireEvent, render, screen } from "@testing-library/react";
import { ReactNode, useRef } from "react";
import toast from "react-hot-toast";

import type { EntryDto } from "~@parole-board/common";
import { ParoleBoardHostProvider, useDeleteEntry } from "~@parole-board/common";
import {
  calendarApiError,
  september2026MonthDetail,
} from "~@parole-board/common/fixtures";
import { createFakeHost } from "~@parole-board/common/testing";

import { EntryActions } from "../EntryActions";
import { DELETE_FAILED_MESSAGE, useEntryDelete } from "../useEntryDelete";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("~@parole-board/common", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~@parole-board/common")>()),
  useDeleteEntry: vi.fn(),
}));

const SEPTEMBER = { year: 2026, month: 9 };
const DELETE_NAME = "Delete hearing: FCF on September 14";

const entryById = (id: string): EntryDto => {
  const entry = september2026MonthDetail.entries.find((e) => e.id === id);
  if (!entry) throw new Error(`No fixture entry ${id}`);
  return entry;
};
const fcf14 = entryById("2026-09-14:HEARING:FCF");
const fullBoard11 = entryById("2026-09-11:FULL_BOARD:Full Board");
// What entries.delete returns: the month without the deleted entry.
const septemberWithoutFcf14 = {
  ...september2026MonthDetail,
  entries: september2026MonthDetail.entries.filter((e) => e.id !== fcf14.id),
};

/** How the test settles the request that's running. */
type Request = {
  succeed: () => void;
  fail: (error: unknown) => void;
};

/** useDeleteEntry's result, which each test drives by hand. */
let mutation: { isPending: boolean; mutateAsync: ReturnType<typeof vi.fn> };
let request: Request;

function Harness({
  selected,
  clearSelection,
}: {
  selected: EntryDto | null;
  clearSelection: () => void;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const props = useEntryDelete({
    month: SEPTEMBER,
    selected,
    clearSelection,
    focusTitle: () => titleRef.current?.focus(),
  });
  return (
    <>
      <h1 ref={titleRef} tabIndex={-1}>
        September 2026
      </h1>
      {selected && props && (
        <EntryActions label={selected.label} date={selected.date} {...props} />
      )}
    </>
  );
}

function renderHarness(selected: EntryDto | null = fcf14) {
  const host = createFakeHost();
  const track = vi.spyOn(
    host.analyticsStore,
    "trackPbPublicCalendarHearingDeleted",
  );
  const clearSelection = vi.fn();
  const view = render(
    <Harness selected={selected} clearSelection={clearSelection} />,
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ParoleBoardHostProvider host={host}>
          {children}
        </ParoleBoardHostProvider>
      ),
    },
  );
  const select = (entry: EntryDto | null) =>
    view.rerender(<Harness selected={entry} clearSelection={clearSelection} />);
  return { ...view, track, clearSelection, select };
}

const title = () => screen.getByRole("heading", { name: "September 2026" });

/** Opens the question and clicks Delete. */
function confirmDelete() {
  fireEvent.click(screen.getByRole("button", { name: DELETE_NAME }));
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
}

/** Marks the request as running, as useDeleteEntry would, and rerenders. */
function startRequest(rerender: () => void) {
  mutation = { ...mutation, isPending: true };
  rerender();
}

/**
 * Finishes the request as useDeleteEntry does: the month the server returned,
 * or the month's refetch after a failure, renders first (rerender), then the
 * request settles with outcome.
 */
async function settle(rerender: () => void, outcome: (r: Request) => void) {
  mutation = { ...mutation, isPending: false };
  rerender();
  await act(async () => outcome(request));
}

beforeEach(() => {
  vi.mocked(toast).mockClear();
  vi.mocked(toast.error).mockClear();
  mutation = {
    isPending: false,
    mutateAsync: vi.fn(
      () =>
        new Promise((resolve, reject) => {
          request = {
            succeed: () => resolve({ month: septemberWithoutFcf14 }),
            fail: reject,
          };
        }),
    ),
  };
  vi.mocked(useDeleteEntry).mockImplementation(
    () => mutation as unknown as ReturnType<typeof useDeleteEntry>,
  );
});

describe("useEntryDelete", () => {
  test("Delete hearing opens the question and sends nothing", () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: DELETE_NAME }));

    expect(
      screen.getByRole("group", { name: "Delete FCF from September 14?" }),
    ).toBeInTheDocument();
    expect(mutation.mutateAsync).not.toHaveBeenCalled();
  });

  test("Cancel and Escape close the question without a request", () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: DELETE_NAME }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: DELETE_NAME })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: DELETE_NAME }));
    fireEvent.keyDown(screen.getByRole("group"), { key: "Escape" });

    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(mutation.mutateAsync).not.toHaveBeenCalled();
  });

  test("Delete sends the version seen when the question opened, even after a refetch changed it", () => {
    const { select } = renderHarness();

    fireEvent.click(screen.getByRole("button", { name: DELETE_NAME }));
    select({ ...fcf14, version: 2 });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(mutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutation.mutateAsync.mock.lastCall?.[0]).toEqual({
      entryId: fcf14.id,
      expectedVersion: 1,
    });
  });

  test("while the request runs, Cancel is disabled and Escape keeps the question open", () => {
    const { select } = renderHarness();
    confirmDelete();
    startRequest(() => select(fcf14));

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("group"), { key: "Escape" });

    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  test("success sends the analytics event once, toasts, clears the selection and focuses the title", async () => {
    const { select, track, clearSelection } = renderHarness();
    confirmDelete();
    startRequest(() => select(fcf14));
    expect(track).not.toHaveBeenCalled();

    // The returned month has removed the entry, and the selection with it,
    // by the time the request settles.
    await settle(
      () => select(null),
      (r) => r.succeed(),
    );

    expect(track).toHaveBeenCalledExactlyOnceWith({
      year: 2026,
      month: 9,
      kind: "HEARING",
    });
    expect(toast).toHaveBeenCalledWith("Deleted FCF from September 14", {
      id: "pb-calendar-entry-delete",
    });
    expect(clearSelection).toHaveBeenCalledTimes(1);
    expect(title()).toHaveFocus();
  });

  test("success still reports the delete after the component unmounts", async () => {
    const { track, unmount } = renderHarness();
    confirmDelete();

    unmount();
    await act(async () => request.succeed());

    expect(track).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledTimes(1);
  });

  test("reports the entry's own kind, such as FULL_BOARD", async () => {
    const { select, track } = renderHarness(fullBoard11);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete hearing: Full Board on September 11",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await settle(
      () => select(null),
      (r) => r.succeed(),
    );

    expect(track).toHaveBeenCalledWith({
      year: 2026,
      month: 9,
      kind: "FULL_BOARD",
    });
  });

  test("CONFLICT closes the question, toasts the server's message and returns focus to Delete hearing", async () => {
    const message =
      "Someone else changed this entry. Refresh to see the latest calendar, then try again.";
    const { select, track, clearSelection } = renderHarness();
    confirmDelete();
    startRequest(() => select(fcf14));

    await settle(
      () => select(fcf14),
      (r) => r.fail(calendarApiError("CONFLICT", message)),
    );

    expect(toast.error).toHaveBeenCalledWith(message, {
      id: "pb-calendar-entry-delete",
    });
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: DELETE_NAME })).toHaveFocus();
    expect(track).not.toHaveBeenCalled();
    expect(clearSelection).not.toHaveBeenCalled();
  });

  test("PRECONDITION_FAILED, for a month published in another tab, toasts the server's message, clears the selection and focuses the title", async () => {
    const message =
      "September 2026 is published. Click Edit month to change it.";
    const { select, track, clearSelection } = renderHarness();
    clearSelection.mockImplementation(() => select(null));
    confirmDelete();
    startRequest(() => select(fcf14));

    // The entry is still selected when the request settles: the refetched
    // month hasn't rendered yet.
    await settle(
      () => select(fcf14),
      (r) => r.fail(calendarApiError("PRECONDITION_FAILED", message)),
    );

    expect(toast.error).toHaveBeenCalledWith(message, {
      id: "pb-calendar-entry-delete",
    });
    expect(clearSelection).toHaveBeenCalledTimes(1);
    expect(title()).toHaveFocus();
    expect(track).not.toHaveBeenCalled();
  });

  test("NOT_FOUND, after the refetch removed the entry, toasts the server's message and focuses the title", async () => {
    const message =
      "This entry no longer exists. Someone may have deleted it. Refresh to see the latest calendar.";
    const { select, track } = renderHarness();
    confirmDelete();
    startRequest(() => select(fcf14));

    await settle(
      () => select(null),
      (r) => r.fail(calendarApiError("NOT_FOUND", message)),
    );

    expect(toast.error).toHaveBeenCalledWith(message, {
      id: "pb-calendar-entry-delete",
    });
    expect(title()).toHaveFocus();
    expect(track).not.toHaveBeenCalled();
  });

  test("any other failure keeps the question open with the inline error, and Delete tries again", async () => {
    const { select, track } = renderHarness();
    confirmDelete();
    startRequest(() => select(fcf14));

    await settle(
      () => select(fcf14),
      (r) =>
        r.fail(calendarApiError("INTERNAL_SERVER_ERROR", "Database timeout")),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(DELETE_FAILED_MESSAGE);
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(toast.error).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(mutation.mutateAsync).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("selecting another entry closes the question without deleting", () => {
    const { select } = renderHarness();
    fireEvent.click(screen.getByRole("button", { name: DELETE_NAME }));

    select(fullBoard11);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();

    select(fcf14);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(mutation.mutateAsync).not.toHaveBeenCalled();
  });

  test("returns no actions with no entry selected", () => {
    renderHarness(null);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
