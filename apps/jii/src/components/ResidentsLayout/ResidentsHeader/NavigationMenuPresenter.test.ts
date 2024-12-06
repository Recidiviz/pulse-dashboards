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

import { residentsConfigByState } from "../../../configs/residentsConfig";
import { UserStore } from "../../../datastores/UserStore";
import { State } from "../../../routes/routes";
import { NavigationMenuPresenter } from "./NavigationMenuPresenter";

let presenter: NavigationMenuPresenter;
let userStore: UserStore;

const testResident = outputFixture(usMeResidents[0]);
const stateSlug = "maine";

beforeEach(() => {
  configure({ safeDescriptors: false });

  userStore = new UserStore({ stateCode: "US_ME" });
  vi.spyOn(userStore, "hasPermission").mockReturnValue(false);

  presenter = new NavigationMenuPresenter(
    residentsConfigByState.US_ME,
    userStore,
    { stateSlug },
    testResident,
  );
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("link to home", () => {
  expect(presenter.links).toContainEqual({
    text: "Home",
    url: "/",
  });
});

test("links exclude search", () => {
  expect(
    presenter.links.find((l) =>
      l.url.match(new RegExp(State.Search.relativePath)),
    ),
  ).toBeUndefined();
});

test("links include search", () => {
  vi.spyOn(userStore, "hasPermission").mockReturnValue(true);

  expect(
    presenter.links.find((l) =>
      l.url.match(new RegExp(State.Search.buildPath({ stateSlug }))),
    ),
  ).toBeDefined();
});

test("links to opportunities with active resident", () => {
  expect(
    presenter.links.find(
      (l) =>
        l.url ===
        State.Resident.Eligibility.Opportunity.buildPath({
          stateSlug,
          opportunitySlug: "sccp",
        }),
    ),
  ).toBeDefined();
});

test("no links to opportunities without active resident", () => {
  presenter = new NavigationMenuPresenter(
    residentsConfigByState.US_ME,
    userStore,
    { stateSlug },
    undefined,
  );

  expect(
    presenter.links.find(
      (l) =>
        l.url ===
        State.Resident.Eligibility.Opportunity.buildPath({
          stateSlug,
          opportunitySlug: "sccp",
        }),
    ),
  ).toBeUndefined();
});

test("opportunity links include person ID from URL", () => {
  vi.spyOn(userStore, "hasPermission").mockReturnValue(true);

  presenter = new NavigationMenuPresenter(
    residentsConfigByState.US_ME,
    userStore,
    { stateSlug, personPseudoId: testResident.pseudonymizedId },
    testResident,
  );

  expect(
    presenter.links.find(
      (l) =>
        l.url ===
        State.Resident.Eligibility.Opportunity.buildPath({
          stateSlug,
          opportunitySlug: "sccp",
          personPseudoId: testResident.pseudonymizedId,
        }),
    ),
  ).toBeDefined();
});

test("logout", () => {
  vi.spyOn(userStore, "logOut");

  presenter.logout();

  expect(userStore.logOut).toHaveBeenCalled();
});
