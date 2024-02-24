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
import { BrowserRouter as Router } from "react-router-dom";
import { useQueryParams } from "use-query-params";

import RootStore from "../../../RootStore";
import TENANTS from "../../../tenants";
import CoreStore from "../../CoreStore";
import FiltersStore from "../../CoreStore/FiltersStore";
import VitalsStore from "../../CoreStore/VitalsStore";
import { useCoreStore } from "../../CoreStoreProvider";
import { METRIC_TYPES, VitalsMetric } from "../../PageVitals/types";
import VitalsSummaryCards from "..";

const mockSetSelectedMetricId = jest.fn();

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
let vitalsStore: VitalsStore;
let filtersStore: FiltersStore;

describe("VitalsSummaryCards", () => {
  beforeEach(() => {
    coreStore = new CoreStore(RootStore);
    filtersStore = new FiltersStore({ rootStore: coreStore });
    vitalsStore = coreStore.vitalsStore;
    (useCoreStore as jest.Mock).mockReturnValue({
      vitalsStore,
      setSection: jest.fn(),
      setPage: jest.fn(),
      filtersStore,
    });
    (useQueryParams as jest.Mock).mockReturnValue(["query", jest.fn()]);

    vitalsStore.setSelectedMetricId = mockSetSelectedMetricId;
  });

  describe("metrics by tenant", () => {
    describe("when the tenant is US_ND", () => {
      const metrics =
        TENANTS.US_ND.vitalsMetrics?.map((m: VitalsMetric) => m.name) || [];
      metrics.forEach((metric: string) => {
        it(`renders the metric card ${metric}`, () => {
          const { getByText } = render(
            <Router>
              <VitalsSummaryCards />
            </Router>
          );
          expect(getByText(metric));
        });
      });
    });
  });

  test("selecting from menu sets the selectedMetricId", async () => {
    render(
      <Router>
        <VitalsSummaryCards />
      </Router>
    );

    mockSetSelectedMetricId.mockReset();

    fireEvent.click(screen.getByText("Timely risk assessments"));
    fireEvent.click(screen.getByText("Timely contacts"));

    expect(mockSetSelectedMetricId).toHaveBeenCalledTimes(2);
    expect(mockSetSelectedMetricId.mock.calls[0]).toEqual([
      METRIC_TYPES.RISK_ASSESSMENT,
    ]);
    expect(mockSetSelectedMetricId.mock.calls[1]).toEqual([
      METRIC_TYPES.CONTACT,
    ]);
  });
});
