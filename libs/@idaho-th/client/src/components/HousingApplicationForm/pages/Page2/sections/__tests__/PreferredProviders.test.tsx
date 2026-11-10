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
import { describe, expect, it, vi } from "vitest";

import { FormContextProvider } from "../../../../FormContext/FormContext";
import { useHousingApplicationForm } from "../../../../hooks/useHousingApplicationForm";
import { PreferredProviders } from "../PreferredProviders";

// Two providers share a display name (a real rename collision) so the
// "already chosen in another slot" dedupe can be proven to key off id, not name.
const providers = [
  { id: "provider-1", name: "Acme Transitional House", email: null },
  { id: "provider-2", name: "Acme Transitional House", email: null },
  { id: "provider-3", name: "Bay Shelter", email: null },
];

vi.mock("../../../../../../hooks/housingApplication", () => ({
  useHousingProviders: () => ({ providers, isPending: false }),
}));

function Harness() {
  const formApi = useHousingApplicationForm(undefined);
  return (
    <FormContextProvider value={formApi}>
      <PreferredProviders />
    </FormContextProvider>
  );
}

function combobox(slot: number) {
  return screen.getByRole("combobox", {
    name: `Preferred Provider ${slot} (Q30)`,
  });
}

function displayedValue(slot: number) {
  return combobox(slot).closest(".searchable-select__value-container")
    ?.textContent;
}

describe("PreferredProviders", () => {
  it("binds each option's value to the provider id and its label to the provider name", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(combobox(1));
    await user.click(screen.getByRole("option", { name: "Bay Shelter" }));

    expect(displayedValue(1)).toBe("Bay Shelter");
  });

  it("dedupes an already-selected provider from the other slots by id, not by display name", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(combobox(2));
    expect(
      screen.getAllByRole("option", { name: "Acme Transitional House" }),
    ).toHaveLength(2);
    await user.keyboard("{Escape}");

    // Select the first "Acme Transitional House" entry (provider-1) in slot 1.
    await user.click(combobox(1));
    await user.click(
      screen.getAllByRole("option", { name: "Acme Transitional House" })[0],
    );
    expect(displayedValue(1)).toBe("Acme Transitional House");

    // Slot 2 must still offer the *other* provider sharing that name — only
    // the selected id (provider-1) is removed, not every same-named option.
    await user.click(combobox(2));
    expect(
      screen.getAllByRole("option", { name: "Acme Transitional House" }),
    ).toHaveLength(1);
    expect(
      screen.getByRole("option", { name: "Bay Shelter" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });
});
