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

import { BrowserRouter as Router } from "react-router-dom";
import { Mock } from "vitest";

import RootStore from "../../../RootStore";
import TENANTS from "../../../tenants";
import { render } from "../../../testUtils";
import CoreStore from "../../CoreStore";
import VitalsStore from "../../CoreStore/VitalsStore";
import { useCoreStore } from "../../CoreStoreProvider";
import VitalsMetrics from "../../models/VitalsMetrics";
import { VitalsMetric } from "../../PageVitals/types";
import VitalsSummaryTable from "../VitalsSummaryTable";

vi.mock("../../CoreStoreProvider");
vi.mock("../../models/VitalsMetrics");
vi.mock("../../../RootStore/TenantStore", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      currentTenantId: "US_ND",
    })),
  };
});

let coreStore: CoreStore;
let vitalsStore: VitalsStore;

describe("VitalsSummaryTable", () => {
  beforeEach(() => {
    (VitalsMetrics as Mock).mockImplementation(() => ({
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

    coreStore = new CoreStore(RootStore);
    vitalsStore = coreStore.vitalsStore;
    (useCoreStore as Mock).mockReturnValue({ vitalsStore });
  });

  describe("metrics by tenant", () => {
    describe("when the tenant is US_ND", () => {
      const metrics =
        TENANTS.US_ND.vitalsMetrics?.map((m: VitalsMetric) => m.name) || [];
      it.each(metrics)(`renders a column with header %s`, (metric) => {
        const { getAllByText } = render(
          <Router>
            <VitalsSummaryTable />
          </Router>,
        );
        expect(getAllByText(metric));
      });
    });
  });
});
