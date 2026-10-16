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
import { i18n as I18n } from "i18next";
import { I18nextProvider } from "react-i18next";

import { BottomSheet } from "~@jii/common-ui";

import { loadUsMaI18n, rentFilters } from "../__tests__/testUtils";
import { SelectedFilters } from "../filters/types";
import { FilterSheet } from "./FilterSheet";

let i18n: I18n;

beforeAll(async () => {
  i18n = await loadUsMaI18n();
});

const onApply = vi.fn();
const onClose = vi.fn();

// Renders the sheet inside a BottomSheet, as ResourceList does.
function renderSheet(appliedFilters: SelectedFilters = rentFilters()) {
  const sheet = (isOpen: boolean) => (
    <I18nextProvider i18n={i18n}>
      <BottomSheet
        isOpen={isOpen}
        onRequestClose={onClose}
        ariaLabel="Filters"
        hideCloseButton
      >
        <FilterSheet
          appliedFilters={appliedFilters}
          onApply={onApply}
          onClose={onClose}
        />
      </BottomSheet>
    </I18nextProvider>
  );
  const { rerender } = render(sheet(true));
  return {
    // Waits for the closing animation to unmount the content, as it would
    // before someone could tap the filter button again.
    reopen: async () => {
      rerender(sheet(false));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      rerender(sheet(true));
    },
  };
}

const chip = (name: string) => screen.getByRole("button", { name });
const applyButton = () =>
  screen.getByRole("button", { name: /Apply selected/ });

test("shows each rent option, with Apply disabled until something changes", () => {
  renderSheet();

  expect(screen.getByText("Rent (Weekly)")).toBeInTheDocument();
  expect(chip("Up to $150")).toHaveAttribute("aria-pressed", "false");
  expect(applyButton()).toHaveTextContent("Apply selected (0)");
  expect(applyButton()).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
});

test("applies the selected options and closes", () => {
  renderSheet();

  fireEvent.click(chip("Free"));
  fireEvent.click(chip("Over $200"));
  expect(chip("Free")).toHaveAttribute("aria-pressed", "true");
  expect(applyButton()).toHaveTextContent("Apply selected (2)");

  fireEvent.click(applyButton());

  expect(onApply).toHaveBeenCalledWith(rentFilters("free", "over200"));
  expect(onClose).toHaveBeenCalled();
});

test("Clear all then Apply removes applied filters", () => {
  renderSheet(rentFilters("free"));
  expect(applyButton()).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
  expect(applyButton()).toHaveTextContent("Apply selected (0)");
  fireEvent.click(applyButton());

  expect(onApply).toHaveBeenCalledWith(rentFilters());
});

test("Cancel closes without applying, and reopening drops the draft", async () => {
  const { reopen } = renderSheet(rentFilters("free"));

  fireEvent.click(chip("Based on income"));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

  expect(onClose).toHaveBeenCalled();
  expect(onApply).not.toHaveBeenCalled();

  await reopen();
  expect(chip("Based on income")).toHaveAttribute("aria-pressed", "false");
  expect(chip("Free")).toHaveAttribute("aria-pressed", "true");
});
