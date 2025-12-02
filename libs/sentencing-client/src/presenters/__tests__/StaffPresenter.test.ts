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

import { StaffInfoFixture } from "../../api/offlineFixtures";
import { SentencingStore } from "../../datastores/SentencingStore";
import { StaffStore } from "../../datastores/StaffStore";
import { createMockSentencingStore } from "../../utils/test";
import { StaffPresenter } from "../StaffPresenter";

let sentencingStore: SentencingStore;
let presenter: StaffPresenter;

beforeEach(() => {
  sentencingStore = createMockSentencingStore();
  presenter = new StaffPresenter(sentencingStore.staffStore);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("hydration states", async () => {
  vi.spyOn(sentencingStore.staffStore, "loadStaffInfo");
  vi.spyOn(sentencingStore.apiClient, "getStaffInfo").mockResolvedValue(
    StaffInfoFixture,
  );

  expect(presenter.hydrationState).toEqual({ status: "needs hydration" });

  const hydrationPromise = presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "loading" });

  await hydrationPromise;
  expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  expect(sentencingStore.staffStore.loadStaffInfo).toHaveBeenCalled();
  expect(sentencingStore.staffStore.staffInfo).toBeDefined();
});

test("hydration error", async () => {
  const error = new Error("Something went wrong");
  vi.spyOn(StaffStore.prototype, "loadStaffInfo").mockImplementation(() => {
    throw error;
  });

  await presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "failed", error });
});

test("no redundant hydration while in progress", async () => {
  vi.spyOn(sentencingStore.staffStore, "loadStaffInfo");

  const firstHydrationCall = presenter.hydrate();
  const secondHydrationCall = presenter.hydrate();

  await Promise.all([firstHydrationCall, secondHydrationCall]);
  expect(sentencingStore.staffStore.loadStaffInfo).toHaveBeenCalledTimes(1);
});

test("no hydration if already hydrated", async () => {
  vi.spyOn(sentencingStore.staffStore, "loadStaffInfo");
  vi.spyOn(sentencingStore.apiClient, "getStaffInfo").mockResolvedValue(
    StaffInfoFixture,
  );

  await presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  presenter.hydrate();

  expect(sentencingStore.staffStore.loadStaffInfo).toHaveBeenCalledTimes(1);
});
