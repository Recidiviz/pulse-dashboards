// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { RootStore } from "../../../RootStore";
import { OutliersOfflineAPIClient } from "../../api/OutliersOfflineAPIClient";
import { OutliersConfigFixture } from "../../models/offlineFixtures/OutliersConfigFixture";
import { supervisionOfficerSupervisorsFixture } from "../../models/offlineFixtures/SupervisionOfficerSupervisor";
import { OutliersStore } from "../../OutliersStore";
import { OutliersSupervisionStore } from "../../stores/OutliersSupervisionStore";
import { SupervisionOfficerSupervisorsPresenter } from "../SupervisionOfficerSupervisorsPresenter";

let store: OutliersSupervisionStore;
let presenter: SupervisionOfficerSupervisorsPresenter;

beforeEach(() => {
  store = new OutliersSupervisionStore(
    new OutliersStore(new RootStore()),
    OutliersConfigFixture
  );

  presenter = new SupervisionOfficerSupervisorsPresenter(store);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("hydrate", async () => {
  expect(presenter.isHydrated).toBe(false);

  await presenter.hydrate();

  expect(presenter.isHydrated).toBe(true);
});

test("hydrated with no results", async () => {
  jest
    .spyOn(OutliersOfflineAPIClient.prototype, "supervisionOfficerSupervisors")
    .mockResolvedValue([]);

  await presenter.hydrate();

  expect(presenter.isHydrated).toBe(true);
});

test("all supervisors data", async () => {
  await presenter.hydrate();
  expect(presenter.allSupervisors).toEqual(
    expect.arrayContaining(supervisionOfficerSupervisorsFixture)
  );
});

test("supervisors with outliers data", async () => {
  await presenter.hydrate();
  expect(presenter.supervisorsWithOutliersByDistrict).toMatchSnapshot();
  presenter.supervisorsWithOutliersByDistrict.forEach(({ supervisors }) => {
    supervisors.forEach((s) => expect(s.hasOutliers).toBeTrue());
  });
});

test("supervisors with outliers count", async () => {
  await presenter.hydrate();
  expect(presenter.supervisorsWithOutliersCount).toMatchInlineSnapshot(`2`);
});
