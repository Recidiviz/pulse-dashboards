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
import { axe } from "jest-axe";

import { EntryActions, EntryActionsProps } from "../EntryActions";

const DELETE_NAME = "Delete hearing: FCF on September 14";

const baseProps: EntryActionsProps = {
  label: "FCF",
  date: "2026-09-14",
  canDelete: true,
  confirming: false,
  deleting: false,
  onDeleteRequest: () => undefined,
  onDeleteConfirm: () => undefined,
  onDeleteCancel: () => undefined,
};

function renderActions(props: Partial<EntryActionsProps> = {}) {
  const callbacks = {
    onDeleteRequest: vi.fn(),
    onDeleteConfirm: vi.fn(),
    onDeleteCancel: vi.fn(),
  };
  const view = render(
    <EntryActions {...baseProps} {...callbacks} {...props} />,
  );
  const rerenderWith = (next: Partial<EntryActionsProps>) =>
    view.rerender(
      <EntryActions {...baseProps} {...callbacks} {...props} {...next} />,
    );
  return { ...view, ...callbacks, rerenderWith };
}

describe("EntryActions", () => {
  it("shows Delete hearing, named for the entry and day, when the entry can be deleted", () => {
    renderActions();

    const button = screen.getByRole("button", { name: DELETE_NAME });
    expect(button).toHaveTextContent("Delete hearing");
  });

  it("names Delete hearing for a Full Board meeting", () => {
    renderActions({ label: "Full Board", date: "2026-09-11" });

    expect(
      screen.getByRole("button", {
        name: "Delete hearing: Full Board on September 11",
      }),
    ).toBeInTheDocument();
  });

  it("hides Delete hearing when the entry can't be deleted", () => {
    renderActions({ label: "Business Meeting", canDelete: false });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders other actions before Delete hearing", () => {
    renderActions({ children: <button type="button">Move to…</button> });

    const names = screen.getAllByRole("button").map((b) => b.textContent);
    expect(names).toEqual(["Move to…", "Delete hearing"]);
  });

  it("keeps other actions when the entry can't be deleted", () => {
    renderActions({
      canDelete: false,
      children: <button type="button">Cancel meeting</button>,
    });

    expect(
      screen.getByRole("button", { name: "Cancel meeting" }),
    ).toBeInTheDocument();
  });

  it("asks for the delete through onDeleteRequest", () => {
    const { onDeleteRequest } = renderActions();

    fireEvent.click(screen.getByRole("button", { name: DELETE_NAME }));

    expect(onDeleteRequest).toHaveBeenCalledTimes(1);
  });

  it("swaps every button for the question while confirming", () => {
    renderActions({
      confirming: true,
      children: <button type="button">Move to…</button>,
    });

    expect(
      screen.getByRole("group", { name: "Delete FCF from September 14?" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: DELETE_NAME }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Move to…" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("never shows the question for an entry that can't be deleted", () => {
    renderActions({ canDelete: false, confirming: true });

    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("passes the question's callbacks, waiting state and error through", () => {
    const { onDeleteCancel, onDeleteConfirm } = renderActions({
      confirming: true,
      deleteError: "We couldn't delete this.",
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.keyDown(screen.getByRole("group"), { key: "Escape" });

    expect(onDeleteConfirm).toHaveBeenCalledTimes(1);
    expect(onDeleteCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't delete this.",
    );
  });

  it("makes the question's Delete wait while deleting", () => {
    renderActions({ confirming: true, deleting: true });

    expect(screen.getByRole("button", { name: "Delete" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("returns focus to Delete hearing when the question closes", () => {
    const { rerenderWith } = renderActions();
    fireEvent.click(screen.getByRole("button", { name: DELETE_NAME }));

    rerenderWith({ confirming: true });
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    rerenderWith({ confirming: false });
    expect(screen.getByRole("button", { name: DELETE_NAME })).toHaveFocus();
  });

  it("doesn't take focus on first render", () => {
    renderActions();

    expect(document.body).toHaveFocus();
  });

  it("has no axe violations, with the button or the question", async () => {
    const { container, rerenderWith } = renderActions({
      children: <button type="button">Move to…</button>,
    });
    expect(await axe(container)).toHaveNoViolations();

    rerenderWith({ confirming: true });
    expect(await axe(container)).toHaveNoViolations();
  });
});
