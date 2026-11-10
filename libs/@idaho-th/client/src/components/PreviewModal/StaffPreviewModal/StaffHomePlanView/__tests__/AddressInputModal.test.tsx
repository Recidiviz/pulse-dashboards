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
import type { ReactNode } from "react";

import { HOME_PLAN_ADDRESS_MAX_LENGTH } from "~@idaho-th/shared";

import { AddressInputModal } from "../AddressInputModal";

vi.mock("../../../../assets/x.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../../../Modal/Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock("../../../../common/inputs", () => ({
  Checkbox: ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (event: { target: { checked: boolean } }) => void;
  }) => (
    <input
      type="checkbox"
      aria-label="Acknowledge"
      checked={checked}
      onChange={onChange}
    />
  ),
}));

vi.mock("../../../../../hooks/places", () => ({
  AUTOCOMPLETE_MIN_CHARS: 3,
  useAutocompleteAddresses: () => ({ data: undefined }),
}));

const renderModal = (onSave = vi.fn()) => {
  render(
    <AddressInputModal
      isOpen
      onClose={vi.fn()}
      onSave={onSave}
      isSaving={false}
    />,
  );
  return onSave;
};

const getTextarea = () =>
  screen.getByPlaceholderText(/For example: 123 Main St/i);

const getSaveButton = () =>
  screen.getByRole("button", { name: /Add Address & Mark as Complete/i });

const typeAddress = (value: string) =>
  fireEvent.change(getTextarea(), { target: { value } });

const acknowledge = () => fireEvent.click(screen.getByLabelText("Acknowledge"));

const overLimitAddress = "a".repeat(HOME_PLAN_ADDRESS_MAX_LENGTH + 1);

test("flags an address over the max length and blocks the save", () => {
  const onSave = renderModal();

  typeAddress(overLimitAddress);
  acknowledge();

  expect(
    screen.getByText(
      `Address must be ${HOME_PLAN_ADDRESS_MAX_LENGTH} characters or fewer.`,
    ),
  ).toBeInTheDocument();
  expect(getTextarea()).toHaveAttribute("aria-invalid", "true");
  expect(getSaveButton()).toBeDisabled();

  fireEvent.click(getSaveButton());
  expect(onSave).not.toHaveBeenCalled();
});

test("clears the error once the address is back within the limit", () => {
  const onSave = renderModal();

  typeAddress(overLimitAddress);
  typeAddress("123 Main St, Boise, ID");
  acknowledge();

  expect(
    screen.queryByText(
      `Address must be ${HOME_PLAN_ADDRESS_MAX_LENGTH} characters or fewer.`,
    ),
  ).not.toBeInTheDocument();

  fireEvent.click(getSaveButton());
  expect(onSave).toHaveBeenCalledExactlyOnceWith("123 Main St, Boise, ID");
});

test("accepts an address exactly at the max length", () => {
  const onSave = renderModal();
  const maxAddress = "a".repeat(HOME_PLAN_ADDRESS_MAX_LENGTH);

  typeAddress(maxAddress);
  acknowledge();

  expect(getTextarea()).toHaveAttribute("aria-invalid", "false");
  fireEvent.click(getSaveButton());
  expect(onSave).toHaveBeenCalledExactlyOnceWith(maxAddress);
});
