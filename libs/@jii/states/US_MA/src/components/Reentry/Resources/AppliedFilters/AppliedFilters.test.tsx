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
import { i18n as I18n } from "i18next";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";

import { loadUsMaI18n, rentFilters } from "../__tests__/testUtils";
import { NO_SELECTION } from "../filters/filterConfig";
import { SelectedFilters } from "../filters/types";
import { AppliedFilters } from "./AppliedFilters";

let i18n: I18n;

beforeAll(async () => {
  i18n = await loadUsMaI18n();
});

const onChange = vi.fn();
const onOpenSheet = vi.fn();

const ALL_RENT_IDS = [
  "free",
  "upTo150",
  "from151To175",
  "from176To200",
  "over200",
  "basedOnIncome",
  "notListed",
];

/** Renders AppliedFilters with the selection in state, as the URL would hold it. */
function renderFilters(initial: SelectedFilters) {
  const Harness = () => {
    const [applied, setApplied] = useState(initial);
    return (
      <AppliedFilters
        appliedFilters={applied}
        onChange={(filters) => {
          onChange(filters);
          setApplied(filters);
        }}
        onOpenSheet={onOpenSheet}
      />
    );
  };
  render(
    <I18nextProvider i18n={i18n}>
      <Harness />
    </I18nextProvider>,
  );
}

const button = (name: string | RegExp) => screen.getByRole("button", { name });
const queryButton = (name: string | RegExp) =>
  screen.queryByRole("button", { name });
const removeButtons = () =>
  screen.queryAllByRole("button", { name: /^Remove .* filter$/ });

test("shows a plain Filters button with nothing applied", () => {
  renderFilters(NO_SELECTION);

  fireEvent.click(button("Filters"));

  expect(onOpenSheet).toHaveBeenCalled();
  expect(removeButtons()).toHaveLength(0);
  expect(queryButton("Clear all")).toBeNull();
});

test("counts applied filters and shows a chip for each, without Clear all for one", () => {
  renderFilters(rentFilters("over200"));

  expect(button("Filters (1)")).toBeInTheDocument();
  expect(button("Remove Over $200 filter")).toHaveTextContent("Over $200");
  expect(queryButton("Clear all")).toBeNull();
});

test("removing a chip drops its filter and focuses the next chip", () => {
  renderFilters(rentFilters("free", "upTo150", "over200"));

  fireEvent.click(button("Remove Up to $150 filter"));

  expect(onChange).toHaveBeenCalledWith(rentFilters("free", "over200"));
  expect(button("Filters (2)")).toBeInTheDocument();
  expect(button("Remove Over $200 filter")).toHaveFocus();
});

test("removing the last chip focuses the previous one", () => {
  renderFilters(rentFilters("free", "over200"));

  fireEvent.click(button("Remove Over $200 filter"));

  expect(button("Remove Free filter")).toHaveFocus();
});

test("removing the only chip focuses the Filters button", () => {
  renderFilters(rentFilters("free"));

  fireEvent.click(button("Remove Free filter"));

  expect(onChange).toHaveBeenCalledWith(rentFilters());
  expect(button("Filters")).toHaveFocus();
});

test("Clear all removes every filter and focuses the Filters button", () => {
  renderFilters(rentFilters("free", "over200"));

  fireEvent.click(button("Clear all"));

  expect(onChange).toHaveBeenCalledWith(NO_SELECTION);
  expect(removeButtons()).toHaveLength(0);
  expect(button("Filters")).toHaveFocus();
});

test("collapses chips past the fourth behind a toggle", () => {
  renderFilters(rentFilters(...ALL_RENT_IDS));

  expect(button("Filters (7)")).toBeInTheDocument();
  expect(removeButtons()).toHaveLength(4);
  expect(queryButton("Remove Rent not listed filter")).toBeNull();

  fireEvent.click(button("+3 more"));
  expect(removeButtons()).toHaveLength(7);
  expect(button("Remove Rent not listed filter")).toBeInTheDocument();

  fireEvent.click(button("Show less"));
  expect(removeButtons()).toHaveLength(4);
});

test("drops the toggle once the chips fit", () => {
  renderFilters(rentFilters(...ALL_RENT_IDS.slice(0, 5)));

  fireEvent.click(button("Remove Free filter"));

  expect(removeButtons()).toHaveLength(4);
  expect(queryButton(/more$/)).toBeNull();
});
