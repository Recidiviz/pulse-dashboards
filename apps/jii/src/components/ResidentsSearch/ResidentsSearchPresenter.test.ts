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

import { residentsConfigByState } from "~@jii/configs";
import { ResidentsStore, RootStore } from "~@jii/data";
import { JiiResidentAppRouterOutputs } from "~@jii/trpc-types";

import { ResidentsSearchPresenter } from "./ResidentsSearchPresenter";

let residentsStore: ResidentsStore;
let presenter: ResidentsSearchPresenter;
let rootStore: RootStore;

const testFacilities: JiiResidentAppRouterOutputs["resident"]["getFacilities"] =
  [
    { id: "DEMO FACILITY", name: "Demo Facility" },
    { id: "DEMO FACILITY 2", name: "Demo Facility 2" },
  ];

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
  presenter = new ResidentsSearchPresenter(
    testFacilities,
    residentsStore,
    rootStore.uiStore,
    rootStore.userStore,
  );
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

describe("residentFilterOptions", () => {
  test("maps facilities to select options", () => {
    expect(presenter.residentFilterOptions).toMatchInlineSnapshot(`
      [
        {
          "label": "Demo Facility",
          "value": "DEMO FACILITY",
        },
        {
          "label": "Demo Facility 2",
          "value": "DEMO FACILITY 2",
        },
      ]
    `);
  });
});

describe("district restriction", () => {
  function mockDistrict(district: string) {
    vi.spyOn(
      rootStore.userStore.authManager,
      "authState",
      "get",
    ).mockReturnValue({
      status: "authorized",
      userProfile: {
        stateCode: "US_MA",
        district,
      },
    });
  }

  test("limits options to the facility matching the user's district when enabled", () => {
    mockDistrict("DEMO FACILITY 2");
    const restrictedPresenter = new ResidentsSearchPresenter(
      testFacilities,
      new ResidentsStore(rootStore, "US_MA", {
        ...residentsConfigByState.US_MA,
        limitDistrictSearchOptions: true,
      }),
      rootStore.uiStore,
      rootStore.userStore,
    );

    expect(restrictedPresenter.residentFilterOptions).toEqual([
      { label: "Demo Facility 2", value: "DEMO FACILITY 2" },
    ]);
  });

  test("throws when the user's district matches no known facility", () => {
    mockDistrict("UNKNOWN DISTRICT");
    const restrictedPresenter = new ResidentsSearchPresenter(
      testFacilities,
      new ResidentsStore(rootStore, "US_MA", {
        ...residentsConfigByState.US_MA,
        limitDistrictSearchOptions: true,
      }),
      rootStore.uiStore,
      rootStore.userStore,
    );

    expect(() => restrictedPresenter.residentFilterOptions).toThrow(
      "You don't have permission to search any known facilities.",
    );
  });

  test("does not limit options when disabled, even if the user has a district", () => {
    mockDistrict("DEMO FACILITY 2");

    expect(presenter.residentFilterOptions).toHaveLength(2);
  });

  test("does not limit options when enabled but the user has no district", () => {
    const restrictedPresenter = new ResidentsSearchPresenter(
      testFacilities,
      new ResidentsStore(rootStore, "US_MA", {
        ...residentsConfigByState.US_MA,
        limitDistrictSearchOptions: true,
      }),
      rootStore.uiStore,
      rootStore.userStore,
    );

    expect(restrictedPresenter.residentFilterOptions).toHaveLength(2);
  });
});

describe("residentFilterDefaultOption", () => {
  test("is undefined when no filter has been selected", () => {
    expect(presenter.residentFilterDefaultOption).toBeUndefined();
  });

  test("returns the option matching a preexisting value in the ui store", () => {
    rootStore.uiStore.selectedFacilityIdFilterOptionValue = "DEMO FACILITY 2";

    expect(presenter.residentFilterDefaultOption).toMatchInlineSnapshot(`
      {
        "label": "Demo Facility 2",
        "value": "DEMO FACILITY 2",
      }
    `);
  });
});

describe("facility filter", () => {
  test("set value", () => {
    presenter.setResidentsFilter("DEMO FACILITY");
    expect(presenter.residentFilterDefaultOption).toMatchInlineSnapshot(`
      {
        "label": "Demo Facility",
        "value": "DEMO FACILITY",
      }
    `);
  });
});
