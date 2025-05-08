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

import { isDemoMode } from "~client-env-utils";
import { usMeResidents } from "~datatypes";

import { residentsConfigByState } from "../../configs/residentsConfig";
import { ResidentsStore } from "../../datastores/ResidentsStore";
import { RootStore } from "../../datastores/RootStore";
import { ResidentsSearchPresenter } from "./ResidentsSearchPresenter";

vi.mock("~client-env-utils", () => ({
  isTestEnv: () => true,
  isOfflineMode: vi.fn(),
  isDemoMode: vi.fn(),
}));

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
        stateCode: "US_ME",
      },
    },
  );

  residentsStore = new ResidentsStore(
    rootStore,
    "US_ME",
    residentsConfigByState.US_ME,
  );
  presenter = new ResidentsSearchPresenter(residentsStore, rootStore.uiStore);
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
      keyBy(usMeResidents, "personExternalId"),
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
      ["custodyLevel", "in", ["MINIMUM", "COMMUNITY"]],
    ]);
  });
});

describe("facility filter", () => {
  test("default value", () => {
    expect(presenter.residentFilterDefaultOption).toMatchInlineSnapshot(`
      {
        "label": "Mountain View Correctional Facility Pilot",
        "value": "MVCF PILOT",
      }
    `);
  });

  test("set value", async () => {
    vi.spyOn(residentsStore, "populateResidents");

    presenter.setResidentsFilter("__ALL__");
    expect(presenter.residentFilterDefaultOption).toMatchInlineSnapshot(`
      {
        "label": "All",
        "value": "__ALL__",
      }
    `);

    expect(residentsStore.populateResidents).toHaveBeenLastCalledWith(
      undefined,
      true,
    );

    presenter.setResidentsFilter("MVCF PILOT");

    expect(presenter.residentFilterDefaultOption).toMatchInlineSnapshot(
      `
      {
        "label": "Mountain View Correctional Facility Pilot",
        "value": "MVCF PILOT",
      }
    `,
    );

    expect(residentsStore.populateResidents).toHaveBeenLastCalledWith(
      [
        ["facilityId", "==", "MOUNTAIN VIEW CORRECTIONAL FACILITY"],
        ["custodyLevel", "in", ["MINIMUM", "COMMUNITY"]],
      ],
      true,
    );
  });

  test("demo mode", () => {
    vi.mocked(isDemoMode).mockReturnValue(true);

    expect(presenter.residentFilterOptions).toEqual([
      {
        label: "All",
        value: "__ALL__",
      },
    ]);

    expect(presenter.residentFilterDefaultOption).toEqual({
      label: "All",
      value: "__ALL__",
    });
  });
});
