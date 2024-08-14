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

import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { configure } from "mobx";
import { BrowserRouter } from "react-router-dom";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../components/StoreProvider";
import { InsightsConfigFixture } from "../../../InsightsStore/models/offlineFixtures/InsightsConfigFixture";
import { supervisionOfficerSupervisorsFixture } from "../../../InsightsStore/models/offlineFixtures/SupervisionOfficerSupervisor";
import { SupervisionOfficersPresenter } from "../../../InsightsStore/presenters/SupervisionOfficersPresenter";
import { HighlightedOfficersDetail } from "../../../InsightsStore/presenters/types";
import { InsightsSupervisionStore } from "../../../InsightsStore/stores/InsightsSupervisionStore";
import { RootStore } from "../../../RootStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import UserStore from "../../../RootStore/UserStore";
import InsightsSupervisorPage, {
  SupervisorPage,
} from "../InsightsSupervisorPage";
import { highlightedOfficerText } from "../utils";

vi.mock("../../../components/StoreProvider");
vi.mock(
  "../../../InsightsStore/presenters/SwarmPresenter/getSwarmLayoutWorker",
);

const useRootStoreMock = vi.mocked(useRootStore);
const useFeatureVariantsMock = vi.mocked(useFeatureVariants);

beforeEach(() => {
  useFeatureVariantsMock.mockReturnValue({ supervisorHomepage: undefined });
  vi.spyOn(UserStore.prototype, "isRecidivizUser", "get").mockImplementation(
    () => false,
  );
  vi.spyOn(UserStore.prototype, "stateCode", "get").mockImplementation(
    () => "US_CA",
  );
  vi.spyOn(UserStore.prototype, "userPseudoId", "get").mockImplementation(
    () => supervisorUser.pseudonymizedId,
  );
  configure({ safeDescriptors: false });
});

afterEach(() => {
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
    vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
    // re-hydrate to pick up the mock
    await presenter?.hydrate();
    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>,
    );

    [
      "2 of the 3 officers in Alejandro D Gonzalez's team are",
      "outliers",
      "on one or more metrics",
    ].forEach((text) => {
      expect(screen.getByText(text, { exact: false })).toBeInTheDocument();
    });
  });

  test("Renders the info items", async () => {
    vi.spyOn(store, "currentSupervisorUser", "get").mockReturnValue(
      supervisorUser,
    );
    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>,
    );

    await Promise.all(
      [
        "D1",
        "Alejandro D Gonzalez",
        "Walter Harris, Jack Hernandez, Jason Nelson",
      ].map((text) =>
        waitFor(() => expect(screen.getByText(text)).toBeInTheDocument()),
      ),
    );
  });

  test("renders back button", async () => {
    vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "Go to supervisors list" }),
      ).toBeInTheDocument(),
    );
  });

  test("renders back button for supervisor who can access all supervisors", async () => {
    vi.spyOn(store, "currentSupervisorUser", "get").mockReturnValue(
      supervisorUser,
    );
    vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "Go to supervisors list" }),
      ).toBeInTheDocument(),
    );
  });

  test("does not render back button", () => {
    vi.spyOn(store, "currentSupervisorUser", "get").mockReturnValue(
      supervisorUser,
    );
    vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(
      false,
    );

    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>,
    );
    expect(
      screen.queryByRole("link", { name: "Go to supervisors list" }),
    ).toBeNull();
  });

  test("Renders the correct title if current user is supervisor", async () => {
    vi.spyOn(store, "currentSupervisorUser", "get").mockReturnValue(
      supervisorUser,
    );
    vi.spyOn(store, "supervisorIsCurrentUser", "get").mockReturnValue(true);
    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>,
    );

    await Promise.all(
      [
        "2 of the 3 officers in your team are",
        "outliers",
        "on one or more metrics",
      ].map((text) =>
        waitFor(() =>
          expect(screen.getByText(text, { exact: false })).toBeInTheDocument(),
        ),
      ),
    );
  });

  test("analytics trackInsightsSupervisorPageViewed", async () => {
    vi.spyOn(AnalyticsStore.prototype, "trackInsightsSupervisorPageViewed");
    vi.spyOn(rootStore.userStore, "userPseudoId", "get").mockReturnValue(
      supervisorPseudoId,
    );
    vi.spyOn(store, "currentSupervisorUser", "get").mockReturnValue(
      supervisorUser,
    );

    await presenter?.hydrate();

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

    vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
    store.setSupervisorPseudoId("hashed-agonzalez123");
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
    vi.spyOn(store, "populateMetricConfigs").mockImplementation(() => {
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

    expect(await screen.findByText("Alejandro D Gonzalez")).toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <BrowserRouter>
        <InsightsSupervisorPage />
      </BrowserRouter>,
    );

    // Make sure the hydrated page actually loaded
    expect(await screen.findByText("Alejandro D Gonzalez")).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("highlighted officer text singular", () => {
    const detail = {
      metricName: "program/treatment start",
      officerNames: ["Jack Hernandez"],
      numOfficers: 1,
      topXPct: 10,
    } as HighlightedOfficersDetail;
    const expected =
      "Jack Hernandez is in the top 10% of officers in the state for highest program/treatment start rate this year.";
    expect(highlightedOfficerText(detail, "officer")).toBe(expected);
  });

  test("highlighted officer text plural", () => {
    const detail = {
      metricName: "program/treatment start",
      officerNames: ["Jack Hernandez", "Jason Nelson", "William James"],
      numOfficers: 2,
      topXPct: 10,
    } as HighlightedOfficersDetail;
    const expected =
      "Jack Hernandez, Jason Nelson, and William James are in the top 10% of officers in the state for highest program/treatment start rate this year.";
    expect(highlightedOfficerText(detail, "officer")).toBe(expected);
  });
});
