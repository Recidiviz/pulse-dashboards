// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useQueryParams } from "use-query-params";

import RootStore from "../../../RootStore";
import TENANTS from "../../../tenants";
import CoreStore from "../../CoreStore";
import FiltersStore from "../../CoreStore/FiltersStore";
import PagePracticesStore from "../../CoreStore/PagePracticesStore";
import { useCoreStore } from "../../CoreStoreProvider";
import { PracticesMetric } from "../../PagePractices/types";
import PracticesSummaryCards from "..";

const mockSetQuery = jest.fn();

jest.mock("use-query-params");
jest.mock("../../CoreStoreProvider");
jest.mock("react-router-dom", () => ({
  // @ts-ignore
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn().mockReturnValue({
    pathname: "/operations",
  }),
}));
jest.mock("../../models/VitalsMetrics", () => {
  return jest.fn().mockImplementation(() => ({
    timeSeries: [],
    summaries: [
      {
        entityId: "OFFICE_A",
        entityName: "Office A",
        entityType: "LEVEL_1_SUPERVISION_LOCATION",
        overall: 85,
        overall30Day: 0,
        overall90Day: -2,
        parentEntityId: "STATE_DOC",
        timelyContact: 60,
        timelyDischarge: 63,
        timelyRiskAssessment: 69,
        timelyDowngrade: 64,
      },
      {
        entityId: "STATE_DOC",
        entityName: "State DOC",
        entityType: "LEVEL_1_SUPERVISION_LOCATION",
        overall: 95,
        overall30Day: 0,
        overall90Day: -2,
        parentEntityId: "STATE_DOC",
        timelyContact: 90,
        timelyDischarge: 93,
        timelyRiskAssessment: 99,
        timelyDowngrade: 75,
      },
    ],
  }));
});
jest.mock("../../../RootStore/TenantStore", () => {
  return jest.fn().mockImplementation(() => ({
    currentTenantId: "US_ND",
  }));
});

let coreStore: CoreStore;
let pagePracticesStore: PagePracticesStore;
let filtersStore: FiltersStore;

describe("PracticesSummaryCards", () => {
  beforeEach(() => {
    coreStore = new CoreStore(RootStore);
    filtersStore = new FiltersStore({ rootStore: coreStore });
    pagePracticesStore = coreStore.pagePracticesStore;
    (useCoreStore as jest.Mock).mockReturnValue({
      pagePracticesStore,
      setSection: jest.fn(),
      setPage: jest.fn(),
      filtersStore,
    });
    (useQueryParams as jest.Mock).mockReturnValue(["query", mockSetQuery]);
  });

  describe("metrics by tenant", () => {
    describe("when the tenant is US_ND", () => {
      const metrics =
        TENANTS.US_ND.practicesMetrics?.map((m: PracticesMetric) => m.name) ||
        [];
      metrics.forEach((metric: string) => {
        it(`renders the metric card ${metric}`, () => {
          const { getByText } = render(
            <Router>
              <PracticesSummaryCards />
            </Router>
          );
          expect(getByText(metric));
        });
      });
    });
  });

  test("selecting from menu sets the query params", async () => {
    render(
      <Router>
        <PracticesSummaryCards />
      </Router>
    );

    fireEvent.click(screen.getByText("Timely risk assessments"));
    fireEvent.click(screen.getByText("Timely contacts"));

    expect(mockSetQuery).toHaveBeenCalledTimes(2);
    expect(mockSetQuery.mock.calls[0]).toEqual([
      { selectedMetric: "Timely risk assessments" },
    ]);
    expect(mockSetQuery.mock.calls[1]).toEqual([
      { selectedMetric: "Timely contacts" },
    ]);
  });
});
