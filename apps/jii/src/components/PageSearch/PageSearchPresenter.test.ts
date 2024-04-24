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
import { set } from "mobx";

import { outputFixture, outputFixtureArray, usMeResidents } from "~datatypes";

import { residentsConfigByState } from "../../configs/residentsConfig";
import { ResidentsStore } from "../../datastores/ResidentsStore";
import { RootStore } from "../../datastores/RootStore";
import { PageSearchPresenter } from "./PageSearchPresenter";

let residentsStore: ResidentsStore;
let presenter: PageSearchPresenter;

beforeEach(() => {
  residentsStore = new ResidentsStore(
    new RootStore(),
    residentsConfigByState.US_ME,
  );
  presenter = new PageSearchPresenter(residentsStore);
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
    expect(presenter.hydrationState.status).toBe("needs hydration");

    presenter.hydrate();

    expect(presenter.hydrationState.status).toBe("loading");

    await waitFor(() =>
      expect(presenter.hydrationState.status).toBe("hydrated"),
    );

    expect(presenter.selectOptions).toMatchSnapshot();
  });
});

test("set active resident", async () => {
  await presenter.hydrate();

  expect(presenter.defaultOption).toBeUndefined();

  const expectedResident = outputFixture(usMeResidents[2]);

  presenter.setActiveResident(expectedResident.personExternalId);

  expect(presenter.defaultOption?.value).toBe(
    expectedResident.personExternalId,
  );
});
