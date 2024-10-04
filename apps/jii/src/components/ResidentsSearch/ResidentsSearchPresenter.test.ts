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

import { waitFor } from "@testing-library/react";
import { keyBy } from "lodash";
import { configure, set } from "mobx";

import { outputFixture, outputFixtureArray, usMeResidents } from "~datatypes";

import { residentsConfigByState } from "../../configs/residentsConfig";
import { ResidentsStore } from "../../datastores/ResidentsStore";
import { RootStore } from "../../datastores/RootStore";
import { ResidentsSearchPresenter } from "./ResidentsSearchPresenter";

let residentsStore: ResidentsStore;
let presenter: ResidentsSearchPresenter;
let rootStore: RootStore;

beforeEach(() => {
  configure({ safeDescriptors: false });
  rootStore = new RootStore();
  vi.spyOn(
    rootStore.userStore.authClient,
    "appMetadata",
    "get",
  ).mockReturnValue({
    stateCode: "US_ME",
  });

  residentsStore = new ResidentsStore(rootStore, residentsConfigByState.US_ME);
  presenter = new ResidentsSearchPresenter(
    residentsStore,
    rootStore.uiStore,
    undefined,
  );
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

describe("hydration", () => {
  test("needs hydration", () => {
    expect(presenter.hydrationState.status).toBe("needs hydration");
    expect(presenter.selectOptions).toEqual([]);
  });

  test("already hydrated", () => {
    set(
      residentsStore.residentsByExternalId,
      keyBy(outputFixtureArray(usMeResidents), "personExternalId"),
    );

    expect(presenter.hydrationState.status).toBe("hydrated");
  });

  test("hydrate", async () => {
    vi.spyOn(residentsStore, "populateResidents");
    expect(presenter.hydrationState.status).toBe("needs hydration");

    presenter.hydrate();

    expect(presenter.hydrationState.status).toBe("loading");

    await waitFor(() =>
      expect(presenter.hydrationState.status).toBe("hydrated"),
    );

    expect(presenter.selectOptions).toMatchSnapshot();
    expect(residentsStore.populateResidents).toHaveBeenLastCalledWith([
      ["facilityId", "==", "MOUNTAIN VIEW CORRECTIONAL FACILITY"],
    ]);
  });
});

test("with active resident", async () => {
  vi.spyOn(residentsStore.userStore, "hasPermission").mockReturnValue(true);

  const expectedResident = outputFixture(usMeResidents[2]);

  presenter = new ResidentsSearchPresenter(
    residentsStore,
    rootStore.uiStore,
    expectedResident,
  );

  await presenter.hydrate();

  expect(presenter.defaultOption?.value).toEqual(expectedResident);
});

describe("facility filter", () => {
  test("default value", () => {
    expect(presenter.facilityFilterDefaultOption).toMatchInlineSnapshot(`
      {
        "label": "Mountain View Correctional Facility",
        "value": "MOUNTAIN VIEW CORRECTIONAL FACILITY",
      }
    `);
  });

  test("set value", async () => {
    vi.spyOn(residentsStore, "populateResidents");

    presenter.setFacilityFilter("__ALL__");
    expect(presenter.facilityFilterDefaultOption).toMatchInlineSnapshot(`
      {
        "label": "All",
        "value": "__ALL__",
      }
    `);

    expect(residentsStore.populateResidents).toHaveBeenLastCalledWith(
      undefined,
      true,
    );

    presenter.setFacilityFilter("MOUNTAIN VIEW CORRECTIONAL FACILITY");

    expect(presenter.facilityFilterDefaultOption).toMatchInlineSnapshot(`
      {
        "label": "Mountain View Correctional Facility",
        "value": "MOUNTAIN VIEW CORRECTIONAL FACILITY",
      }
    `);

    expect(residentsStore.populateResidents).toHaveBeenLastCalledWith(
      [["facilityId", "==", "MOUNTAIN VIEW CORRECTIONAL FACILITY"]],
      true,
    );
  });
});
