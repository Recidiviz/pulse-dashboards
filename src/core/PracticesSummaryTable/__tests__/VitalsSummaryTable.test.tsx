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

import { render } from "@testing-library/react";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import RootStore from "../../../RootStore";
import TENANTS from "../../../tenants";
import CoreStore from "../../CoreStore";
import PagePracticesStore from "../../CoreStore/PagePracticesStore";
import { useCoreStore } from "../../CoreStoreProvider";
import { PracticesMetric } from "../../PagePractices/types";
import PracticesSummaryTable from "../PracticesSummaryTable";

jest.mock("../../CoreStoreProvider");
jest.mock("../../models/ProjectionsMetrics");
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

describe("PracticesSummaryTable", () => {
  beforeEach(() => {
    coreStore = new CoreStore(RootStore);
    pagePracticesStore = coreStore.pagePracticesStore;
    (useCoreStore as jest.Mock).mockReturnValue({ pagePracticesStore });
  });

  describe("metrics by tenant", () => {
    describe("when the tenant is US_ND", () => {
      const metrics =
        TENANTS.US_ND.practicesMetrics?.map((m: PracticesMetric) => m.name) ||
        [];
      metrics.forEach((metric: string) => {
        it(`renders a column with header ${metric}`, () => {
          const { getAllByText } = render(
            <Router>
              <PracticesSummaryTable />
            </Router>
          );
          expect(getAllByText(metric));
        });
      });
    });
  });
});
