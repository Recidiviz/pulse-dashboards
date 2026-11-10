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

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import type { ProviderDetails } from "../../../hooks/housingApplication";
import { ProviderSettingsModal } from "../ProviderSettingsModal";

// react-modal marks the whole app element aria-hidden, which would hide the
// dialog's own contents from role queries. The modal chrome is not under test.
vi.mock("../../Modal/Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

const PROVIDER: ProviderDetails = {
  housingProviderName: "Acme Housing",
  contactName: "Jane Doe",
  contactEmail: "contact@acmehousing.org",
  contactPhone: "555-0100",
  locations: [],
};

const testDoubles = vi.hoisted(() => ({
  providerDetails: {
    data: undefined as ProviderDetails | undefined,
    isLoading: false,
    isError: false,
  },
}));

vi.mock("../../../hooks/housingApplication", () => ({
  useProviderDetails: () => testDoubles.providerDetails,
  useUpdateProviderLocation: () => ({
    mutate: vi.fn(),
    isPending: false,
    variables: undefined,
  }),
}));

vi.mock("../../../hooks/providerSettings", () => ({
  useUpdateHousingProvider: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateProviderProfile: () => ({
    mutate: vi.fn(),
    isPending: false,
    variables: undefined,
  }),
}));

function renderModal() {
  return render(<ProviderSettingsModal isOpen onClose={vi.fn()} />);
}

describe("ProviderSettingsModal", () => {
  beforeEach(() => {
    testDoubles.providerDetails = {
      data: PROVIDER,
      isLoading: false,
      isError: false,
    };
  });

  it("files provider settings and personal details under separate groups", () => {
    renderModal();

    const housingProviderGroup = screen.getByRole("group", {
      name: "Provider",
    });
    const personalGroup = screen.getByRole("group", { name: "Personal" });

    expect(
      within(housingProviderGroup).getByRole("button", {
        name: /Provider settings/,
      }),
    ).toBeInTheDocument();
    expect(
      within(housingProviderGroup).getByRole("button", { name: /Locations/ }),
    ).toBeInTheDocument();
    expect(
      within(housingProviderGroup).queryByRole("button", {
        name: /Personal details/,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(personalGroup).getByRole("button", { name: /Personal details/ }),
    ).toBeInTheDocument();
  });

  it("opens on the provider settings, which name no personal fields", () => {
    renderModal();

    expect(
      screen.getByRole("button", { name: "Edit Provider name" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit Phone" }),
    ).not.toBeInTheDocument();
  });

  it("shows only one group's fields at a time", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /Personal details/ }));

    expect(
      screen.getByRole("button", { name: "Edit Name" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit Provider name" }),
    ).not.toBeInTheDocument();
  });
});
