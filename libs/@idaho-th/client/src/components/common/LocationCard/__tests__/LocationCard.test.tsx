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

import type { HousingProviderLocation } from "~@idaho-th/client/interfaces/common";

import { LocationCard } from "../LocationCard";

// SearchableSelect (react-select) shows the chosen option's label in its own
// value-container element rather than as the combobox input's value.
const expectSearchableSelectValue = (label: string, value: string) => {
  const combobox = screen.getByRole("combobox", { name: label });
  const valueContainer = combobox.closest(
    ".searchable-select__value-container",
  );
  expect(valueContainer).toHaveTextContent(value);
};

const LOCATION: HousingProviderLocation = {
  id: "loc-1",
  streetAddress: "123 Main St",
  city: "Boise",
  state: "ID",
  zip: "83702",
  district: "D1",
  acceptedGenders: ["ALL"],
  acceptsRiders: true,
  acceptsSexOffenders: false,
  acceptsViolentCriminals: false,
  faithBased: false,
};

describe("LocationCard — staff", () => {
  it("hides the street address and city/state/zip, with no edit control", () => {
    render(<LocationCard location={LOCATION} viewerRole="staff" />);

    expect(screen.queryByText("123 Main St")).not.toBeInTheDocument();
    expect(screen.queryByText("Boise, ID 83702")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit location" }),
    ).not.toBeInTheDocument();
  });

  it("shows the district as a read-only row", () => {
    render(<LocationCard location={LOCATION} viewerRole="staff" />);

    expect(screen.getByText("District")).toBeInTheDocument();
    expect(screen.getByText("D1")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <LocationCard location={LOCATION} viewerRole="staff" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("LocationCard — provider", () => {
  it("shows the street address and an edit control in the header", () => {
    render(<LocationCard location={LOCATION} viewerRole="provider" />);

    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("Boise, ID 83702")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit location" }),
    ).toBeInTheDocument();
  });

  it("turns the whole card into a form when editing, pre-filled with current values", () => {
    render(
      <LocationCard location={LOCATION} viewerRole="provider" isEditing />,
    );

    expect(screen.getByRole("textbox", { name: "Street address" })).toHaveValue(
      "123 Main St",
    );
    expect(screen.getByRole("textbox", { name: "City" })).toHaveValue("Boise");
    expect(screen.getByRole("textbox", { name: "ZIP" })).toHaveValue("83702");
    expect(
      screen.queryByRole("combobox", { name: "State" }),
    ).not.toBeInTheDocument();
    expectSearchableSelectValue("District", "D1");
    expectSearchableSelectValue("Population", "All");
    expectSearchableSelectValue("Accepts Riders", "Yes");
    expect(
      screen.getByRole("button", { name: "Save location" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel editing location" }),
    ).toBeInTheDocument();
  });

  it("cancelling restores every field and exits edit mode", async () => {
    const user = userEvent.setup();
    const onCancelEdit = vi.fn();
    render(
      <LocationCard
        location={LOCATION}
        viewerRole="provider"
        isEditing
        onCancelEdit={onCancelEdit}
      />,
    );

    await user.clear(screen.getByRole("textbox", { name: "City" }));
    await user.type(screen.getByRole("textbox", { name: "City" }), "Nampa");
    await user.click(
      screen.getByRole("button", { name: "Cancel editing location" }),
    );

    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });

  it("Enter saves the edit", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <LocationCard
        location={LOCATION}
        viewerRole="provider"
        isEditing
        onSave={onSave}
      />,
    );

    await user.clear(screen.getByRole("textbox", { name: "City" }));
    await user.type(screen.getByRole("textbox", { name: "City" }), "Nampa");
    await user.keyboard("{Enter}");

    expect(onSave).toHaveBeenCalledWith({ city: "Nampa" });
  });

  it("Escape cancels editing without closing anything else", async () => {
    const user = userEvent.setup();
    const onCancelEdit = vi.fn();
    render(
      <LocationCard
        location={LOCATION}
        viewerRole="provider"
        isEditing
        onCancelEdit={onCancelEdit}
      />,
    );

    await user.click(screen.getByRole("textbox", { name: "City" }));
    await user.keyboard("{Escape}");

    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });

  it("saving reports only the fields that changed", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <LocationCard
        location={LOCATION}
        viewerRole="provider"
        isEditing
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Population" }));
    await user.click(screen.getByRole("option", { name: "Women only" }));
    await user.clear(screen.getByRole("textbox", { name: "City" }));
    await user.type(screen.getByRole("textbox", { name: "City" }), "Nampa");
    await user.click(screen.getByRole("button", { name: "Save location" }));

    expect(onSave).toHaveBeenCalledWith({
      acceptedGender: "FEMALE",
      city: "Nampa",
    });
  });

  it("stays open with inline errors instead of saving an invalid address", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancelEdit = vi.fn();
    render(
      <LocationCard
        location={LOCATION}
        viewerRole="provider"
        isEditing
        onSave={onSave}
        onCancelEdit={onCancelEdit}
      />,
    );

    await user.clear(screen.getByRole("textbox", { name: "City" }));
    await user.clear(screen.getByRole("textbox", { name: "ZIP" }));
    await user.type(screen.getByRole("textbox", { name: "ZIP" }), "8370");
    await user.click(screen.getByRole("button", { name: "Save location" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(onCancelEdit).not.toHaveBeenCalled();
    expect(screen.getByText("City is required")).toBeInTheDocument();
    expect(
      screen.getByText("ZIP must be exactly 5 digits"),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "ZIP" })).toHaveValue("8370");
  });

  it("saves nothing and just closes when no field was edited", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancelEdit = vi.fn();
    render(
      <LocationCard
        location={LOCATION}
        viewerRole="provider"
        isEditing
        onSave={onSave}
        onCancelEdit={onCancelEdit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save location" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });

  it("saves nothing when a field is edited and then put back", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <LocationCard
        location={LOCATION}
        viewerRole="provider"
        isEditing
        onSave={onSave}
      />,
    );

    await user.clear(screen.getByRole("textbox", { name: "City" }));
    await user.type(screen.getByRole("textbox", { name: "City" }), "Boise");
    await user.click(screen.getByRole("button", { name: "Save location" }));

    expect(onSave).not.toHaveBeenCalled();
  });

  it("has no accessibility violations while editing", async () => {
    const { container } = render(
      <LocationCard location={LOCATION} viewerRole="provider" isEditing />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
