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

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { configure } from "mobx";
import { BrowserRouter } from "react-router-dom";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../components/StoreProvider";
import { InsightsConfigFixture } from "../../../InsightsStore/models/offlineFixtures/InsightsConfigFixture";
import { supervisionOfficerFixture } from "../../../InsightsStore/models/offlineFixtures/SupervisionOfficerFixture";
import { SupervisionOfficerDetailPresenter } from "../../../InsightsStore/presenters/SupervisionOfficerDetailPresenter";
import { InsightsSupervisionStore } from "../../../InsightsStore/stores/InsightsSupervisionStore";
import { RootStore } from "../../../RootStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import UserStore from "../../../RootStore/UserStore";
import InsightsStaffPage, {
  StaffPageWithPresenter,
} from "../InsightsStaffPage";

vi.mock("../../../components/StoreProvider");
vi.mock(
  "../../../InsightsStore/presenters/SwarmPresenter/getSwarmLayoutWorker",
);

const useRootStoreMock = vi.mocked(useRootStore);
const useFeatureVariantsMock = vi.mocked(useFeatureVariants);
const supervisorPseudoId = "hashed-agonzalez123";
const officerPseudoId = supervisionOfficerFixture[0].pseudonymizedId;
const testMetric = supervisionOfficerFixture[0].outlierMetrics[0].metricId;

beforeEach(() => {
  configure({ safeDescriptors: false });
  vi.spyOn(UserStore.prototype, "isRecidivizUser", "get").mockImplementation(
    () => false,
  );
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

describe("Insights Staff Page", () => {
  let store: InsightsSupervisionStore;
  let presenter: SupervisionOfficerDetailPresenter;
  let rootStore: RootStore;

  beforeEach(async () => {
    rootStore = new RootStore();
    store = new InsightsSupervisionStore(
      rootStore.insightsStore,
      InsightsConfigFixture,
    );
    rootStore.insightsStore.supervisionStore = store;
    useRootStoreMock.mockReturnValue(rootStore);
    useFeatureVariantsMock.mockReturnValue({});

    vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
    store.setOfficerPseudoId(officerPseudoId);
    store.setMetricId(testMetric);

    presenter = new SupervisionOfficerDetailPresenter(store, officerPseudoId);
    await presenter?.hydrate();
  });

  test("analytics trackInsightsStaffPageViewed", async () => {
    store.setMetricId(testMetric);
    vi.spyOn(AnalyticsStore.prototype, "trackInsightsStaffPageViewed");
    vi.spyOn(rootStore.userStore, "userPseudoId", "get").mockImplementation(
      () => supervisorPseudoId,
    );

    render(
      <BrowserRouter>
        <StaffPageWithPresenter presenter={presenter} />
      </BrowserRouter>,
    );

    expect(
      store.insightsStore.rootStore.analyticsStore.trackInsightsStaffPageViewed,
    ).toHaveBeenCalledWith({
      numOutlierMetrics: 3,
      staffPseudonymizedId: officerPseudoId,
      supervisorPseudonymizedId: supervisorPseudoId,
      viewedBy: supervisorPseudoId,
    });
  });

  test("analytics trackInsightsStaffMetricViewed", async () => {
    store.setMetricId(testMetric);
    vi.spyOn(AnalyticsStore.prototype, "trackInsightsStaffMetricViewed");
    vi.spyOn(rootStore.userStore, "userPseudoId", "get").mockImplementation(
      () => supervisorPseudoId,
    );

    render(
      <BrowserRouter>
        <StaffPageWithPresenter presenter={presenter} />
      </BrowserRouter>,
    );

    expect(
      store.insightsStore.rootStore.analyticsStore
        .trackInsightsStaffMetricViewed,
    ).toHaveBeenCalledWith({
      staffPseudonymizedId: officerPseudoId,
      supervisorPseudonymizedId: supervisorPseudoId,
      viewedBy: supervisorPseudoId,
      metricId: testMetric,
    });
  });

  test("renders loading indicator", () => {
    render(
      <BrowserRouter>
        <InsightsStaffPage />
      </BrowserRouter>,
    );

    // due to animated transitions the element may appear twice
    expect(screen.getAllByText("Loading data...")).toHaveLength(2);
  });

  test("renders Staff Page when hydrated", async () => {
    render(
      <BrowserRouter>
        <InsightsStaffPage />
      </BrowserRouter>,
    );

    expect(await screen.findByText("List of Absconsions")).toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <BrowserRouter>
        <InsightsStaffPage />
      </BrowserRouter>,
    );

    // Make sure the hydrated page actually loaded
    expect(await screen.findByText("List of Absconsions")).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
