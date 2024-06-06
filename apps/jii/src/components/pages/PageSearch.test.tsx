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
import { configure, flowResult } from "mobx";
import { MemoryRouter } from "react-router-dom";

import { RootStore } from "../../datastores/RootStore";
import * as hooks from "../StoreProvider/useRootStore";
import { PageSearch } from "./PageSearch";

let rootStore: RootStore;

beforeEach(async () => {
  configure({ safeDescriptors: false });
  rootStore = new RootStore();
  await flowResult(rootStore.populateResidentsStore());
  vi.spyOn(hooks, "useRootStore").mockReturnValue(rootStore);
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("it should render the search page", async () => {
  vi.spyOn(
    rootStore.userStore.authClient,
    "appMetadata",
    "get",
  ).mockReturnValue({ stateCode: "US_ME", permissions: ["enhanced"] });

  render(
    <MemoryRouter>
      <PageSearch />
    </MemoryRouter>,
  );

  await waitFor(() =>
    expect(screen.getByText("Select a resident")).toBeInTheDocument(),
  );
});

test("it should not render the search page", async () => {
  vi.spyOn(
    rootStore.userStore.authClient,
    "appMetadata",
    "get",
  ).mockReturnValue({ stateCode: "US_ME", permissions: [] });

  render(
    <MemoryRouter>
      <PageSearch />
    </MemoryRouter>,
  );

  await waitFor(() =>
    expect(screen.getByText("Authorization required")).toBeInTheDocument(),
  );
});
