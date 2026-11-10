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

import {
  CHILD_FAMILY_SERVICES_DOCUMENTATION_OPTIONS,
  DISTRICT_OPTIONS,
} from "~@idaho-th/shared";

import { FormContextProvider } from "../../../FormContext/FormContext";
import { useHousingApplicationForm } from "../../../hooks/useHousingApplicationForm";
import { MultiSelectDropdown } from "../MultiSelectDropdown";

vi.mock("../../../../../hooks/housingApplication", () => ({
  useHousingProviders: () => ({ data: [] }),
}));

vi.mock("../../../../assets/tabler-icon-alert-triangle.svg?react", () => ({
  default: () => <svg data-testid="alert-icon" />,
}));

vi.mock("../../../../assets/tabler-icon-check.svg?react", () => ({
  default: () => <svg data-testid="check-icon" />,
}));

function MultiSelectHarness() {
  const formApi = useHousingApplicationForm(undefined);
  return (
    <FormContextProvider value={formApi}>
      <MultiSelectDropdown
        name="preferredDistrict"
        label="Preferred District"
        options={DISTRICT_OPTIONS}
      />
    </FormContextProvider>
  );
}

function NoneOptionHarness() {
  const formApi = useHousingApplicationForm(undefined);
  return (
    <FormContextProvider value={formApi}>
      <MultiSelectDropdown
        name="childFamilyServicesDocumentation"
        label="Documentation"
        options={CHILD_FAMILY_SERVICES_DOCUMENTATION_OPTIONS}
      />
    </FormContextProvider>
  );
}

describe("MultiSelectDropdown", () => {
  it("toggles multiple options and clears the selection", async () => {
    const user = userEvent.setup();
    render(<MultiSelectHarness />);

    const combobox = screen.getByRole("combobox", {
      name: "Preferred District",
    });
    expect(combobox).toHaveValue("Select…");

    await user.click(combobox);
    await user.click(screen.getByRole("option", { name: "D1" }));
    await user.click(screen.getByRole("option", { name: "D3" }));

    expect(combobox).toHaveValue("D1, D3");

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(combobox).toHaveValue("Select…");
  });

  it('keeps "None" mutually exclusive with the other options', async () => {
    const user = userEvent.setup();
    render(<NoneOptionHarness />);

    const combobox = screen.getByRole("combobox", { name: "Documentation" });
    await user.click(combobox);

    await user.click(screen.getByRole("option", { name: "Supervision Order" }));
    await user.click(screen.getByRole("option", { name: "Custody Agreement" }));
    expect(combobox).toHaveValue("Supervision Order, Custody Agreement");

    await user.click(screen.getByRole("option", { name: "None" }));
    expect(combobox).toHaveValue("None");

    await user.click(
      screen.getByRole("option", { name: "Order of Guardianship" }),
    );
    expect(combobox).toHaveValue("Order of Guardianship");
  });

  it('clears the selection when "None" is deselected', async () => {
    const user = userEvent.setup();
    render(<NoneOptionHarness />);

    const combobox = screen.getByRole("combobox", { name: "Documentation" });
    await user.click(combobox);

    await user.click(screen.getByRole("option", { name: "None" }));
    expect(combobox).toHaveValue("None");

    await user.click(screen.getByRole("option", { name: "None" }));
    expect(combobox).toHaveValue("Select…");
  });
});
