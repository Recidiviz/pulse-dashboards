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

import { AcceptAsHomePlanModal } from "../AcceptAsHomePlanModal";

vi.mock("~@idaho-th/client/components/ConfirmationModal", () => ({
  ConfirmationModal: ({
    heading,
    subheading,
    primaryBtnText,
    secondaryBtnText,
    onConfirm,
    onClose,
    isOpen,
  }: {
    heading: string;
    subheading?: React.ReactNode;
    primaryBtnText?: string;
    secondaryBtnText?: string;
    onConfirm: () => void;
    onClose: () => void;
    isOpen: boolean;
  }) =>
    isOpen ? (
      <div>
        <h1>{heading}</h1>
        <div>{subheading}</div>
        <button type="button" onClick={onClose}>
          {secondaryBtnText}
        </button>
        <button type="button" onClick={onConfirm}>
          {primaryBtnText}
        </button>
      </div>
    ) : null,
}));

test("explains that setting a home plan closes other applications and doesn't lock in a bed", () => {
  const screen = render(
    <AcceptAsHomePlanModal isOpen onClose={vi.fn()} onConfirm={vi.fn()} />,
  );

  expect(screen.getByText("Set as Home Plan?")).toBeInTheDocument();
  expect(
    screen.getByText(
      /this will close the application for all other providers/i,
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      /providers typically don't hold a bed until funding comes through/i,
    ),
  ).toBeInTheDocument();
});

test("wires confirm and cancel callbacks", () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();

  const screen = render(
    <AcceptAsHomePlanModal isOpen onClose={onClose} onConfirm={onConfirm} />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Set as Home Plan" }));
  expect(onConfirm).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
