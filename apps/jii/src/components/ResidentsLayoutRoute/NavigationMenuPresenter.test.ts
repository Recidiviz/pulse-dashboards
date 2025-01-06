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

import { outputFixture, usMeResidents } from "~datatypes";

import { residentsConfigByState } from "../../configs/residentsConfig";
import { UserStore } from "../../datastores/UserStore";
import { NavigationMenuPresenter } from "./NavigationMenuPresenter";

let presenter: NavigationMenuPresenter;
let userStore: UserStore;

const testResident = outputFixture(usMeResidents[0]);
const stateSlug = "maine";

beforeEach(() => {
  configure({ safeDescriptors: false });

  userStore = new UserStore({ stateCode: "US_ME" });
  vi.spyOn(userStore, "hasPermission").mockReturnValue(false);
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

describe("with resident route", () => {
  beforeEach(() => {
    presenter = new NavigationMenuPresenter(
      residentsConfigByState.US_ME,
      userStore,
      { stateSlug, personPseudoId: testResident.pseudonymizedId },
    );
  });

  test("link to home", () => {
    expect(presenter.homeLink).toEqual({
      children: "Home",
      to: `/maine/${testResident.pseudonymizedId}`,
    });
  });

  test("links exclude search", () => {
    expect(presenter.searchLink).toBeUndefined();
  });

  test("links include search", () => {
    vi.spyOn(userStore, "hasPermission").mockReturnValue(true);

    expect(presenter.searchLink).toEqual({
      children: "Search",
      to: "/maine/search",
    });
  });

  test("links to opportunities", () => {
    expect(presenter.opportunityLinks).toMatchInlineSnapshot(`
      [
        {
          "children": "Supervised Community Confinement Program",
          "to": "/maine/anonres001/eligibility/sccp",
        },
      ]
    `);
  });
});

describe("with non-resident route", () => {
  beforeEach(() => {
    presenter = new NavigationMenuPresenter(
      residentsConfigByState.US_ME,
      userStore,
      { stateSlug },
    );
  });

  test("links exclude search", () => {
    expect(presenter.searchLink).toBeUndefined();
  });

  test("links include search", () => {
    vi.spyOn(userStore, "hasPermission").mockReturnValue(true);

    expect(presenter.searchLink).toEqual({
      children: "Search",
      to: "/maine/search",
    });
  });

  test("no resident-specific links", () => {
    expect(presenter.homeLink).toBeUndefined();
    expect(presenter.opportunityLinks).toBeUndefined();
  });
});
