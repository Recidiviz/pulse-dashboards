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
import { configure, set } from "mobx";

import { residentsConfigByState, ResidentsStore, RootStore } from "~@jii/data";
import { locationRecordFixtures } from "~datatypes";

import { ResidentsSearchPresenter } from "./ResidentsSearchPresenter";

let residentsStore: ResidentsStore;
let presenter: ResidentsSearchPresenter;
let rootStore: RootStore;

beforeEach(() => {
  configure({ safeDescriptors: false });
  rootStore = new RootStore();
  vi.spyOn(rootStore.userStore.authManager, "authState", "get").mockReturnValue(
    {
      status: "authorized",
      userProfile: {
        stateCode: "US_MA",
      },
    },
  );

  residentsStore = new ResidentsStore(
    rootStore,
    "US_MA",
    residentsConfigByState.US_MA,
  );
  presenter = new ResidentsSearchPresenter(residentsStore, rootStore.uiStore);
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

describe("hydration", () => {
  test("needs hydration", () => {
    expect(presenter.hydrationState.status).toBe("needs hydration");
    expect(presenter.residentFilterOptions).toEqual([]);
  });

  test("already hydrated", () => {
    set(residentsStore.locations, [
      [locationRecordFixtures.find((r) => r.stateCode === "US_MA")],
    ]);

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

    expect(presenter.residentFilterOptions).toMatchInlineSnapshot(`
      [
        {
          "label": "Demo Facility",
          "value": "DEMO FACILITY",
        },
      ]
    `);
    expect(presenter.residentFilterDefaultOption).toBeUndefined();
  });
});

describe("facility filter", () => {
  beforeEach(async () => {
    await presenter.hydrate();
  });

  test("set value", async () => {
    presenter.setResidentsFilter("DEMO FACILITY");
    expect(presenter.residentFilterDefaultOption).toMatchInlineSnapshot(`
      {
        "label": "Demo Facility",
        "value": "DEMO FACILITY",
      }
    `);
  });
});
