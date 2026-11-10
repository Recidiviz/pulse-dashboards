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
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { FormContextProvider } from "../../../FormContext/FormContext";
import { useHousingApplicationForm } from "../../../hooks/useHousingApplicationForm";
import { DropdownSelect } from "../DropdownSelect";

vi.mock("../../../../../hooks/housingApplication", () => ({
  useHousingProviders: () => ({ data: [] }),
}));

vi.mock("../../../../assets/tabler-icon-alert-triangle.svg?react", () => ({
  default: () => <svg data-testid="alert-icon" />,
}));

vi.mock("../../../../assets/tabler-icon-check.svg?react", () => ({
  default: () => <svg data-testid="check-icon" />,
}));

const OPTIONS = ["Parole", "Probation", "Rider"] as const;

function DropdownHarness({ placeholder }: { placeholder?: string } = {}) {
  const formApi = useHousingApplicationForm(undefined);
  return (
    <FormContextProvider value={formApi}>
      <DropdownSelect
        name="legalCurrentStatus"
        label="Current Status"
        options={OPTIONS}
        {...(placeholder ? { placeholder } : {})}
      />
    </FormContextProvider>
  );
}

function combobox() {
  return screen.getByRole("combobox", { name: "Current Status" });
}

describe("DropdownSelect", () => {
  it("shows the placeholder and stays closed until clicked", () => {
    render(<DropdownHarness />);

    expect(combobox()).toHaveValue("Select…");
    expect(combobox()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("accepts a custom placeholder", () => {
    render(<DropdownHarness placeholder="Choose a status" />);

    expect(combobox()).toHaveValue("Choose a status");
  });

  it("opens the option list on click", async () => {
    const user = userEvent.setup();
    render(<DropdownHarness />);

    await user.click(combobox());

    expect(combobox()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option").map((el) => el.textContent)).toEqual([
      ...OPTIONS,
    ]);
  });

  it("closes again on a second click", async () => {
    const user = userEvent.setup();
    render(<DropdownHarness />);

    await user.click(combobox());
    await user.click(combobox());

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selects an option, closes, and marks it selected when reopened", async () => {
    const user = userEvent.setup();
    render(<DropdownHarness />);

    await user.click(combobox());
    await user.click(screen.getByRole("option", { name: "Probation" }));

    expect(combobox()).toHaveValue("Probation");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(combobox());
    expect(screen.getByRole("option", { name: "Probation" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: "Parole" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<DropdownHarness />);
    await user.click(combobox());

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("ignores other keys while open", async () => {
    const user = userEvent.setup();
    render(<DropdownHarness />);
    await user.click(combobox());

    await user.keyboard("{Enter}");

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("closes on a click outside", async () => {
    const user = userEvent.setup();
    render(
      <>
        <DropdownHarness />
        <button type="button">elsewhere</button>
      </>,
    );
    await user.click(combobox());

    await user.click(screen.getByRole("button", { name: "elsewhere" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("stays open for a click inside the menu", async () => {
    const user = userEvent.setup();
    render(<DropdownHarness />);
    await user.click(combobox());

    await user.click(screen.getByRole("listbox"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("detaches its document listeners once closed", async () => {
    // The listeners are attached to `document`, so a leak here would keep
    // closing dropdowns that are no longer mounted.
    const user = userEvent.setup();
    const removeSpy = vi.spyOn(document, "removeEventListener");
    render(<DropdownHarness />);

    await user.click(combobox());
    await user.keyboard("{Escape}");

    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("is not typeable — the value comes from the option list only", async () => {
    const user = userEvent.setup();
    render(<DropdownHarness />);

    await user.type(combobox(), "Parole");

    expect(combobox()).toHaveValue("Select…");
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(<DropdownHarness />);

    await user.click(combobox());

    expect(await axe(container)).toHaveNoViolations();
  });
});
