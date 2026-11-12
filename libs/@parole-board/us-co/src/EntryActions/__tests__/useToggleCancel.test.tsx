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
import { axe } from "jest-axe";
import toast from "react-hot-toast";

import type { EntryDto } from "~@parole-board/common";
import {
  GENERIC_CALENDAR_ERROR_MESSAGE,
  useCancelEntry,
  useUncancelEntry,
} from "~@parole-board/common";
import {
  calendarApiError,
  september2026MonthDetail,
} from "~@parole-board/common/fixtures";

import { CancelToggle } from "../CancelToggle";
import { CANCEL_TOAST_ID, useToggleCancel } from "../useToggleCancel";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("~@parole-board/common", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~@parole-board/common")>()),
  useCancelEntry: vi.fn(),
  useUncancelEntry: vi.fn(),
}));

const entryById = (id: string): EntryDto => {
  const entry = september2026MonthDetail.entries.find((e) => e.id === id);
  if (!entry) throw new Error(`No fixture entry ${id}`);
  return entry;
};
const fullBoard11 = entryById("2026-09-11:FULL_BOARD:Full Board");
const businessMeeting25 = entryById(
  "2026-09-25:BUSINESS_MEETING:Business Meeting",
);
const fcf14 = entryById("2026-09-14:HEARING:FCF");

const CANCEL_NAME = "Cancel Full Board on September 11";
const UNDO_NAME = "Undo the cancellation of Full Board on September 11";

/** A mutation hook's result, which each test drives by hand. */
type FakeMutation = {
  isPending: boolean;
  mutateAsync: ReturnType<typeof vi.fn>;
  settle?: { succeed: () => void; fail: (error: unknown) => void };
};

let cancelMutation: FakeMutation;
let uncancelMutation: FakeMutation;

function fakeMutation(): FakeMutation {
  const mutation: FakeMutation = {
    isPending: false,
    mutateAsync: vi.fn(
      () =>
        new Promise((resolve, reject) => {
          mutation.settle = {
            succeed: () => resolve({ month: september2026MonthDetail }),
            fail: reject,
          };
        }),
    ),
  };
  return mutation;
}

function Harness({
  selected,
  onMonthLocked,
}: {
  selected: EntryDto | null;
  onMonthLocked: () => void;
}) {
  const props = useToggleCancel(selected, onMonthLocked);
  return selected && props ? (
    <CancelToggle label={selected.label} date={selected.date} {...props} />
  ) : null;
}

function renderHarness(selected: EntryDto | null = fullBoard11) {
  const onMonthLocked = vi.fn();
  const view = render(
    <Harness selected={selected} onMonthLocked={onMonthLocked} />,
  );
  const select = (entry: EntryDto | null) =>
    view.rerender(<Harness selected={entry} onMonthLocked={onMonthLocked} />);
  return { ...view, select, onMonthLocked };
}

/** Marks a request as running, as the mutation hook would, and rerenders. */
function setPending(mutation: FakeMutation, rerender: () => void) {
  mutation.isPending = true;
  rerender();
}

/**
 * Finishes a request as the mutation hook does: the month the server
 * returned, or the month's refetch after a failure, renders first
 * (rerender), then the request settles with outcome.
 */
async function settle(
  mutation: FakeMutation,
  rerender: () => void,
  outcome: (settle: NonNullable<FakeMutation["settle"]>) => void,
) {
  mutation.isPending = false;
  rerender();
  await act(async () => {
    if (mutation.settle) outcome(mutation.settle);
  });
}

beforeEach(() => {
  vi.mocked(toast).mockClear();
  vi.mocked(toast.error).mockClear();
  cancelMutation = fakeMutation();
  uncancelMutation = fakeMutation();
  vi.mocked(useCancelEntry).mockImplementation(
    () => cancelMutation as unknown as ReturnType<typeof useCancelEntry>,
  );
  vi.mocked(useUncancelEntry).mockImplementation(
    () => uncancelMutation as unknown as ReturnType<typeof useUncancelEntry>,
  );
});

describe("useToggleCancel", () => {
  test("shows Cancel for a Full Board and a Business Meeting", () => {
    const { select } = renderHarness(fullBoard11);
    expect(screen.getByRole("button", { name: CANCEL_NAME })).toBeVisible();

    select(businessMeeting25);
    expect(
      screen.getByRole("button", {
        name: "Cancel Business Mtg on September 25",
      }),
    ).toBeVisible();
  });

  test("shows nothing for a hearing, whose kind isn't cancellable", () => {
    renderHarness(fcf14);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("follows the kind's cancellable flag, not its code", () => {
    // A code the API doesn't have yet, marked cancellable.
    const { select } = renderHarness({
      ...fcf14,
      kind: {
        ...fcf14.kind,
        code: "MADE_UP" as EntryDto["kind"]["code"],
        cancellable: true,
      },
    });
    expect(
      screen.getByRole("button", { name: "Cancel FCF on September 14" }),
    ).toBeVisible();

    select({
      ...fullBoard11,
      kind: { ...fullBoard11.kind, cancellable: false },
    });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("shows nothing with no entry selected", () => {
    const { container } = renderHarness(null);

    expect(container).toBeEmptyDOMElement();
  });

  test("shows Undo for a cancelled meeting", () => {
    renderHarness({ ...fullBoard11, cancelled: true });

    expect(screen.getByRole("button", { name: UNDO_NAME })).toBeVisible();
  });

  test("Cancel sends entries.cancel with the version on the click", () => {
    renderHarness({ ...fullBoard11, version: 3 });

    fireEvent.click(screen.getByRole("button", { name: CANCEL_NAME }));

    expect(cancelMutation.mutateAsync).toHaveBeenCalledExactlyOnceWith({
      entryId: fullBoard11.id,
      expectedVersion: 3,
    });
    expect(uncancelMutation.mutateAsync).not.toHaveBeenCalled();
  });

  test("Undo sends entries.uncancel with the version on the click", () => {
    renderHarness({ ...fullBoard11, cancelled: true, version: 4 });

    fireEvent.click(screen.getByRole("button", { name: UNDO_NAME }));

    expect(uncancelMutation.mutateAsync).toHaveBeenCalledExactlyOnceWith({
      entryId: fullBoard11.id,
      expectedVersion: 4,
    });
    expect(cancelMutation.mutateAsync).not.toHaveBeenCalled();
  });

  test("waits while the request runs and ignores another click", () => {
    const { select } = renderHarness();
    fireEvent.click(screen.getByRole("button", { name: CANCEL_NAME }));
    setPending(cancelMutation, () => select(fullBoard11));

    const button = screen.getByRole("button", { name: CANCEL_NAME });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    expect(cancelMutation.mutateAsync).toHaveBeenCalledTimes(1);
  });

  test("another meeting selected during the request doesn't wait, and can't start a second one", () => {
    const { select } = renderHarness();
    fireEvent.click(screen.getByRole("button", { name: CANCEL_NAME }));
    setPending(cancelMutation, () => select(businessMeeting25));

    const other = screen.getByRole("button", {
      name: "Cancel Business Mtg on September 25",
    });
    expect(other).not.toHaveAttribute("aria-busy", "true");
    fireEvent.click(other);
    expect(cancelMutation.mutateAsync).toHaveBeenCalledTimes(1);
  });

  test("a cancel that succeeds toasts it and keeps focus on the button, now Undo", async () => {
    const { select } = renderHarness();
    const button = screen.getByRole("button", { name: CANCEL_NAME });
    button.focus();
    fireEvent.click(button);
    setPending(cancelMutation, () => select(fullBoard11));

    await settle(
      cancelMutation,
      () => select({ ...fullBoard11, cancelled: true, version: 2 }),
      ({ succeed }) => succeed(),
    );

    expect(toast).toHaveBeenCalledExactlyOnceWith(
      "Cancelled Full Board on September 11",
      { id: CANCEL_TOAST_ID },
    );
    expect(screen.getByRole("button", { name: UNDO_NAME })).toHaveFocus();
  });

  test("an undo that succeeds toasts that the meeting is back on", async () => {
    const cancelled = { ...fullBoard11, cancelled: true };
    const { select } = renderHarness(cancelled);
    fireEvent.click(screen.getByRole("button", { name: UNDO_NAME }));
    setPending(uncancelMutation, () => select(cancelled));

    await settle(
      uncancelMutation,
      () => select(fullBoard11),
      ({ succeed }) => succeed(),
    );

    expect(toast).toHaveBeenCalledExactlyOnceWith(
      "Full Board on September 11 is back on",
      { id: CANCEL_TOAST_ID },
    );
  });

  test("a CONFLICT toasts the server's message and leaves the button ready to try again", async () => {
    const message =
      "Someone else changed this entry. Refresh to see the latest calendar, then try again.";
    const { select, onMonthLocked } = renderHarness();
    fireEvent.click(screen.getByRole("button", { name: CANCEL_NAME }));
    setPending(cancelMutation, () => select(fullBoard11));

    await settle(
      cancelMutation,
      () => select(fullBoard11),
      ({ fail }) => fail(calendarApiError("CONFLICT", message)),
    );

    expect(toast.error).toHaveBeenCalledExactlyOnceWith(message, {
      id: CANCEL_TOAST_ID,
    });
    expect(toast).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: CANCEL_NAME })).toBeEnabled();
    expect(onMonthLocked).not.toHaveBeenCalled();
  });

  test("a PRECONDITION_FAILED, for a month published in another tab, toasts the server's message and calls onMonthLocked", async () => {
    const message =
      "September 2026 is published. Click Edit month to change it.";
    const { select, onMonthLocked } = renderHarness();
    fireEvent.click(screen.getByRole("button", { name: CANCEL_NAME }));
    setPending(cancelMutation, () => select(fullBoard11));

    await settle(
      cancelMutation,
      () => select(fullBoard11),
      ({ fail }) => fail(calendarApiError("PRECONDITION_FAILED", message)),
    );

    expect(toast.error).toHaveBeenCalledExactlyOnceWith(message, {
      id: CANCEL_TOAST_ID,
    });
    expect(onMonthLocked).toHaveBeenCalledOnce();
  });

  test("a failure with no message for editors toasts the generic one", async () => {
    const { select, onMonthLocked } = renderHarness();
    fireEvent.click(screen.getByRole("button", { name: CANCEL_NAME }));
    setPending(cancelMutation, () => select(fullBoard11));

    await settle(
      cancelMutation,
      () => select(fullBoard11),
      ({ fail }) => fail(new Error("Failed to fetch")),
    );

    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      GENERIC_CALENDAR_ERROR_MESSAGE,
      { id: CANCEL_TOAST_ID },
    );
    expect(onMonthLocked).not.toHaveBeenCalled();
  });

  test("has no axe violations", async () => {
    const { container } = renderHarness();

    expect(await axe(container)).toHaveNoViolations();
  });
});
