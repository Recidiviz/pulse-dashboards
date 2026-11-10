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

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { USER_ROLE } from "~@idaho-th/shared";

import {
  buildIdahoTHStore,
  renderWithStore,
} from "../../../test/renderWithStore";
import { HousingProviderSelectionScreen } from "../HousingProviderSelectionScreen";

const hooks = vi.hoisted(() => ({ switchHousingProvider: vi.fn() }));

vi.mock("../../../hooks/housingProvider", () => ({
  useSwitchHousingProvider: () => hooks.switchHousingProvider,
}));

const renderScreen = (
  housingProviders: React.ComponentProps<
    typeof HousingProviderSelectionScreen
  >["housingProviders"],
) =>
  renderWithStore(
    <HousingProviderSelectionScreen housingProviders={housingProviders} />,
    { store: buildIdahoTHStore({ role: USER_ROLE.PROVIDER }) },
  );

beforeEach(() => {
  hooks.switchHousingProvider.mockClear();
});

describe("HousingProviderSelectionScreen", () => {
  it("shows a singular location count", () => {
    renderScreen([
      {
        id: "a",
        name: "Sunrise House",
        locationsCount: 1,
        districts: ["District 1"],
      },
    ]);

    expect(screen.getByText("1 location")).toBeInTheDocument();
  });

  it("shows a plural location count, never the districts", () => {
    renderScreen([
      {
        id: "a",
        name: "Sunrise House",
        locationsCount: 3,
        districts: ["District 1", "District 3"],
      },
    ]);

    expect(screen.getByText("3 locations")).toBeInTheDocument();
    // The card shows locations only, even though the API also sends districts.
    expect(screen.queryByText(/district/i)).not.toBeInTheDocument();
  });

  it("omits the count and district when missing or empty, never showing 0 locations", () => {
    renderScreen([
      { id: "a", name: "Sunrise House" },
      { id: "b", name: "Lakeside Home", locationsCount: 0, districts: [] },
    ]);

    expect(screen.getByText("Sunrise House")).toBeInTheDocument();
    expect(screen.getByText("Lakeside Home")).toBeInTheDocument();
    expect(screen.queryByText(/location/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/district/i)).not.toBeInTheDocument();
  });

  it("switches to the provider whose card is clicked", async () => {
    const provider = { id: "a", name: "Sunrise House", locationsCount: 2 };
    renderScreen([provider]);

    await userEvent.click(
      screen.getByRole("button", { name: /sunrise house/i }),
    );

    expect(hooks.switchHousingProvider).toHaveBeenCalledWith(provider);
  });

  it("shows a back button only when there is a provider to go back to", async () => {
    const onBack = vi.fn();
    const providers = [{ id: "a", name: "Sunrise House" }];
    const { unmount } = renderScreen(providers);
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
    unmount();

    renderWithStore(
      <HousingProviderSelectionScreen
        housingProviders={providers}
        onBack={onBack}
      />,
      { store: buildIdahoTHStore({ role: USER_ROLE.PROVIDER }) },
    );
    await userEvent.click(screen.getByRole("button", { name: /back/i }));

    expect(onBack).toHaveBeenCalledOnce();
    expect(hooks.switchHousingProvider).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderScreen([
      {
        id: "a",
        name: "Sunrise House",
        locationsCount: 2,
        districts: ["District 1"],
      },
    ]);

    expect(await axe(container)).toHaveNoViolations();
  });
});
