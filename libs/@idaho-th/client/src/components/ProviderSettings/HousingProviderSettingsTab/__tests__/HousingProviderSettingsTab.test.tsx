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

import { PROVIDER_CONTACT_MAX_LENGTH } from "~@idaho-th/shared";

import type { ProviderDetails } from "../../../../hooks/housingApplication";
import { HousingProviderSettingsTab } from "../HousingProviderSettingsTab";

const testDoubles = vi.hoisted(() => ({
  updateHousingProvider: { mutate: vi.fn(), isPending: false },
}));

vi.mock("../../../../hooks/providerSettings", () => ({
  useUpdateHousingProvider: () => testDoubles.updateHousingProvider,
}));

const PROVIDER: ProviderDetails = {
  housingProviderName: "Acme Housing",
  contactName: "Jane Doe",
  contactEmail: "contact@acmehousing.org",
  contactPhone: "555-0100",
  locations: [],
};

describe("HousingProviderSettingsTab", () => {
  beforeEach(() => {
    testDoubles.updateHousingProvider = { mutate: vi.fn(), isPending: false };
  });

  it("offers no personal fields: those belong to the other mutation", () => {
    render(<HousingProviderSettingsTab provider={PROVIDER} />);

    expect(
      screen.getByRole("button", { name: "Edit Provider name" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit Name" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit Phone" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("contact@acmehousing.org"),
    ).not.toBeInTheDocument();
  });

  it("saves a rename with the name alone, naming no provider id", async () => {
    const user = userEvent.setup();
    render(<HousingProviderSettingsTab provider={PROVIDER} />);

    await user.click(
      screen.getByRole("button", { name: "Edit Provider name" }),
    );
    const input = screen.getByRole("textbox", { name: "Provider name" });
    await user.clear(input);
    await user.type(input, "Renamed Housing");
    await user.click(
      screen.getByRole("button", { name: "Save Provider name" }),
    );

    // Exactly this shape: the server picks the record from the verified
    // context, so a caller-supplied id would be a way to edit the wrong one.
    expect(testDoubles.updateHousingProvider.mutate).toHaveBeenCalledWith({
      housingProviderName: "Renamed Housing",
    });
  });

  it("blocks saving an empty provider name", async () => {
    const user = userEvent.setup();
    render(<HousingProviderSettingsTab provider={PROVIDER} />);

    await user.click(
      screen.getByRole("button", { name: "Edit Provider name" }),
    );
    await user.clear(screen.getByRole("textbox", { name: "Provider name" }));
    await user.click(
      screen.getByRole("button", { name: "Save Provider name" }),
    );

    expect(screen.getByText("Provider name is required")).toBeInTheDocument();
    expect(testDoubles.updateHousingProvider.mutate).not.toHaveBeenCalled();
  });

  it("stops input at the maximum provider name length", async () => {
    const user = userEvent.setup();
    const maxLength = PROVIDER_CONTACT_MAX_LENGTH.housingProviderName;
    render(<HousingProviderSettingsTab provider={PROVIDER} />);

    await user.click(
      screen.getByRole("button", { name: "Edit Provider name" }),
    );
    const input = screen.getByRole("textbox", { name: "Provider name" });
    await user.clear(input);
    await user.type(input, "a".repeat(maxLength + 5));

    expect(input).toHaveValue("a".repeat(maxLength));
  });

  it("sends no request when the name is saved unchanged", async () => {
    const user = userEvent.setup();
    render(<HousingProviderSettingsTab provider={PROVIDER} />);

    await user.click(
      screen.getByRole("button", { name: "Edit Provider name" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Save Provider name" }),
    );

    expect(testDoubles.updateHousingProvider.mutate).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("textbox", { name: "Provider name" }),
    ).not.toBeInTheDocument();
  });

  it("cancel restores the original name", async () => {
    const user = userEvent.setup();
    render(<HousingProviderSettingsTab provider={PROVIDER} />);

    await user.click(
      screen.getByRole("button", { name: "Edit Provider name" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Provider name" }),
      " Annex",
    );
    await user.click(
      screen.getByRole("button", { name: "Cancel editing Provider name" }),
    );

    expect(screen.getByText("Acme Housing")).toBeInTheDocument();
    expect(testDoubles.updateHousingProvider.mutate).not.toHaveBeenCalled();
  });

  it("has no accessibility violations while the name is being edited", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <HousingProviderSettingsTab provider={PROVIDER} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Edit Provider name" }),
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
