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
import { OutliersSupervisionStore } from "../../../OutliersStore/stores/OutliersSupervisionStore";
import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import OutliersSupervisorsListPage from "../OutliersSupervisorsListPage";

jest.mock("../../../components/StoreProvider");

jest
  .spyOn(UserStore.prototype, "isRecidivizUser", "get")
  .mockImplementation(() => false);

const useRootStoreMock = jest.mocked(useRootStore);
const useFeatureVariantsMock = jest.mocked(useFeatureVariants);
const supervisorPseudoId = "hashed-mdavis123";

beforeEach(() => {
  configure({ safeDescriptors: false });
});

afterEach(() => {
  jest.resetAllMocks();
  configure({ safeDescriptors: true });
});

describe("Outliers Supervisors List Page", () => {
  let store: OutliersSupervisionStore;

  beforeEach(() => {
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

    store.setSupervisorPseudoId(supervisorPseudoId);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("renders loading indicator", () => {
    render(
      <BrowserRouter>
        <OutliersSupervisorsListPage />
      </BrowserRouter>
    );

    // due to animated transitions the element may appear twice
    expect(screen.getAllByText("Loading data...")).toHaveLength(2);
  });

  test("renders Supervisors List Page when hydrated", async () => {
    render(
      <BrowserRouter>
        <OutliersSupervisorsListPage />
      </BrowserRouter>
    );

    expect(await screen.findByText("Miles D Davis")).toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <BrowserRouter>
        <OutliersSupervisorsListPage />
      </BrowserRouter>
    );

    // Make sure the hydrated page actually loaded
    expect(await screen.findByText("Miles D Davis")).toBeInTheDocument();
    const results = await axe(container, { elementRef: true });

    const idDuplicatesViolation = results.violations.find(
      (violation) => violation.id === "duplicate-id"
    );

    // ignore "duplicate-id" violation if there is one
    if (idDuplicatesViolation) {
      results.violations.splice(
        results.violations.indexOf(idDuplicatesViolation),
        1
      );
    }

    expect(results).toHaveNoViolations();
  });
});