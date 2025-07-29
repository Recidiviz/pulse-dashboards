// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { RootStore } from "../../datastores/RootStore";
import { useRootStore } from "../StoreProvider/useRootStore";
import { NavMenu } from "./NavMenu";

vi.mock("../StoreProvider/useRootStore");

let rootStore: RootStore;

function simulateIframe() {
  vi.stubGlobal("parent", { foo: "bar" });
}

beforeEach(() => {
  rootStore = new RootStore();
  vi.mocked(useRootStore).mockReturnValue(rootStore);
});

test("logout button", () => {
  render(
    <MemoryRouter>
      <NavMenu />
    </MemoryRouter>,
  );

  // open the menu
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));

  expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
});

test("no logout button", () => {
  simulateIframe();

  render(
    <MemoryRouter>
      <NavMenu links={[{ children: "test", to: "/test", end: true }]} />
    </MemoryRouter>,
  );

  // open the menu
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));

  expect(
    screen.queryByRole("button", { name: "Log out" }),
  ).not.toBeInTheDocument();
});

test("hide menu if empty", () => {
  // this means no logout button
  simulateIframe();

  // props contain no links
  render(
    <MemoryRouter>
      <NavMenu />
    </MemoryRouter>,
  );

  expect(
    screen.queryByRole("button", { name: "Menu" }),
  ).not.toBeInTheDocument();
});
