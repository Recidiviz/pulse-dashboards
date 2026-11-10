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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import { CloseReasonModal } from "../CloseReasonModal";

vi.mock("../../Modal/Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock("../../assets/x.svg?react", () => ({
  default: () => <svg />,
}));

describe("CloseReasonModal", () => {
  it("shows the close-application header and all reason options", () => {
    render(<CloseReasonModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Mark Application Complete" }),
    ).toBeInTheDocument();
    expect(screen.getByText("How did this case resolve?")).toBeInTheDocument();
    expect(
      screen.getByText("Client released to housing provider"),
    ).toBeInTheDocument();
    expect(screen.getByText("Application withdrawn")).toBeInTheDocument();
    expect(screen.getByText("Release denied")).toBeInTheDocument();
    expect(screen.getByText("Housing plan rejected")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("keeps the submit button disabled until a reason is selected", () => {
    render(<CloseReasonModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Mark Application Complete" }),
    ).toBeDisabled();
  });

  it("submits a selected reason without otherText", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<CloseReasonModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />);

    // OptionItem is a <label>; the radio itself has pointer-events: none.
    await user.click(screen.getByText("Application withdrawn"));
    await user.click(
      screen.getByRole("button", { name: "Mark Application Complete" }),
    );

    expect(onSubmit).toHaveBeenCalledWith("application_withdrawn", undefined);
  });

  it("keeps the submit button disabled for Other until free-text is entered", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<CloseReasonModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByText("Other"));
    expect(
      screen.getByRole("button", { name: "Mark Application Complete" }),
    ).toBeDisabled();
    expect(
      screen.getByPlaceholderText("Describe how the case was resolved"),
    ).toBeInTheDocument();
  });

  it("passes through Other free-text when provided", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<CloseReasonModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByText("Other"));

    await user.type(
      screen.getByPlaceholderText("Describe how the case was resolved"),
      "Custom outcome",
    );
    await user.click(
      screen.getByRole("button", { name: "Mark Application Complete" }),
    );

    expect(onSubmit).toHaveBeenCalledWith("other", "Custom outcome");
  });

  it("calls onClose when Go back is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<CloseReasonModal isOpen onClose={onClose} onSubmit={vi.fn()} />);

    await user.click(screen.getByText("Release denied"));
    await user.click(screen.getByRole("button", { name: "Go back" }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
