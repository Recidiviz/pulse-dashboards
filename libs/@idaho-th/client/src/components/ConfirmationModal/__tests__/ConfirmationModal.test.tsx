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

import { fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { ConfirmationModal } from "../ConfirmationModal";

vi.mock("../../assets/x.svg?react", () => ({
  default: () => <svg data-testid="x-icon" />,
}));

vi.mock("../../Modal/Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

test("renders heading and string subheading", () => {
  const screen = render(
    <ConfirmationModal
      isOpen
      onClose={vi.fn()}
      onConfirm={vi.fn()}
      heading="Set as Home Plan?"
      subheading="This action can't be undone."
    />,
  );

  expect(screen.getByText("Set as Home Plan?")).toBeInTheDocument();
  expect(screen.getByText("This action can't be undone.")).toBeInTheDocument();
});

test("calls onConfirm and onClose from footer buttons", () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  const screen = render(
    <ConfirmationModal
      isOpen
      onClose={onClose}
      onConfirm={onConfirm}
      heading="Confirm?"
      secondaryBtnText="Go Back"
      primaryBtnText="Confirm"
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  expect(onConfirm).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "Go Back" }));
  expect(onClose).toHaveBeenCalled();
});

test("hides the secondary button when requested", () => {
  const screen = render(
    <ConfirmationModal
      isOpen
      onClose={vi.fn()}
      onConfirm={vi.fn()}
      heading="Only primary"
      hideSecondaryButton
    />,
  );

  expect(
    screen.queryByRole("button", { name: "Go Back" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
});

test("disables secondary while loading and closes via X", () => {
  const onClose = vi.fn();

  const screen = render(
    <ConfirmationModal
      isOpen
      onClose={onClose}
      onConfirm={vi.fn()}
      heading="Loading"
      isLoading
    />,
  );

  expect(screen.getByRole("button", { name: "Go Back" })).toBeDisabled();
  fireEvent.click(screen.getByLabelText("Close modal"));
  expect(onClose).toHaveBeenCalledTimes(1);
});
