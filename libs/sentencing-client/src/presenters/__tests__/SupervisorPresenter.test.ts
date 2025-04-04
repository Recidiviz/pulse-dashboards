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

import { SupervisorInfoFixture } from "../../api/offlineFixtures";
import { PSIStore } from "../../datastores/PSIStore";
import { SupervisorStore } from "../../datastores/SupervisorStore";
import { createMockPSIStore } from "../../utils/test";
import { SupervisorPresenter } from "../SupervisorPresenter";

let psiStore: PSIStore;
let presenter: SupervisorPresenter;

beforeEach(() => {
  psiStore = createMockPSIStore();
  presenter = new SupervisorPresenter(psiStore.supervisorStore);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("hydration states", async () => {
  vi.spyOn(psiStore.supervisorStore, "loadSupervisorInfo");
  vi.spyOn(psiStore.apiClient, "getSupervisorInfo").mockResolvedValue(
    SupervisorInfoFixture,
  );

  expect(presenter.hydrationState).toEqual({ status: "needs hydration" });

  const hydrationPromise = presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "loading" });

  await hydrationPromise;
  expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  expect(psiStore.supervisorStore.loadSupervisorInfo).toHaveBeenCalled();
  expect(psiStore.supervisorStore.supervisorInfo).toBeDefined();
});

test("hydration error", async () => {
  const error = new Error("Something went wrong");
  vi.spyOn(SupervisorStore.prototype, "loadSupervisorInfo").mockImplementation(
    () => {
      throw error;
    },
  );

  await presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "failed", error });
});

test("no redundant hydration while in progress", async () => {
  vi.spyOn(psiStore.supervisorStore, "loadSupervisorInfo");

  const firstHydrationCall = presenter.hydrate();
  const secondHydrationCall = presenter.hydrate();

  await Promise.all([firstHydrationCall, secondHydrationCall]);
  expect(psiStore.supervisorStore.loadSupervisorInfo).toHaveBeenCalledTimes(1);
});

test("no hydration if already hydrated", async () => {
  vi.spyOn(psiStore.supervisorStore, "loadSupervisorInfo");
  vi.spyOn(psiStore.apiClient, "getSupervisorInfo").mockResolvedValue(
    SupervisorInfoFixture,
  );

  await presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  presenter.hydrate();

  expect(psiStore.supervisorStore.loadSupervisorInfo).toHaveBeenCalledTimes(1);
});
