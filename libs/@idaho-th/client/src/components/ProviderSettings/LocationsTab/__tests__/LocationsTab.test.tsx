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

import type { HousingProviderLocation } from "~@idaho-th/client/interfaces/common";

import { LocationsTab } from "../LocationsTab";

const testDoubles = vi.hoisted(() => ({
  updateProviderLocation: {
    mutate: vi.fn(),
    isPending: false,
    variables: undefined as { locationId: string } | undefined,
  },
}));

vi.mock("../../../../hooks/housingApplication", () => ({
  useUpdateProviderLocation: () => testDoubles.updateProviderLocation,
}));

const LOCATIONS: HousingProviderLocation[] = [
  {
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
  },
  {
    id: "loc-2",
    streetAddress: "456 Oak Ave",
    city: "Meridian",
    state: "ID",
    zip: "83642",
    district: "D3",
    acceptedGenders: ["MALE"],
    acceptsRiders: false,
    acceptsSexOffenders: true,
    acceptsViolentCriminals: true,
    faithBased: true,
  },
];

describe("LocationsTab", () => {
  beforeEach(() => {
    testDoubles.updateProviderLocation = {
      mutate: vi.fn(),
      isPending: false,
      variables: undefined,
    };
  });

  it("shows an empty state when there are no locations", () => {
    render(<LocationsTab locations={[]} />);

    expect(screen.getByText("No locations available.")).toBeInTheDocument();
  });

  it("renders an edit control on every card", () => {
    render(<LocationsTab locations={LOCATIONS} />);

    expect(
      screen.getAllByRole("button", { name: "Edit location" }),
    ).toHaveLength(2);
  });

  it("opening a second card's editor closes the first", async () => {
    const user = userEvent.setup();
    render(<LocationsTab locations={LOCATIONS} />);

    const [firstEdit, secondEdit] = screen.getAllByRole("button", {
      name: "Edit location",
    });
    await user.click(firstEdit);
    await user.clear(screen.getByRole("textbox", { name: "City" }));
    await user.type(screen.getByRole("textbox", { name: "City" }), "Nampa");

    await user.click(secondEdit);

    expect(screen.getAllByRole("textbox", { name: "City" })).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "City" })).toHaveValue(
      "Meridian",
    );
    expect(screen.getByText("Boise, ID 83702")).toBeInTheDocument();
  });

  it("saving closes the editor immediately and sends the location id with the edited field", async () => {
    const user = userEvent.setup();
    render(<LocationsTab locations={LOCATIONS} />);

    await user.click(
      screen.getAllByRole("button", { name: "Edit location" })[0],
    );
    await user.clear(screen.getByRole("textbox", { name: "City" }));
    await user.type(screen.getByRole("textbox", { name: "City" }), "Nampa");
    await user.click(screen.getByRole("button", { name: "Save location" }));

    expect(testDoubles.updateProviderLocation.mutate).toHaveBeenCalledWith({
      locationId: "loc-1",
      city: "Nampa",
    });
    expect(
      screen.queryByRole("textbox", { name: "Street address" }),
    ).not.toBeInTheDocument();
  });

  it("sends no request when the card is saved without an edit", async () => {
    const user = userEvent.setup();
    render(<LocationsTab locations={LOCATIONS} />);

    await user.click(
      screen.getAllByRole("button", { name: "Edit location" })[0],
    );
    await user.click(screen.getByRole("button", { name: "Save location" }));

    expect(testDoubles.updateProviderLocation.mutate).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("textbox", { name: "Street address" }),
    ).not.toBeInTheDocument();
  });
});
