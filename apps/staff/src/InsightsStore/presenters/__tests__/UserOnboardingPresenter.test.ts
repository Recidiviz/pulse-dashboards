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

import { flowResult, observable } from "mobx";

import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsConfigFixture } from "../../models/offlineFixtures/InsightsConfigFixture";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { UserOnboardingPresenter } from "../UserOnboardingPresenter";

let store: InsightsSupervisionStore;
let presenter: UserOnboardingPresenter;
const userPseudoId = "hashed-mdavis123";

beforeEach(() => {
  vi.spyOn(UserStore.prototype, "userPseudoId", "get").mockImplementation(
    () => userPseudoId,
  );
  vi.spyOn(UserStore.prototype, "isRecidivizUser", "get").mockImplementation(
    () => false,
  );
  vi.spyOn(UserStore.prototype, "userAppMetadata", "get").mockReturnValue({
    externalId: "abc123",
    pseudonymizedId: "hashed-mdavis123",
    district: "District One",
    stateCode: "us_mi",
    routes: observable({
      insights: true,
      "insights_supervision_supervisors-list": false,
    }),
  });

  store = new InsightsSupervisionStore(
    new RootStore().insightsStore,
    InsightsConfigFixture,
  );

  presenter = new UserOnboardingPresenter(store);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("with user data already hydrated", () => {
  beforeEach(async () => {
    await Promise.all([flowResult(store.populateUserInfo())]);
  });

  test("is immediately hydrated", () => {
    expect(presenter.hydrationState.status).toBe("hydrated");
  });

  test("makes no additional API calls", async () => {
    vi.spyOn(InsightsOfflineAPIClient.prototype, "userInfo");

    await presenter.hydrate();

    expect(store.insightsStore.apiClient.userInfo).not.toHaveBeenCalled();
  });

  test("has userInfo", () => {
    expect(presenter.userInfo).toBeDefined();
    expect(presenter.userInfo).toMatchSnapshot();
  });
});

test("hydration", async () => {
  vi.spyOn(InsightsOfflineAPIClient.prototype, "userInfo");

  expect(presenter.hydrationState.status).toBe("needs hydration");

  await presenter.hydrate();

  expect(presenter.hydrationState.status).toBe("hydrated");
  expect(store.insightsStore.apiClient.userInfo).toHaveBeenCalled();
});

test("has userInfo", async () => {
  await presenter.hydrate();

  expect(presenter.userInfo).toBeDefined();
  expect(presenter.userInfo).toMatchSnapshot();
});

test("updates userInfo", async () => {
  await presenter.hydrate();

  await presenter.setUserHasSeenOnboarding(true);

  expect(presenter.userHasSeenOnboarding).toBeTrue();
});
