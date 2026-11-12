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
import { ReactElement } from "react";
import toast from "react-hot-toast";

import {
  Removal,
  UNDO_WINDOW_MS,
  useRemoveWithUndo,
} from "../useRemoveWithUndo";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { dismiss: vi.fn(), error: vi.fn() }),
}));

vi.mock("../../../../../../hooks/useIsMobile", () => ({
  default: () => ({ isMobile: false }),
}));

const toastMock = vi.mocked(toast);

/** Lists two items, each with a Remove button that calls removeItem. */
function Items({ removeItem }: { removeItem: (id: string) => Removal }) {
  const { remove } = useRemoveWithUndo({
    removedMessage: "Item removed",
    failedMessage: "Item wasn't removed",
    undoFailedMessage: "Item wasn't restored",
  });
  return (
    <ul>
      {["a", "b"].map((id) => (
        <li key={id}>
          <button onClick={() => remove(id, () => removeItem(id))}>
            Remove {id}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Returns a removal whose write and undo the test settles. */
function removal({
  done = Promise.resolve(),
  undo = vi.fn().mockResolvedValue(undefined),
}: Partial<{ done: Promise<void>; undo: () => Promise<void> }> = {}) {
  return { done, undo };
}

/** Renders the undo toast's content, so the test can click Undo. */
function renderToast() {
  const [content] = toastMock.mock.calls[toastMock.mock.calls.length - 1];
  render(
    (content as (current: { id: string }) => ReactElement)({ id: "toast-id" }),
  );
}

describe("useRemoveWithUndo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toastMock.mockReturnValue("toast-id");
  });

  it("starts the removal right away and shows the undo toast", () => {
    const removeItem = vi.fn(() => removal());
    render(<Items removeItem={removeItem} />);

    fireEvent.click(screen.getByText("Remove a"));

    expect(removeItem).toHaveBeenCalledWith("a");
    expect(toastMock).toHaveBeenCalledWith(expect.any(Function), {
      duration: UNDO_WINDOW_MS,
    });
  });

  it("undoes the removal and closes the toast on Undo", async () => {
    const pending = removal();
    render(<Items removeItem={() => pending} />);

    fireEvent.click(screen.getByText("Remove a"));
    renderToast();
    await act(async () => fireEvent.click(screen.getByText("Undo")));

    expect(pending.undo).toHaveBeenCalled();
    expect(toastMock.dismiss).toHaveBeenCalledWith("toast-id");
  });

  it("closes the undo toast and shows an error when the removal fails", async () => {
    render(
      <Items
        removeItem={() =>
          removal({ done: Promise.reject(new Error("offline")) })
        }
      />,
    );

    await act(async () => fireEvent.click(screen.getByText("Remove a")));

    expect(toastMock.dismiss).toHaveBeenCalledWith("toast-id");
    expect(toastMock.error).toHaveBeenCalledWith("Item wasn't removed");
  });

  it("shows an error when undoing fails", async () => {
    render(
      <Items
        removeItem={() =>
          removal({ undo: vi.fn().mockRejectedValue(new Error("offline")) })
        }
      />,
    );

    fireEvent.click(screen.getByText("Remove a"));
    renderToast();
    await act(async () => fireEvent.click(screen.getByText("Undo")));

    expect(toastMock.error).toHaveBeenCalledWith("Item wasn't restored");
  });

  it("doesn't remove an item twice while its removal is saving", () => {
    const removeItem = vi.fn(() =>
      removal({ done: new Promise<void>(() => undefined) }),
    );
    render(<Items removeItem={removeItem} />);

    fireEvent.click(screen.getByText("Remove a"));
    fireEvent.click(screen.getByText("Remove a"));
    fireEvent.click(screen.getByText("Remove b"));

    expect(removeItem.mock.calls).toEqual([["a"], ["b"]]);
  });

  it("closes its undo toasts when it unmounts, leaving the removal in place", () => {
    const pending = removal();
    const { unmount } = render(<Items removeItem={() => pending} />);

    fireEvent.click(screen.getByText("Remove a"));
    unmount();

    expect(toastMock.dismiss).toHaveBeenCalledWith("toast-id");
    expect(pending.undo).not.toHaveBeenCalled();
  });
});
