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

import { useRootStore } from "../../../components/StoreProvider";
import { InsightsConfigFixture } from "../../../InsightsStore/models/offlineFixtures/InsightsConfigFixture";
import { supervisionOfficerSupervisorsFixture } from "../../../InsightsStore/models/offlineFixtures/SupervisionOfficerSupervisor";
import { SupervisionOfficersPresenter } from "../../../InsightsStore/presenters/SupervisionOfficersPresenter";
import { InsightsSupervisionStore } from "../../../InsightsStore/stores/InsightsSupervisionStore";
import { RootStore } from "../../../RootStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import UserStore from "../../../RootStore/UserStore";
import InsightsSupervisorPage, {
  SupervisorPage,
} from "../InsightsSupervisorPage";

jest.mock("../../../components/StoreProvider");
jest.mock(
  "../../../InsightsStore/presenters/SwarmPresenter/getSwarmLayoutWorker",
);

jest
  .spyOn(UserStore.prototype, "isRecidivizUser", "get")
  .mockImplementation(() => false);

const useRootStoreMock = jest.mocked(useRootStore);

beforeEach(() => {
  configure({ safeDescriptors: false });
});

afterEach(() => {
  jest.resetAllMocks();
  configure({ safeDescriptors: true });
});

const supervisorUser = supervisionOfficerSupervisorsFixture[0];
const supervisorPseudoId = supervisorUser.pseudonymizedId;

describe("Hydrated Supervisor Page", () => {
  let presenter: SupervisionOfficersPresenter;
  let rootStore: RootStore;
  let store: InsightsSupervisionStore;

  beforeEach(async () => {
    rootStore = new RootStore();
    store = new InsightsSupervisionStore(
      rootStore.insightsStore,
      InsightsConfigFixture,
    );
    rootStore.insightsStore.supervisionStore = store;
    useRootStoreMock.mockReturnValue(rootStore);
    presenter = new SupervisionOfficersPresenter(store, supervisorPseudoId);
    await presenter?.hydrate();
  });

  test("Renders the correct title", async () => {
    jest
      .spyOn(store, "userCanAccessAllSupervisors", "get")
      .mockReturnValue(true);
    // re-hydrate to pick up the mock
    await presenter?.hydrate();
    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>,
    );

    [
      "2 of the 3 officers in Miles D Davis's team are",
      "outliers",
      "on one or more metrics",
    ].forEach((text) => {
      expect(screen.getByText(text, { exact: false })).toBeInTheDocument();
    });
  });

  test("Renders the info items", () => {
    jest
      .spyOn(store, "currentSupervisorUser", "get")
      .mockReturnValue(supervisorUser);
    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>,
    );

    [
      "D1",
      "Miles D Davis",
      "Duke Ellington, Chet Baker, Louis Armstrong",
    ].forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  test("renders back button", () => {
    jest
      .spyOn(store, "userCanAccessAllSupervisors", "get")
      .mockReturnValue(true);
    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>,
    );
    expect(
      screen.getByRole("link", { name: "Go to supervisors list" }),
    ).toBeInTheDocument();
  });

  test("renders back button for supervisor who can access all supervisors", () => {
    jest
      .spyOn(store, "currentSupervisorUser", "get")
      .mockReturnValue(supervisorUser);
    jest
      .spyOn(store, "userCanAccessAllSupervisors", "get")
      .mockReturnValue(true);
    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>,
    );
    expect(
      screen.getByRole("link", { name: "Go to supervisors list" }),
    ).toBeInTheDocument();
  });

  test("does not render back button", () => {
    jest
      .spyOn(store, "currentSupervisorUser", "get")
      .mockReturnValue(supervisorUser);
    jest
      .spyOn(store, "userCanAccessAllSupervisors", "get")
      .mockReturnValue(false);

    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>,
    );
    expect(
      screen.queryByRole("link", { name: "Go to supervisors list" }),
    ).toBeNull();
  });

  test("Renders the correct title if current user is supervisor", () => {
    jest
      .spyOn(store, "currentSupervisorUser", "get")
      .mockReturnValue(supervisorUser);
    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>,
    );

    [
      "2 of the 3 officers in your team are",
      "outliers",
      "on one or more metrics",
    ].forEach((text) => {
      expect(screen.getByText(text, { exact: false })).toBeInTheDocument();
    });
  });

  test("analytics trackInsightsSupervisorPageViewed", () => {
    jest.spyOn(AnalyticsStore.prototype, "trackInsightsSupervisorPageViewed");
    jest
      .spyOn(rootStore.userStore, "userPseudoId", "get")
      .mockReturnValue(supervisorPseudoId);
    jest
      .spyOn(store, "currentSupervisorUser", "get")
      .mockReturnValue(supervisorUser);

    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>,
    );

    expect(
      store.insightsStore.rootStore.analyticsStore
        .trackInsightsSupervisorPageViewed,
    ).toHaveBeenCalledWith({
      supervisorPseudonymizedId: supervisorPseudoId,
      viewedBy: supervisorPseudoId,
    });
  });
});

describe("Insights Supervisor Page", () => {
  let store: InsightsSupervisionStore;

  beforeEach(() => {
    const rootStore = new RootStore();
    store = new InsightsSupervisionStore(
      rootStore.insightsStore,
      InsightsConfigFixture,
    );
    rootStore.insightsStore.supervisionStore = store;
    useRootStoreMock.mockReturnValue(rootStore);

    jest
      .spyOn(store, "userCanAccessAllSupervisors", "get")
      .mockReturnValue(true);
    store.setSupervisorPseudoId("hashed-mdavis123");
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("renders loading indicator", () => {
    render(
      <BrowserRouter>
        <InsightsSupervisorPage />
      </BrowserRouter>,
    );

    // two elements expected because of animated transition
    expect(screen.getAllByText("Loading data...")).toHaveLength(2);
  });

  test("renders error page", async () => {
    jest.spyOn(store, "populateMetricConfigs").mockImplementation(() => {
      throw new Error("There was an error");
    });

    render(
      <BrowserRouter>
        <InsightsSupervisorPage />
      </BrowserRouter>,
    );

    expect(
      await screen.findByText("Sorry, we’re having trouble loading this page"),
    ).toBeInTheDocument();
  });

  test("renders Supervisor Page when hydrated", async () => {
    render(
      <BrowserRouter>
        <InsightsSupervisorPage />
      </BrowserRouter>,
    );

    expect(await screen.findByText("Miles D Davis")).toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <BrowserRouter>
        <InsightsSupervisorPage />
      </BrowserRouter>,
    );

    // Make sure the hydrated page actually loaded
    expect(await screen.findByText("Miles D Davis")).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});