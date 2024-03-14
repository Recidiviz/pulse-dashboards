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
import { InsightsConfigFixture } from "../../../InsightsStore/models/offlineFixtures/InsightsConfigFixture";
import { InsightsSupervisionStore } from "../../../InsightsStore/stores/InsightsSupervisionStore";
import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import InsightsSupervisorsListPage from "../InsightsSupervisorsListPage";

vi.mock("../../../components/StoreProvider");

const useRootStoreMock = vi.mocked(useRootStore);
const useFeatureVariantsMock = vi.mocked(useFeatureVariants);
const supervisorPseudoId = "hashed-mdavis123";

beforeEach(() => {
  vi.spyOn(UserStore.prototype, "isRecidivizUser", "get").mockImplementation(
    () => false,
  );
  configure({ safeDescriptors: false });
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

describe("Insights Supervisors List Page", () => {
  let store: InsightsSupervisionStore;

  beforeEach(() => {
    const rootStore = new RootStore();
    store = new InsightsSupervisionStore(
      rootStore.insightsStore,
      InsightsConfigFixture,
    );
    rootStore.insightsStore.supervisionStore = store;
    useRootStoreMock.mockReturnValue(rootStore);
    useFeatureVariantsMock.mockReturnValue({});

    vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);

    store.setSupervisorPseudoId(supervisorPseudoId);
  });

  test("renders loading indicator", () => {
    render(
      <BrowserRouter>
        <InsightsSupervisorsListPage />
      </BrowserRouter>,
    );

    // due to animated transitions the element may appear twice
    expect(screen.getAllByText("Loading data...")).toHaveLength(2);
  });

  test("renders Supervisors List Page when hydrated", async () => {
    render(
      <BrowserRouter>
        <InsightsSupervisorsListPage />
      </BrowserRouter>,
    );

    expect(await screen.findByText("Miles D Davis")).toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <BrowserRouter>
        <InsightsSupervisorsListPage />
      </BrowserRouter>,
    );

    // Make sure the hydrated page actually loaded
    expect(await screen.findByText("Miles D Davis")).toBeInTheDocument();
    const results = await axe(container, { elementRef: true });

    const idDuplicatesViolation = results.violations.find(
      (violation) => violation.id === "duplicate-id",
    );

    // ignore "duplicate-id" violation if there is one
    if (idDuplicatesViolation) {
      results.violations.splice(
        results.violations.indexOf(idDuplicatesViolation),
        1,
      );
    }

    expect(results).toHaveNoViolations();
  });
});
