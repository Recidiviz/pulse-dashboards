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

import { waitFor } from "@testing-library/react";
import { keyBy } from "lodash";
import { configure, set } from "mobx";

import { residentsConfigByState, ResidentsStore, RootStore } from "~@jii/data";
import { usMaResidents } from "~datatypes";

import { ResidentSelectorPresenter } from "./ResidentSelectorPresenter";

let residentsStore: ResidentsStore;
let presenter: ResidentSelectorPresenter;
let rootStore: RootStore;

const TEST_FACILITY_ID = "DEMO FACILITY";

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
  presenter = new ResidentSelectorPresenter(residentsStore, TEST_FACILITY_ID);
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
      keyBy(usMaResidents, "personExternalId"),
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

    // main thing to note here is the sort order
    expect(presenter.selectOptions.map((o) => o.label)).toMatchInlineSnapshot(`
      [
        "Laurence Baumbach (RES001)",
        "Dan Krajcik (RES002)",
      ]
      `);
    expect(presenter.selectOptions.map((o) => o.value)).toEqual([
      usMaResidents[0],
      usMaResidents[1],
    ]);

    expect(residentsStore.populateResidents).toHaveBeenCalledWith(
      [["facilityId", "==", TEST_FACILITY_ID]],
      true,
    );
  });
});
