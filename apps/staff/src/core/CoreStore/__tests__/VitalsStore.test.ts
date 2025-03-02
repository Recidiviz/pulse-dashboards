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

import { RootStore } from "../../../RootStore";
import TenantStore from "../../../RootStore/TenantStore";
import VitalsMetrics from "../../models/VitalsMetrics";
import CoreStore from "..";
import VitalsStore, { getSummaryStatus } from "../VitalsStore";

vi.mock("../../models/VitalsMetrics");
vi.mock("../../../RootStore/TenantStore");

describe("getSummaryStatus", () => {
  describe("when value is less than 70", () => {
    it("returns POOR", () => {
      [0, 15, 25, 69].forEach((number) => {
        expect(getSummaryStatus(number)).toEqual("POOR");
      });
    });
  });
  describe("when value is greater than or equal to 70 and less than 80", () => {
    it("returns NEEDS_IMPROVEMENT", () => {
      [70, 75, 79].forEach((number) => {
        expect(getSummaryStatus(number)).toEqual("NEEDS_IMPROVEMENT");
      });
    });
  });
  describe("when value is greater than or equal to 80 and less than 90", () => {
    it("returns GOOD", () => {
      [80, 85, 89].forEach((number) => {
        expect(getSummaryStatus(number)).toEqual("GOOD");
      });
    });
  });
  describe("when value is greater than or equal to 90 and less than 95", () => {
    it("returns GREAT", () => {
      [90, 94].forEach((number) => {
        expect(getSummaryStatus(number)).toEqual("GREAT");
      });
    });
  });
  describe("when value is greater than 95", () => {
    it("returns EXCELLENT", () => {
      [95, 100].forEach((number) => {
        expect(getSummaryStatus(number)).toEqual("EXCELLENT");
      });
    });
  });
});

let coreStore: CoreStore;
let vitalsStore: VitalsStore;

describe("VitalsStore", () => {
  beforeEach(() => {
    // @ts-expect-error
    vi.mocked(VitalsMetrics).mockImplementation(() => ({
      timeSeries: [
        {
          date: "2021-03-11",
          entityId: "STATE_DOC",
          metric: "OVERALL",
          value: 72.5,
          monthlyAvg: 72.8,
        },
        {
          date: "2021-03-12",
          entityId: "STATE_DOC",
          metric: "OVERALL",
          value: 75.5,
          monthlyAvg: 75.8,
        },
        {
          date: "2021-03-11",
          entityId: "STATE_DOC",
          metric: "DISCHARGE",
          value: 62.5,
          monthlyAvg: 62.8,
        },
        {
          date: "2021-03-12",
          entityId: "STATE_DOC",
          metric: "DISCHARGE",
          value: 65.5,
          monthlyAvg: 65.8,
        },
        {
          date: "2021-03-11",
          entityId: "STATE_DOC",
          metric: "CONTACT",
          value: 42.5,
          monthlyAvg: 42.8,
        },
        {
          date: "2021-03-12",
          entityId: "STATE_DOC",
          metric: "CONTACT",
          value: 45.5,
          monthlyAvg: 45.8,
        },
        {
          date: "2021-03-11",
          entityId: "STATE_DOC",
          metric: "RISK_ASSESSMENT",
          value: 32.5,
          monthlyAvg: 32.8,
        },
        {
          date: "2021-03-12",
          entityId: "STATE_DOC",
          metric: "RISK_ASSESSMENT",
          value: 35.5,
          monthlyAvg: 35.8,
        },
        {
          date: "2021-03-11",
          entityId: "STATE_DOC",
          metric: "DOWNGRADE",
          value: 67.5,
          monthlyAvg: 67.8,
        },
        {
          date: "2021-03-12",
          entityId: "STATE_DOC",
          metric: "DOWNGRADE",
          value: 68.5,
          monthlyAvg: 68.8,
        },
      ],
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
          timelyDowngrade: 67,
        },
        {
          entityId: "OFFICE_B",
          entityName: "Office B",
          entityType: "LEVEL_1_SUPERVISION_LOCATION",
          overall: 95,
          overall30Day: 0,
          overall90Day: -2,
          parentEntityId: "STATE_DOC",
          timelyContact: 90,
          timelyDischarge: 93,
          timelyRiskAssessment: 99,
          timelyDowngrade: 67,
        },
      ],
    }));
  });

  describe("when the tenant is US_ND", () => {
    beforeEach(() => {
      // @ts-expect-error
      vi.mocked(TenantStore).mockImplementation(() => ({
        currentTenantId: "US_ND",
      }));

      coreStore = new CoreStore(new RootStore());
      vitalsStore = coreStore.vitalsStore;
      coreStore.tenantStore.currentTenantId = "US_ND";
    });

    describe("getTimeSeriesDownloadableData", () => {
      it("returns the data formatted for download", () => {
        const expected = {
          chartDatasets: [
            { data: ["STATE_DOC", "STATE_DOC"], label: "Id" },
            {
              data: [
                {
                  Total: "73%",
                  "30D average": "73%",
                },
                {
                  Total: "76%",
                  "30D average": "76%",
                },
              ],
              label: "Overall across all practices",
            },
            {
              data: [
                {
                  Total: "63%",
                  "30D average": "63%",
                },
                {
                  Total: "66%",
                  "30D average": "66%",
                },
              ],
              label: "Timely discharge",
            },
            {
              data: [
                {
                  Total: "43%",
                  "30D average": "43%",
                },
                {
                  Total: "46%",
                  "30D average": "46%",
                },
              ],
              label: "Timely contacts",
            },
            {
              data: [
                {
                  Total: "33%",
                  "30D average": "33%",
                },
                {
                  Total: "36%",
                  "30D average": "36%",
                },
              ],
              label: "Timely risk assessments",
            },
          ],
          chartLabels: ["2021-03-11", "2021-03-12"],
          chartId: "MetricsOverTime",
          dataExportLabel: "Date",
        };
        const result = vitalsStore.timeSeriesDownloadableData;
        expect(result).toEqual(expected);
      });
    });

    describe("getSummaryDownloadableData", () => {
      it("returns the data formatted for download", () => {
        const expected = {
          chartDatasets: [
            {
              data: [
                {
                  "90D change": "-2%",
                  "30D change": "0%",
                  "Overall across all practices": "85%",
                  "Timely contacts": "60%",
                  "Timely discharge": "63%",
                  "Timely risk assessments": "69%",
                },
                {
                  "90D change": "-2%",
                  "30D change": "0%",
                  "Overall across all practices": "95%",
                  "Timely contacts": "90%",
                  "Timely discharge": "93%",
                  "Timely risk assessments": "99%",
                },
              ],
              label: "",
            },
          ],
          chartLabels: ["Office A", "Office B"],
          chartId: "MetricsByOffice",
          dataExportLabel: "Office",
        };
        const result = vitalsStore.summaryDownloadableData;
        expect(result).toEqual(expected);
      });
    });

    describe("metrics", () => {
      it("returns the correct metrics", () => {
        const expected = [
          {
            accessor: "overall",
            description: "Average timeliness across all metrics",
            id: "OVERALL",
            name: "Overall across all practices",
          },
          {
            accessor: "timelyDischarge",
            description: `of clients were discharged at their earliest projected regular
        supervision discharge date`,
            id: "DISCHARGE",
            name: "Timely discharge",
          },
          {
            accessor: "timelyContact",
            description: `of clients received initial contact within 30 days of
        starting supervision and a F2F contact every subsequent 3 months,
        2 months, or 1 month for minimum, medium, and maximum supervision
        levels respectively`,
            id: "CONTACT",
            name: "Timely contacts",
          },
          {
            accessor: "timelyRiskAssessment",
            description: `of clients have had an initial assessment within 30 days and 
        reassessment within 212 days`,
            id: "RISK_ASSESSMENT",
            name: "Timely risk assessments",
          },
        ];
        const result = vitalsStore.metrics;
        expect(result).toEqual(expected);
      });
    });
  });

  describe("when the tenant is US_ID", () => {
    beforeEach(() => {
      coreStore = new CoreStore(new RootStore());
      vitalsStore = coreStore.vitalsStore;
      coreStore.tenantStore.currentTenantId = "US_ID";
    });

    describe("getTimeSeriesDownloadableData", () => {
      it("returns the data formatted for download", () => {
        const expected = {
          chartDatasets: [
            { data: ["STATE_DOC", "STATE_DOC"], label: "Id" },
            {
              data: [
                {
                  Total: "73%",
                  "30D average": "73%",
                },
                {
                  Total: "76%",
                  "30D average": "76%",
                },
              ],
              label: "Overall across all practices",
            },
            {
              data: [
                {
                  Total: "33%",
                  "30D average": "33%",
                },
                {
                  Total: "36%",
                  "30D average": "36%",
                },
              ],
              label: "Timely risk assessments",
            },
            {
              data: [
                {
                  Total: "43%",
                  "30D average": "43%",
                },
                {
                  Total: "46%",
                  "30D average": "46%",
                },
              ],
              label: "Timely F2F contacts",
            },
            {
              data: [
                {
                  Total: "68%",
                  "30D average": "68%",
                },
                {
                  Total: "69%",
                  "30D average": "69%",
                },
              ],
              label: "Supervision & risk level match",
            },
          ],
          chartLabels: ["2021-03-11", "2021-03-12"],
          chartId: "MetricsOverTime",
          dataExportLabel: "Date",
        };
        const result = vitalsStore.timeSeriesDownloadableData;
        expect(result).toEqual(expected);
      });
    });

    describe("getSummaryDownloadableData", () => {
      it("returns the data formatted for download", () => {
        const expected = {
          chartDatasets: [
            {
              data: [
                {
                  "90D change": "-2%",
                  "30D change": "0%",
                  "Overall across all practices": "85%",
                  "Timely F2F contacts": "60%",
                  "Supervision & risk level match": "67%",
                  "Timely risk assessments": "69%",
                },
                {
                  "90D change": "-2%",
                  "30D change": "0%",
                  "Overall across all practices": "95%",
                  "Timely F2F contacts": "90%",
                  "Supervision & risk level match": "67%",
                  "Timely risk assessments": "99%",
                },
              ],
              label: "",
            },
          ],
          chartLabels: ["Office A", "Office B"],
          chartId: "MetricsByOffice",
          dataExportLabel: "Office",
        };
        const result = vitalsStore.summaryDownloadableData;
        expect(result).toEqual(expected);
      });
    });

    describe("metrics", () => {
      it("returns the correct metrics", () => {
        const expected = [
          {
            accessor: "overall",
            description: "Average timeliness across all metrics",
            id: "OVERALL",
            name: "Overall across all practices",
          },
          {
            accessor: "timelyRiskAssessment",
            description: `of clients have an up-to-date risk assessment, according to IDOC policy.`,
            id: "RISK_ASSESSMENT",
            name: "Timely risk assessments",
          },
          {
            accessor: "timelyContact",
            description: `of clients have an up-to-date face-to-face contact, according to IDOC policy`,
            id: "CONTACT",
            name: "Timely F2F contacts",
          },
          {
            accessor: "timelyDowngrade",
            description: `of clients are at a supervision level that is the same or below their risk level.`,
            id: "DOWNGRADE",
            name: "Supervision & risk level match",
          },
        ];
        const result = vitalsStore.metrics;
        expect(result).toEqual(expected);
      });
    });
  });
});
