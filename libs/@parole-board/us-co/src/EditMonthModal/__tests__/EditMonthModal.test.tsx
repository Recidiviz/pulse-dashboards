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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { ComponentProps, useState } from "react";
import ReactModal from "react-modal";

import { ParoleBoardButton } from "~@parole-board/common";

import { editMonthFailedMessage, EditMonthModal } from "../EditMonthModal";

const BODY =
  "Editing takes September 2026 off the public calendar. It won't be visible outside the Calendar Unit until you publish it again.";

type ModalProps = ComponentProps<typeof EditMonthModal>;

const defaultProps = (): ModalProps => ({
  isOpen: true,
  monthLabel: "September 2026",
  isUnpublishing: false,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
});

const dialog = () =>
  screen.getByRole("alertdialog", { name: "Edit September 2026?" });
// react-modal reads keyCode, which userEvent.keyboard doesn't set.
const pressEscape = () =>
  fireEvent.keyDown(dialog(), { key: "Escape", code: "Escape", keyCode: 27 });
const clickOverlay = () => {
  const overlay = document.querySelector(".ReactModal__Overlay");
  if (!overlay) throw new Error("The dialog's overlay isn't rendered.");
  fireEvent.click(overlay);
};
const cancelButton = () => screen.getByRole("button", { name: "Cancel" });
const confirmButton = () => screen.getByRole("button", { name: "Edit month" });

/** The header button and the dialog, wired as the month view wires them. */
function EditFlow({ onConfirm }: { onConfirm: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <ParoleBoardButton
        kind="secondary"
        aria-label="Edit month: September 2026"
        onClick={() => setIsOpen(true)}
      >
        Edit month
      </ParoleBoardButton>
      <EditMonthModal
        isOpen={isOpen}
        monthLabel="September 2026"
        isUnpublishing={false}
        onConfirm={onConfirm}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}

beforeEach(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

describe("EditMonthModal", () => {
  it("shows the eyebrow, heading, body and buttons", () => {
    render(<EditMonthModal {...defaultProps()} />);

    expect(dialog()).toHaveAccessibleDescription(BODY);
    expect(
      screen.getByRole("heading", { name: "Edit September 2026?" }),
    ).toBeInTheDocument();
    expect(screen.getByText(BODY)).toBeInTheDocument();
    expect(screen.getByText("Edit published month")).toBeInTheDocument();
    expect(cancelButton()).toBeEnabled();
    expect(confirmButton()).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders nothing while closed", () => {
    render(<EditMonthModal {...defaultProps()} isOpen={false} />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("starts focus on the dialog, not on either button", async () => {
    render(<EditMonthModal {...defaultProps()} />);

    await waitFor(() => expect(dialog()).toHaveFocus());
    expect(cancelButton()).not.toHaveFocus();
    expect(confirmButton()).not.toHaveFocus();
  });

  it("calls onConfirm only when the editor confirms", async () => {
    const props = defaultProps();
    render(<EditMonthModal {...props} />);

    await userEvent.click(cancelButton());
    expect(props.onConfirm).not.toHaveBeenCalled();
    expect(props.onCancel).toHaveBeenCalledTimes(1);

    await userEvent.click(confirmButton());
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the editor presses Enter as the dialog opens", async () => {
    const props = defaultProps();
    render(<EditMonthModal {...props} />);
    await waitFor(() => expect(dialog()).toHaveFocus());

    await userEvent.keyboard("{Enter}");

    expect(props.onConfirm).not.toHaveBeenCalled();
    expect(props.onCancel).not.toHaveBeenCalled();
    expect(dialog()).toBeInTheDocument();
  });

  it("calls onCancel on a click outside the dialog", () => {
    const props = defaultProps();
    render(<EditMonthModal {...props} />);

    clickOverlay();

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel on Escape", () => {
    const props = defaultProps();
    render(<EditMonthModal {...props} />);

    pressEscape();

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("waits while unpublishing: both buttons are disabled, focus stays on the dialog, Escape and outside clicks are ignored, and progress is announced", async () => {
    const props = defaultProps();
    render(<EditMonthModal {...props} isUnpublishing />);

    await waitFor(() => expect(dialog()).toHaveFocus());
    expect(confirmButton()).toBeDisabled();
    expect(confirmButton()).toHaveAttribute("aria-busy", "true");
    expect(cancelButton()).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Taking September 2026 off the public calendar",
    );

    pressEscape();
    clickOverlay();
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("shows a failed request inline and moves focus back to the confirm button", async () => {
    const props = defaultProps();
    const { rerender } = render(<EditMonthModal {...props} isUnpublishing />);

    rerender(
      <EditMonthModal
        {...props}
        error={editMonthFailedMessage("September 2026")}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't move September 2026 to draft. Try again or contact Recidiviz support.",
    );
    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(confirmButton()).toBeEnabled();
    expect(confirmButton()).toHaveFocus();
    expect(confirmButton()).toHaveAccessibleDescription(
      "We couldn't move September 2026 to draft. Try again or contact Recidiviz support.",
    );

    await userEvent.click(confirmButton());
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("opens from Edit month and returns focus to it on Cancel", async () => {
    const onConfirm = vi.fn();
    render(<EditFlow onConfirm={onConfirm} />);
    const trigger = screen.getByRole("button", {
      name: "Edit month: September 2026",
    });

    await userEvent.click(trigger);
    await waitFor(() => expect(dialog()).toHaveFocus());

    await userEvent.click(cancelButton());

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("has no axe violations, with and without the error", async () => {
    const { rerender } = render(<EditMonthModal {...defaultProps()} />);
    expect(await axe(document.body)).toHaveNoViolations();

    rerender(
      <EditMonthModal
        {...defaultProps()}
        error={editMonthFailedMessage("September 2026")}
      />,
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
