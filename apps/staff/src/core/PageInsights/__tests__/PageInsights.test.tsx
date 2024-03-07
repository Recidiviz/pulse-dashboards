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

import { render, screen } from "@testing-library/react";
import { configure } from "mobx";
import { MemoryRouter } from "react-router-dom";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../components/StoreProvider";
import { InsightsStore } from "../../../InsightsStore/InsightsStore";
import { InsightsConfigFixture } from "../../../InsightsStore/models/offlineFixtures/InsightsConfigFixture";
import { InsightsSupervisionStore } from "../../../InsightsStore/stores/InsightsSupervisionStore";
import { RootStore } from "../../../RootStore";
import { insightsRoute } from "../../views";
import PageInsights from "../PageInsights";

jest.mock(
  "../../../InsightsStore/presenters/SwarmPresenter/getSwarmLayoutWorker",
);
jest.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as jest.Mock;
const useFeatureVariantsMock = useFeatureVariants as jest.Mock;

let insightsStore: InsightsStore;

beforeEach(() => {
  configure({ safeDescriptors: false });
  const rootStore = new RootStore();
  insightsStore = rootStore.insightsStore;

  useRootStoreMock.mockReturnValue(rootStore);
  useFeatureVariantsMock.mockReturnValue({
    insightsLeadershipPageAllDistricts: true,
  });
  jest.spyOn(rootStore.userStore, "userAppMetadata", "get").mockReturnValue({
    externalId: "user",
    pseudonymizedId: "hashed-user",
    stateCode: "us_mi",
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  configure({ safeDescriptors: true });
});

function renderRouter(relativePath?: string) {
  render(
    <MemoryRouter initialEntries={[relativePath ?? "/"]}>
      <PageInsights />
    </MemoryRouter>,
  );
}

test("hydrates", () => {
  jest.spyOn(insightsStore, "populateSupervisionStore");

  renderRouter();

  expect(insightsStore.populateSupervisionStore).toHaveBeenCalled();
});

test("invalid routes", async () => {
  renderRouter("/supervision/invalid-path-to-nowhere");

  expect(
    await screen.findByText("Page Not Found", {
      exact: false,
    }),
  ).toBeInTheDocument();
});

test("valid route", async () => {
  insightsStore.supervisionStore = new InsightsSupervisionStore(
    insightsStore,
    InsightsConfigFixture,
  );
  jest
    .spyOn(insightsStore.supervisionStore, "userCanAccessAllSupervisors", "get")
    .mockReturnValue(true);
  jest
    .spyOn(insightsStore.supervisionStore, "userHasSeenOnboarding", "get")
    .mockReturnValue(true);

  renderRouter(insightsRoute({ routeName: "supervisionSupervisorsList" }));

  expect(
    await screen.findByText("supervisors across the state have one or more", {
      exact: false,
    }),
  ).toBeInTheDocument();
});
