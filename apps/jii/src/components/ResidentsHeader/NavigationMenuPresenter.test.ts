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

import { residentsConfigByState } from "../../configs/residentsConfig";
import { RootStore } from "../../datastores/RootStore";
import { NavigationMenuPresenter } from "./NavigationMenuPresenter";

let presenter: NavigationMenuPresenter;
let rootStore: RootStore;

beforeEach(() => {
  configure({ safeDescriptors: false });

  rootStore = new RootStore();
  presenter = new NavigationMenuPresenter(
    residentsConfigByState.US_ME,
    rootStore,
  );
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("links", () => {
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
  vi.spyOn(rootStore.userStore, "hasEnhancedPermission", "get").mockReturnValue(
    false,
  );

  expect(presenter.links.find((l) => l.url === "/search")).toBeUndefined();
});

test("links include search", () => {
  vi.spyOn(rootStore.userStore, "hasEnhancedPermission", "get").mockReturnValue(
    true,
  );

  expect(presenter.links.find((l) => l.url === "/search")).toBeDefined();
});

test("logout", () => {
  vi.spyOn(rootStore.authStore, "logout");

  presenter.logout();

  expect(rootStore.authStore.logout).toHaveBeenCalled();
});