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
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Mock } from "vitest";

import type { ParoleBoardHost } from "~@parole-board/common";

import { useRootStore } from "../../../../components/StoreProvider";
import { PAROLE_PATHS } from "../../../views";
import { UsCoParolePublicCalendarView } from "../UsCoParolePublicCalendarView";

const { adminProps, adminFailure } = vi.hoisted(() => ({
  adminProps: [] as { host: ParoleBoardHost }[],
  adminFailure: { failing: false },
}));

vi.mock("~@parole-board/us-co", () => ({
  UsCoParoleCalendarAdmin: (props: { host: ParoleBoardHost }) => {
    if (adminFailure.failing) {
      throw new Error("Synthetic admin tool failure");
    }
    adminProps.push(props);
    return <div data-testid="admin" />;
  },
}));
vi.mock("../../../../components/StoreProvider", () => ({
  useRootStore: vi.fn(),
}));

const rootStore = {
  currentTenantId: "US_CO",
  userStore: { stateCode: "RECIDIVIZ" },
  tenantStore: { currentTenantConfig: {} },
  analyticsStore: {},
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={`${PAROLE_PATHS.publicCalendar}/*`}
          element={<UsCoParolePublicCalendarView />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("UsCoParolePublicCalendarView", () => {
  beforeEach(() => {
    adminProps.length = 0;
    adminFailure.failing = false;
    (useRootStore as Mock).mockReturnValue(rootStore);
  });

  it("shows the admin page skeleton while the admin tool's code loads", async () => {
    renderAt("/parole/public-calendar");

    expect(
      screen.getByRole("status", { name: "Loading the calendar" }),
    ).toBeInTheDocument();
    expect(await screen.findByTestId("admin")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("passes a host built from the root store", async () => {
    renderAt("/parole/public-calendar");
    await screen.findByTestId("admin");

    const { host } = adminProps[0];
    expect(host.currentTenantId).toBe("US_CO");
    expect(host.userStore).toBe(rootStore.userStore);
    expect(host.tenantStore).toBe(rootStore.tenantStore);
  });

  it("renders the admin tool for a path below /parole/public-calendar", async () => {
    renderAt("/parole/public-calendar/2026-10");

    expect(await screen.findByTestId("admin")).toBeInTheDocument();
  });

  it("offers Try again when the admin tool fails, and renders it again after a retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    adminFailure.failing = true;
    renderAt("/parole/public-calendar");

    const retry = await screen.findByRole("button", { name: "Try again" });
    expect(screen.queryByTestId("admin")).not.toBeInTheDocument();

    adminFailure.failing = false;
    await userEvent.click(retry);

    expect(await screen.findByTestId("admin")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
  });
});
