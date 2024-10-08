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

import { callMetricsApi } from "../../../api/metrics/metricsClient";
import RootStore from "../../../RootStore";
import VitalsMetrics from "../VitalsMetrics";

const mockTenantId = "US_ND";

vi.mock("../../../RootStore");
vi.mock("../../../api/metrics/metricsClient");

describe("VitalsMetrics", () => {
  let metric: VitalsMetrics;

  beforeEach(() => {
    vi.mocked(callMetricsApi).mockResolvedValue({
      vitals_summaries: [
        {
          entity_id: "STATE_DOC",
          entity_name: "STATE DOC",
          entity_type: "state",
          most_recent_date_of_supervision: "2021-04-06",
          overall: 90,
          overall_30d: 0,
          overall_90d: -1,
          parent_entity_id: "STATE_DOC",
          state_code: "US_ND",
          timely_contact: "80",
          timely_discharge: 97,
          timely_risk_assessment: 88,
          timely_downgrade: 60,
        },
      ],
      vitals_time_series: [
        {
          avg_30d: 90.625,
          date: "2021-03-30",
          entity_id: "BEULAH",
          metric: "RISK_ASSESSMENT",
          state_code: "US_ND",
          value: 90.625,
        },
      ],
    });

    metric = new VitalsMetrics({
      tenantId: mockTenantId,
      sourceEndpoint: "vitals",
    });
  });

  it("fetches metrics when initialized", () => {
    expect(callMetricsApi).toHaveBeenCalledWith(
      `${mockTenantId.toLowerCase()}/vitals`,
      RootStore.getTokenSilently,
    );
  });

  it("sets apiData to the resolved fetched value", () => {
    expect(metric.apiData).toHaveProperty("vitals_summaries");
    expect(metric.apiData).toHaveProperty("vitals_time_series");
  });

  it("sets isLoading to false", () => {
    expect(metric.isLoading).toEqual(false);
  });

  it("has a transformed summaries property", () => {
    expect(metric.summaries).toEqual([
      {
        entityId: "STATE_DOC",
        entityName: "State Doc",
        entityType: "STATE",
        parentEntityId: "STATE_DOC",
        overall: 90,
        timelyDischarge: 97,
        timelyContact: 80,
        timelyRiskAssessment: 88,
        timelyDowngrade: 60,
        overall30Day: 0,
        overall90Day: -1,
      },
    ]);
  });

  it("has a transformed timeSeries property", () => {
    expect(metric.timeSeries).toEqual([
      {
        date: "2021-03-30",
        entityId: "BEULAH",
        metric: "RISK_ASSESSMENT",
        value: 90.625,
        monthlyAvg: 90.625,
      },
    ]);
  });
});
