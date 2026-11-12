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

import {
  DeleteEntryConfirm,
  DeleteEntryConfirmProps,
} from "../DeleteEntryConfirm";

const QUESTION = "Delete FCF from September 14?";

function renderConfirm(props: Partial<DeleteEntryConfirmProps> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = render(
    <DeleteEntryConfirm
      label="FCF"
      date="2026-09-14"
      deleting={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { ...view, onConfirm, onCancel };
}

describe("DeleteEntryConfirm", () => {
  it("asks about the entry by label and long date, as a group named by the question", () => {
    renderConfirm();

    expect(screen.getByText(QUESTION)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: QUESTION })).toBeInTheDocument();
  });

  it("writes the day without a leading zero and in the entry's own month", () => {
    renderConfirm({ label: "Full Board", date: "2026-10-02" });

    expect(
      screen.getByRole("group", { name: "Delete Full Board from October 2?" }),
    ).toBeInTheDocument();
  });

  it("moves focus to Cancel when it opens", () => {
    renderConfirm();

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("calls onCancel from Cancel without confirming", () => {
    const { onCancel, onConfirm } = renderConfirm();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onCancel on Escape from either button", () => {
    const { onCancel, onConfirm } = renderConfirm();

    fireEvent.keyDown(screen.getByRole("button", { name: "Cancel" }), {
      key: "Escape",
    });
    fireEvent.keyDown(screen.getByRole("button", { name: "Delete" }), {
      key: "Escape",
    });

    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("ignores other keys", () => {
    const { onCancel } = renderConfirm();

    fireEvent.keyDown(screen.getByRole("group"), { key: "Enter" });

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("moves between Cancel and Delete with the arrow keys, wrapping at the ends", () => {
    renderConfirm();
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const remove = screen.getByRole("button", { name: "Delete" });

    fireEvent.keyDown(cancel, { key: "ArrowRight" });
    expect(remove).toHaveFocus();
    fireEvent.keyDown(remove, { key: "ArrowRight" });
    expect(cancel).toHaveFocus();
    fireEvent.keyDown(cancel, { key: "ArrowLeft" });
    expect(remove).toHaveFocus();
  });

  it("calls onConfirm from Delete without cancelling", () => {
    const { onCancel, onConfirm } = renderConfirm();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("makes Delete wait, disables Cancel and keeps focus in the group while deleting", () => {
    const { onConfirm, rerender, onCancel } = renderConfirm();
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    deleteButton.focus();

    rerender(
      <DeleteEntryConfirm
        label="FCF"
        date="2026-09-14"
        deleting
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(deleteButton);
    fireEvent.click(cancelButton);

    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveAttribute("aria-busy", "true");
    expect(cancelButton).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole("group")).toHaveFocus();
  });

  it("ignores Escape while deleting", () => {
    const { onCancel } = renderConfirm({ deleting: true });

    fireEvent.keyDown(screen.getByRole("group"), { key: "Escape" });

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("returns focus to Cancel and shows the alert when a delete fails", () => {
    const { rerender, onCancel, onConfirm } = renderConfirm({ deleting: true });
    const error = "We couldn't delete this.";
    screen.getByRole("button", { name: "Delete" }).focus();

    rerender(
      <DeleteEntryConfirm
        label="FCF"
        date="2026-09-14"
        deleting={false}
        error={error}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(screen.getByRole("group")).toHaveAccessibleDescription(error);
  });

  it("shows no alert without an error", () => {
    renderConfirm();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the error as an alert and keeps both buttons", () => {
    const error =
      "We couldn't delete this. Try again or contact Recidiviz support.";
    renderConfirm({ error });

    expect(screen.getByRole("alert")).toHaveTextContent(error);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  it("has no axe violations, open or with an error", async () => {
    const { container, rerender, onCancel, onConfirm } = renderConfirm();
    expect(await axe(container)).toHaveNoViolations();

    rerender(
      <DeleteEntryConfirm
        label="FCF"
        date="2026-09-14"
        deleting
        error="We couldn't delete this. Try again or contact Recidiviz support."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
