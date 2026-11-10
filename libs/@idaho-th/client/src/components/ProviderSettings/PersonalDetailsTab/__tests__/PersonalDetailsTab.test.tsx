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
import { PersonalDetailsTab } from "../PersonalDetailsTab";

const testDoubles = vi.hoisted(() => ({
  updateProfile: { mutate: vi.fn(), isPending: false, variables: undefined },
}));

vi.mock("../../../../hooks/providerSettings", () => ({
  useUpdateProviderProfile: () => testDoubles.updateProfile,
}));

const PROVIDER: ProviderDetails = {
  housingProviderName: "Acme Housing",
  contactName: "Jane Doe",
  contactEmail: "contact@acmehousing.org",
  contactPhone: "555-0100",
  locations: [],
};

describe("PersonalDetailsTab", () => {
  beforeEach(() => {
    testDoubles.updateProfile = {
      mutate: vi.fn(),
      isPending: false,
      variables: undefined,
    };
  });

  it("offers no provider field: that belongs to the other mutation", () => {
    render(<PersonalDetailsTab provider={PROVIDER} />);

    expect(
      screen.getByRole("button", { name: "Edit Name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit Phone" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit Provider name" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Acme Housing")).not.toBeInTheDocument();
  });

  it("shows the email but offers no way to edit it", () => {
    render(<PersonalDetailsTab provider={PROVIDER} />);

    expect(screen.getByText("contact@acmehousing.org")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit Email" }),
    ).not.toBeInTheDocument();
  });

  it("saves the name on its own", async () => {
    const user = userEvent.setup();
    render(<PersonalDetailsTab provider={PROVIDER} />);

    await user.click(screen.getByRole("button", { name: "Edit Name" }));
    const input = screen.getByRole("textbox", { name: "Name" });
    await user.clear(input);
    await user.type(input, "John Doe{Enter}");

    expect(testDoubles.updateProfile.mutate).toHaveBeenCalledWith({
      contactName: "John Doe",
    });
  });

  it("refuses to clear the name, because the user record requires one", async () => {
    const user = userEvent.setup();
    render(<PersonalDetailsTab provider={PROVIDER} />);

    await user.click(screen.getByRole("button", { name: "Edit Name" }));
    await user.clear(screen.getByRole("textbox", { name: "Name" }));
    await user.click(screen.getByRole("button", { name: "Save Name" }));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(testDoubles.updateProfile.mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  });

  it("stops the name at its maximum length", async () => {
    const user = userEvent.setup();
    const maxLength = PROVIDER_CONTACT_MAX_LENGTH.contactName;
    render(<PersonalDetailsTab provider={PROVIDER} />);

    await user.click(screen.getByRole("button", { name: "Edit Name" }));
    const input = screen.getByRole("textbox", { name: "Name" });
    await user.clear(input);
    await user.type(input, "a".repeat(maxLength + 5));

    expect(input).toHaveValue("a".repeat(maxLength));
  });

  it("masks the phone as it is typed and saves it as typed", async () => {
    const user = userEvent.setup();
    render(<PersonalDetailsTab provider={PROVIDER} />);

    await user.click(screen.getByRole("button", { name: "Edit Phone" }));
    const input = screen.getByRole("textbox", { name: "Phone" });
    await user.clear(input);
    await user.type(input, "abc2085550199xyz");

    expect(input).toHaveValue("208-555-0199");

    await user.click(screen.getByRole("button", { name: "Save Phone" }));

    expect(testDoubles.updateProfile.mutate).toHaveBeenCalledWith({
      contactPhone: "208-555-0199",
    });
  });

  it("opening a second editor closes the first and discards its changes", async () => {
    const user = userEvent.setup();
    render(<PersonalDetailsTab provider={PROVIDER} />);

    await user.click(screen.getByRole("button", { name: "Edit Name" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), " extra");
    await user.click(screen.getByRole("button", { name: "Edit Phone" }));

    expect(
      screen.queryByRole("textbox", { name: "Name" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("Escape cancels the edit and restores the original value", async () => {
    const user = userEvent.setup();
    render(<PersonalDetailsTab provider={PROVIDER} />);

    await user.click(screen.getByRole("button", { name: "Edit Name" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), " extra");
    await user.keyboard("{Escape}");

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("sends no request when a field is saved without an edit", async () => {
    const user = userEvent.setup();
    render(<PersonalDetailsTab provider={PROVIDER} />);

    await user.click(screen.getByRole("button", { name: "Edit Name" }));
    await user.click(screen.getByRole("button", { name: "Save Name" }));

    expect(testDoubles.updateProfile.mutate).not.toHaveBeenCalled();
  });

  it("closes a legacy-invalid phone without erroring when saved unchanged", async () => {
    const user = userEvent.setup();
    render(<PersonalDetailsTab provider={PROVIDER} />);

    await user.click(screen.getByRole("button", { name: "Edit Phone" }));
    await user.click(screen.getByRole("button", { name: "Save Phone" }));

    expect(testDoubles.updateProfile.mutate).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("textbox", { name: "Phone" }),
    ).not.toBeInTheDocument();
  });

  it("has no accessibility violations while a field is being edited", async () => {
    const user = userEvent.setup();
    const { container } = render(<PersonalDetailsTab provider={PROVIDER} />);

    await user.click(screen.getByRole("button", { name: "Edit Name" }));

    expect(await axe(container)).toHaveNoViolations();
  });
});
