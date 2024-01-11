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
import { axe } from "jest-axe";
import { configure } from "mobx";
import { BrowserRouter } from "react-router-dom";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../components/StoreProvider";
import { OutliersConfigFixture } from "../../../OutliersStore/models/offlineFixtures/OutliersConfigFixture";
import { supervisionOfficerFixture } from "../../../OutliersStore/models/offlineFixtures/SupervisionOfficerFixture";
import { SupervisionOfficerDetailPresenter } from "../../../OutliersStore/presenters/SupervisionOfficerDetailPresenter";
import { OutliersSupervisionStore } from "../../../OutliersStore/stores/OutliersSupervisionStore";
import { RootStore } from "../../../RootStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import UserStore from "../../../RootStore/UserStore";
import OutliersStaffPage, {
  StaffPageWithPresenter,
} from "../OutliersStaffPage";

jest.mock("../../../components/StoreProvider");
jest.mock(
  "../../../OutliersStore/presenters/SwarmPresenter/getSwarmLayoutWorker"
);
jest
  .spyOn(UserStore.prototype, "isRecidivizUser", "get")
  .mockImplementation(() => false);

const useRootStoreMock = jest.mocked(useRootStore);
const useFeatureVariantsMock = jest.mocked(useFeatureVariants);
const supervisorPseudoId = "hashed-mdavis123";
const officerPseudoId = supervisionOfficerFixture[0].pseudonymizedId;
const testMetric = supervisionOfficerFixture[0].outlierMetrics[0].metricId;

beforeEach(() => {
  configure({ safeDescriptors: false });
});

afterEach(() => {
  jest.resetAllMocks();
  configure({ safeDescriptors: true });
});

describe("Hydrated Staff Page", () => {
  let presenter: SupervisionOfficerDetailPresenter;
  let store: OutliersSupervisionStore;

  beforeEach(async () => {
    jest
      .spyOn(UserStore.prototype, "userPseudoId", "get")
      .mockImplementation(() => supervisorPseudoId);

    store = new OutliersSupervisionStore(
      new RootStore().outliersStore,
      OutliersConfigFixture
    );
    jest
      .spyOn(store, "userCanAccessAllSupervisors", "get")
      .mockReturnValue(true);
    presenter = new SupervisionOfficerDetailPresenter(store, officerPseudoId);
    await presenter?.hydrate();
  });

  test("analytics trackOutliersStaffPageViewed", () => {
    jest.spyOn(AnalyticsStore.prototype, "trackOutliersStaffPageViewed");

    render(
      <BrowserRouter>
        <StaffPageWithPresenter presenter={presenter} />
      </BrowserRouter>
    );

    expect(
      store.outliersStore.rootStore.analyticsStore.trackOutliersStaffPageViewed
    ).toHaveBeenCalledWith({
      numOutlierMetrics: 2,
      staffPseudonymizedId: officerPseudoId,
      supervisorPseudonymizedId: supervisorPseudoId,
      viewedBy: supervisorPseudoId,
    });
  });
});

describe("Outliers Staff Page", () => {
  let store: OutliersSupervisionStore;

  beforeEach(async () => {
    const rootStore = new RootStore();
    store = new OutliersSupervisionStore(
      rootStore.outliersStore,
      OutliersConfigFixture
    );
    rootStore.outliersStore.supervisionStore = store;
    useRootStoreMock.mockReturnValue(rootStore);
    useFeatureVariantsMock.mockReturnValue({});

    jest
      .spyOn(store, "userCanAccessAllSupervisors", "get")
      .mockReturnValue(true);

    store.setOfficerPseudoId(officerPseudoId);
    store.setMetricId(testMetric);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("renders loading indicator", () => {
    render(
      <BrowserRouter>
        <OutliersStaffPage />
      </BrowserRouter>
    );

    // due to animated transitions the element may appear twice
    expect(screen.getAllByText("Loading data...")).toHaveLength(2);
  });

  test("renders Staff Page when hydrated", async () => {
    render(
      <BrowserRouter>
        <OutliersStaffPage />
      </BrowserRouter>
    );

    expect(await screen.findByText("List of Absconsions")).toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <BrowserRouter>
        <OutliersStaffPage />
      </BrowserRouter>
    );

    // Make sure the hydrated page actually loaded
    expect(await screen.findByText("List of Absconsions")).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
