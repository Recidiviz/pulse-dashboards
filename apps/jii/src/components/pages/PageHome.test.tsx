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

import { render, screen } from "@testing-library/react";
import { configure } from "mobx";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AuthClient } from "~auth";

import { RootStore } from "../../datastores/RootStore";
import { useRootStore } from "../StoreProvider/useRootStore";
import { PageHome } from "./PageHome";

vi.mock("../StoreProvider/useRootStore");

let authClient: AuthClient;

beforeEach(() => {
  configure({ safeDescriptors: false });

  const rootStore = new RootStore();
  vi.mocked(useRootStore).mockReturnValue(rootStore);
  authClient = rootStore.userStore.authClient;
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

function renderHome() {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<PageHome />} />
        <Route path="/eligibility" element={<div>eligibility page</div>} />
        <Route path="/verify" element={<div>verify page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

test("landing page if unauthorized", async () => {
  vi.spyOn(authClient, "isAuthorized", "get").mockReturnValue(false);
  vi.spyOn(authClient, "isEmailVerificationRequired", "get").mockReturnValue(
    false,
  );

  renderHome();
  expect(
    await screen.findByRole("combobox", {
      name: "Find opportunities in the state where you’re incarcerated",
    }),
  ).toBeInTheDocument();
});

test("email verification page if needed", () => {
  vi.spyOn(authClient, "isAuthorized", "get").mockReturnValue(false);
  vi.spyOn(authClient, "isEmailVerificationRequired", "get").mockReturnValue(
    true,
  );

  renderHome();

  expect(screen.getByText("verify page")).toBeInTheDocument();
});

test("eligibility page if authorized", () => {
  vi.spyOn(authClient, "isAuthorized", "get").mockReturnValue(true);

  renderHome();

  expect(screen.getByText("eligibility page")).toBeInTheDocument();
});
