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

import { configure } from "mobx";

import { residentsConfigByState } from "../../../configs/residentsConfig";
import { UserStore } from "../../../datastores/UserStore";
import { NavigationMenuPresenter } from "./NavigationMenuPresenter";

let presenter: NavigationMenuPresenter;
let userStore: UserStore;

beforeEach(() => {
  configure({ safeDescriptors: false });

  userStore = new UserStore({ stateCode: "US_ME" });
  presenter = new NavigationMenuPresenter(
    residentsConfigByState.US_ME,
    userStore,
  );
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("links", () => {
  vi.spyOn(userStore, "hasPermission").mockReturnValue(false);
  expect(presenter.links).toMatchInlineSnapshot(`
    [
      {
        "text": "Home",
        "url": "/",
      },
      {
        "text": "SCCP",
        "url": "/eligibility/sccp",
      },
    ]
  `);
});

test("links exclude search", () => {
  vi.spyOn(userStore, "hasPermission").mockReturnValue(false);

  expect(presenter.links.find((l) => l.url === "/search")).toBeUndefined();
});

test("links include search", () => {
  vi.spyOn(userStore, "hasPermission").mockReturnValue(true);

  expect(
    presenter.links.find((l) => l.url === "/eligibility/search"),
  ).toBeDefined();
});

test("logout", () => {
  vi.spyOn(userStore, "logOut");

  presenter.logout();

  expect(userStore.logOut).toHaveBeenCalled();
});
