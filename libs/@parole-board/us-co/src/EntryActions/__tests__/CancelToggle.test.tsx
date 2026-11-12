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

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { semantics } from "~@parole-board/common";

import { CancelToggle, CancelToggleProps } from "../CancelToggle";
import { EntryActions } from "../EntryActions";

const CANCEL_NAME = "Cancel Full Board on September 11";
const UNDO_NAME = "Undo the cancellation of Full Board on September 11";

const baseProps: CancelToggleProps = {
  label: "Full Board",
  date: "2026-09-11",
  cancelled: false,
  canCancel: true,
  submitting: false,
  onCancel: () => undefined,
  onUndo: () => undefined,
};

function renderToggle(props: Partial<CancelToggleProps> = {}) {
  const callbacks = { onCancel: vi.fn(), onUndo: vi.fn() };
  const view = render(
    <>
      <CancelToggle {...baseProps} {...callbacks} {...props} />
      <button type="button">Elsewhere</button>
    </>,
  );
  const rerenderWith = (next: Partial<CancelToggleProps>) =>
    view.rerender(
      <>
        <CancelToggle {...baseProps} {...callbacks} {...props} {...next} />
        <button type="button">Elsewhere</button>
      </>,
    );
  return { ...view, ...callbacks, rerenderWith };
}

describe("CancelToggle", () => {
  it("shows Cancel, named for the meeting and day, when the meeting isn't cancelled", () => {
    renderToggle();

    const button = screen.getByRole("button", { name: CANCEL_NAME });
    expect(button).toHaveTextContent("Cancel");
    expect(button).not.toHaveAttribute("aria-pressed");
  });

  it("shows Undo, named for the meeting and day, when the meeting is cancelled", () => {
    renderToggle({ cancelled: true });

    const button = screen.getByRole("button", { name: UNDO_NAME });
    expect(button).toHaveTextContent("Undo");
    expect(button).not.toHaveAttribute("aria-pressed");
  });

  it.each([
    ["Cancel", false, CANCEL_NAME],
    ["Undo", true, UNDO_NAME],
  ])("fills %s with the destructive red", (_label, cancelled, name) => {
    renderToggle({ cancelled });

    expect(screen.getByRole("button", { name })).toHaveStyleRule(
      "background-color",
      semantics.action.destructive,
      { modifier: "&&:not(:disabled)" },
    );
  });

  it("names the button for a Business Meeting", () => {
    renderToggle({ label: "Business Meeting", date: "2026-09-25" });

    expect(
      screen.getByRole("button", {
        name: "Cancel Business Meeting on September 25",
      }),
    ).toBeInTheDocument();
  });

  it("renders nothing for an entry that can't be cancelled, such as a hearing", () => {
    const { container } = renderToggle({
      label: "FCF",
      date: "2026-09-14",
      canCancel: false,
    });

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(container.firstElementChild).toHaveTextContent("Elsewhere");
  });

  it("calls onCancel from Cancel and onUndo from Undo", () => {
    const { onCancel, onUndo, rerenderWith } = renderToggle();

    fireEvent.click(screen.getByRole("button", { name: CANCEL_NAME }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();

    rerenderWith({ cancelled: true });
    fireEvent.click(screen.getByRole("button", { name: UNDO_NAME }));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancels from the keyboard", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderToggle();

    await user.tab();
    expect(screen.getByRole("button", { name: CANCEL_NAME })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("waits while submitting, so a second click can't send the request again", () => {
    const { onCancel } = renderToggle({ submitting: true });

    const button = screen.getByRole("button", { name: CANCEL_NAME });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("keeps focus through the request and lands it on Undo afterwards", () => {
    const { rerenderWith } = renderToggle();
    const button = screen.getByRole("button", { name: CANCEL_NAME });
    button.focus();
    fireEvent.click(button);

    rerenderWith({ submitting: true });
    expect(button.parentElement).toHaveFocus();

    rerenderWith({ submitting: false, cancelled: true });
    expect(screen.getByRole("button", { name: UNDO_NAME })).toHaveFocus();
  });

  it("returns focus to the button when the request fails", () => {
    const { rerenderWith } = renderToggle();
    fireEvent.click(screen.getByRole("button", { name: CANCEL_NAME }));

    rerenderWith({ submitting: true });
    rerenderWith({ submitting: false });

    expect(screen.getByRole("button", { name: CANCEL_NAME })).toHaveFocus();
  });

  it("leaves focus alone if the editor moved it during the request", () => {
    const { rerenderWith } = renderToggle();
    fireEvent.click(screen.getByRole("button", { name: CANCEL_NAME }));
    rerenderWith({ submitting: true });

    const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
    elsewhere.focus();
    rerenderWith({ submitting: false, cancelled: true });

    expect(elsewhere).toHaveFocus();
  });

  it("doesn't pull focus when a request starts after focus moved away", () => {
    const { rerenderWith } = renderToggle();
    fireEvent.click(screen.getByRole("button", { name: CANCEL_NAME }));
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
    elsewhere.focus();

    rerenderWith({ submitting: true });
    rerenderWith({ submitting: false });

    expect(elsewhere).toHaveFocus();
  });

  it("doesn't take focus when a request it didn't start ends", () => {
    const { rerenderWith } = renderToggle({ submitting: true });

    rerenderWith({ submitting: false });

    expect(document.body).toHaveFocus();
  });

  it("has no axe violations in any state", async () => {
    const { container, rerenderWith } = renderToggle();
    expect(await axe(container)).toHaveNoViolations();

    rerenderWith({ submitting: true });
    expect(await axe(container)).toHaveNoViolations();

    rerenderWith({ cancelled: true });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("CancelToggle in EntryActions", () => {
  const noop = () => undefined;

  function renderInBar(label: string, date: string, canDelete: boolean) {
    render(
      <EntryActions
        label={label}
        date={date}
        canDelete={canDelete}
        confirming={false}
        deleting={false}
        onDeleteRequest={noop}
        onDeleteConfirm={noop}
        onDeleteCancel={noop}
      >
        <CancelToggle {...baseProps} label={label} date={date} cancelled />
      </EntryActions>,
    );
  }

  it("sits before Delete hearing for a cancelled Full Board", () => {
    renderInBar("Full Board", "2026-09-11", true);

    const names = screen.getAllByRole("button").map((b) => b.textContent);
    expect(names).toEqual(["Undo", "Delete hearing"]);
  });

  it("is the only action for a cancelled Business Meeting", () => {
    renderInBar("Business Meeting", "2026-09-25", false);

    const names = screen.getAllByRole("button").map((b) => b.textContent);
    expect(names).toEqual(["Undo"]);
  });
});
