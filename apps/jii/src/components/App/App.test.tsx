// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { render, screen, waitFor } from "@testing-library/react";
import { configure, runInAction } from "mobx";
import { MemoryRouter } from "react-router-dom";

import { outputFixture, usMeResidents } from "~datatypes";

import { RootStore } from "../../datastores/RootStore";
import * as hooks from "../StoreProvider/useRootStore";
import { App } from "./App";

describe("App", () => {
  it("should render successfully", () => {
    const { baseElement } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(baseElement).toBeInTheDocument();
  });

  it("should not render the search page", async () => {
    render(
      <MemoryRouter initialEntries={["/eligibility/search"]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("This page cannot be loaded."),
      ).toBeInTheDocument(),
    );
  });

  it("should render the search page", async () => {
    configure({ safeDescriptors: false });

    const rootStore = new RootStore();
    vi.spyOn(hooks, "useRootStore").mockReturnValue(rootStore);
    vi.spyOn(
      rootStore.userStore,
      "hasEnhancedPermission",
      "get",
    ).mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/eligibility/search"]}>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByText("Select a resident")).toBeInTheDocument(),
    );

    configure({ safeDescriptors: true });
  });

  it("should render the sccp page as the user's homepage", async () => {
    const rootStore = new RootStore();
    vi.spyOn(hooks, "useRootStore").mockReturnValue(rootStore);
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    runInAction(() => {
      // @ts-expect-error hacking this since the real feature is not implemented yet
      rootStore.userStore.externalIdOverride = outputFixture(
        usMeResidents[0],
      ).personExternalId;
    });

    await waitFor(() =>
      expect(screen.getByText("SCCP", { exact: false })).toBeInTheDocument(),
    );
  });

  it("should render the sccp page", async () => {
    const rootStore = new RootStore();
    vi.spyOn(hooks, "useRootStore").mockReturnValue(rootStore);
    render(
      <MemoryRouter initialEntries={["/eligibility/sccp"]}>
        <App />
      </MemoryRouter>,
    );

    runInAction(() => {
      // @ts-expect-error hacking this since the real feature is not implemented yet
      rootStore.userStore.externalIdOverride = outputFixture(
        usMeResidents[0],
      ).personExternalId;
    });

    await waitFor(() =>
      expect(screen.getByText("SCCP", { exact: false })).toBeInTheDocument(),
    );
  });

  it("should render the sccp about page", async () => {
    render(
      <MemoryRouter initialEntries={["/eligibility/sccp/about"]}>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByText("about opportunity")).toBeInTheDocument(),
    );
  });

  it("should render the sccp requirements page", async () => {
    render(
      <MemoryRouter initialEntries={["/eligibility/sccp/requirements"]}>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByText("opportunity requirements")).toBeInTheDocument(),
    );
  });
});
