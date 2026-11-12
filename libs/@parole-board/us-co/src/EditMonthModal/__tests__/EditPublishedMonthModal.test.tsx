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
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { axe } from "jest-axe";
import { ReactNode, useState } from "react";
import toast from "react-hot-toast";
import ReactModal from "react-modal";

import {
  ParoleBoardHostProvider,
  useUnpublishMonth,
} from "~@parole-board/common";
import { calendarApiError } from "~@parole-board/common/fixtures";
import { createFakeHost } from "~@parole-board/common/testing";

import {
  EDIT_MONTH_TOAST_ID,
  EditPublishedMonthModal,
} from "../EditPublishedMonthModal";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("~@parole-board/common", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~@parole-board/common")>()),
  useUnpublishMonth: vi.fn(),
}));

const MONTH = { id: "month-2026-9", year: 2026, month: 9 };
const EDIT_MONTH_ERROR_TEXT =
  "We couldn't move September 2026 to draft. Try again or contact Recidiviz support.";

/** How the test settles the request that's running. */
type Request = {
  succeed: () => void;
  fail: (error: unknown) => void;
};

/**
 * useUnpublishMonth's result, which each test drives by hand. The real hook
 * stores the month the request returns, and refetches it after a stale
 * error; its own tests cover that, and the month view's tests cover the page
 * after Edit month.
 */
let mutation: { isPending: boolean; mutateAsync: ReturnType<typeof vi.fn> };
let request: Request;

/** The dialog open on September 2026, with an Open button to reopen it. */
function Harness() {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      <EditPublishedMonthModal
        isOpen={isOpen}
        month={MONTH}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

function renderModal() {
  const host = createFakeHost();
  const track = vi.spyOn(
    host.analyticsStore,
    "trackPbPublicCalendarMonthUnpublished",
  );
  const view = render(<Harness />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <ParoleBoardHostProvider host={host}>{children}</ParoleBoardHostProvider>
    ),
  });
  const rerender = () => view.rerender(<Harness />);
  return { ...view, track, rerender };
}

const dialog = () =>
  screen.queryByRole("alertdialog", { name: "Edit September 2026?" });
const confirmButton = () => screen.getByRole("button", { name: "Edit month" });

/** Clicks "Edit month" and marks the request as running. */
function confirm(rerender: () => void) {
  fireEvent.click(confirmButton());
  mutation = { ...mutation, isPending: true };
  rerender();
}

/** Finishes the request with outcome, as useUnpublishMonth would. */
async function settle(rerender: () => void, outcome: (r: Request) => void) {
  mutation = { ...mutation, isPending: false };
  rerender();
  await act(async () => outcome(request));
}

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

beforeEach(() => {
  vi.mocked(toast).mockClear();
  vi.mocked(toast.error).mockClear();
  mutation = {
    isPending: false,
    mutateAsync: vi.fn(
      () =>
        new Promise((resolve, reject) => {
          request = { succeed: () => resolve({}), fail: reject };
        }),
    ),
  };
  vi.mocked(useUnpublishMonth).mockImplementation(
    () => mutation as unknown as ReturnType<typeof useUnpublishMonth>,
  );
});

describe("EditPublishedMonthModal", () => {
  test("sends only the month's id, and only on confirm", () => {
    const { rerender } = renderModal();
    expect(mutation.mutateAsync).not.toHaveBeenCalled();

    confirm(rerender);

    expect(mutation.mutateAsync).toHaveBeenCalledExactlyOnceWith({
      monthId: MONTH.id,
    });
  });

  test("shows the waiting button, and keeps the dialog open, while the request runs", () => {
    const { rerender } = renderModal();

    confirm(rerender);

    expect(confirmButton()).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(dialog()).toBeInTheDocument();
  });

  test("on success, closes, toasts and tracks the unpublish once", async () => {
    const { rerender, track } = renderModal();

    confirm(rerender);
    expect(track).not.toHaveBeenCalled();
    await settle(rerender, (r) => r.succeed());

    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(track).toHaveBeenCalledExactlyOnceWith({ year: 2026, month: 9 });
    expect(toast).toHaveBeenCalledExactlyOnceWith(
      "September 2026 is back in draft and off the public calendar.",
      { id: EDIT_MONTH_TOAST_ID },
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  test.each([
    ["PRECONDITION_FAILED", "September 2026 isn't published."],
    ["CONFLICT", "September 2026 was just changed by Editor B."],
    ["NOT_FOUND", "This month doesn't exist."],
  ] as const)(
    "%s closes the dialog and toasts the server's message",
    async (code, message) => {
      const { rerender, track } = renderModal();

      confirm(rerender);
      await settle(rerender, (r) => r.fail(calendarApiError(code, message)));

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(toast.error).toHaveBeenCalledExactlyOnceWith(message, {
        id: EDIT_MONTH_TOAST_ID,
      });
      expect(track).not.toHaveBeenCalled();
      expect(toast).not.toHaveBeenCalled();
    },
  );

  test("any other error keeps the dialog open with the inline error, and a retry can succeed", async () => {
    const { rerender, track } = renderModal();

    confirm(rerender);
    await settle(rerender, (r) => r.fail(new TypeError("Failed to fetch")));

    expect(screen.getByText(EDIT_MONTH_ERROR_TEXT)).toBeInTheDocument();
    expect(dialog()).toBeInTheDocument();
    expect(track).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(await axe(document.body)).toHaveNoViolations();

    confirm(rerender);
    expect(screen.queryByText(EDIT_MONTH_ERROR_TEXT)).not.toBeInTheDocument();
    await settle(rerender, (r) => r.succeed());

    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(mutation.mutateAsync).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenCalledExactlyOnceWith({ year: 2026, month: 9 });
  });

  test("a BAD_REQUEST keeps the dialog open with the server's message", async () => {
    const { rerender } = renderModal();

    confirm(rerender);
    await settle(rerender, (r) =>
      r.fail(calendarApiError("BAD_REQUEST", "September 2026 is in the past.")),
    );

    expect(dialog()).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "September 2026 is in the past.",
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  test("Cancel closes without a request, and reopening clears an earlier error", async () => {
    const { rerender } = renderModal();
    confirm(rerender);
    await settle(rerender, (r) =>
      r.fail(calendarApiError("INTERNAL_SERVER_ERROR", "boom")),
    );
    expect(screen.getByText(EDIT_MONTH_ERROR_TEXT)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(dialog()).toBeInTheDocument();
    expect(screen.queryByText(EDIT_MONTH_ERROR_TEXT)).not.toBeInTheDocument();
    expect(mutation.mutateAsync).toHaveBeenCalledOnce();
  });

  test("still tracks and toasts a success that settles after the dialog unmounts", async () => {
    const { rerender, track, unmount } = renderModal();

    confirm(rerender);
    unmount();
    await act(async () => request.succeed());

    expect(track).toHaveBeenCalledExactlyOnceWith({ year: 2026, month: 9 });
    expect(toast).toHaveBeenCalledOnce();
  });
});
