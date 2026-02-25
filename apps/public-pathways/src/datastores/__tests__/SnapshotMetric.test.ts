// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { waitFor } from "@testing-library/dom";
import { runInAction, when } from "mobx";

import { isHydrated } from "~hydration-utils";
import {
  isAbortException,
  PATHWAYS_SECTIONS,
  SnapshotMetric,
} from "~shared-pathways";

import MetricsStore from "../MetricsStore";
import type { RootStore } from "../RootStore";

const BASE_URL = "http://localhost:5000";
const DIMENSION_COUNT_URL = `${BASE_URL}/public_pathways/US_NY/PrisonPopulationByDimensionCount`;

const mockRootStore = {
  userStore: {
    getTokenSilently: vi.fn().mockResolvedValue("test-token"),
  },
} as unknown as RootStore;

describe("SnapshotMetric", () => {
  let metric: SnapshotMetric;
  let metricsStore: MetricsStore;

  beforeEach(async () => {
    vi.stubEnv("VITE_PUBLIC_PATHWAYS_API_URL_BASE", BASE_URL);

    fetchMock.mockResponse(
      JSON.stringify({
        data: [
          { facility: "FACILITY_1", count: 150 },
          { facility: "FACILITY_2", count: 100 },
        ],
        metadata: {
          lastUpdated: "2022-01-01",
        },
      }),
    );

    metricsStore = new MetricsStore({ rootStore: mockRootStore });
    metricsStore.section = PATHWAYS_SECTIONS["countByLocation"];
    metric = metricsStore.prisonFacilityPopulation;
    metric.hydrate();
    await when(() => isHydrated(metric));
  });

  it("fetches metrics when initialized", () => {
    // prisonFacilityPopulation does not include TIME_PERIOD in its enabled filters,
    // so no time_period filter is included in the URL
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(`${DIMENSION_COUNT_URL}?group=facility`),
    );
  });

  it("returns the correct total count", () => {
    expect(metric.totalCount).toBe(250);
  });

  it("sets isEmpty to false", () => {
    expect(metric.isEmpty).toBeFalse();
  });

  it("sets isEmpty to true when there is no data", async () => {
    fetchMock.mockResponse(JSON.stringify({ data: [] }));

    const store = new MetricsStore({ rootStore: mockRootStore });
    store.section = PATHWAYS_SECTIONS["countByLocation"];
    const emptyMetric = store.prisonFacilityPopulation;
    emptyMetric.hydrate();
    await when(() => isHydrated(emptyMetric));

    expect(emptyMetric.isEmpty).toEqual(true);
  });

  it("calculates population proportions", () => {
    expect(metric.dataSeries).toEqual([
      {
        facility: "FACILITY_1",
        count: 150,
        populationProportion: "60",
      },
      {
        facility: "FACILITY_2",
        count: 100,
        populationProportion: "40",
      },
    ]);
  });

  it("calls the backend again when filters change", async () => {
    runInAction(() => {
      metricsStore.filters = {
        ...metricsStore.filters,
        sex: ["MALE"],
        ageGroup: ["25-29", "30-34"],
      };
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toEqual(
      encodeURI(
        `${DIMENSION_COUNT_URL}?filters[sex]=MALE&filters[age_group]=25-29&filters[age_group]=30-34&group=facility`,
      ),
    );
  });

  it("does not filter on the group by value", async () => {
    runInAction(() => {
      metricsStore.filters = {
        ...metricsStore.filters,
        sex: ["MALE"],
        facility: ["FACILITY_1", "FACILITY_2"],
      };
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toEqual(
      encodeURI(
        `${DIMENSION_COUNT_URL}?filters[sex]=MALE&group=facility`,
      ),
    );
  });

  it("aborts in-progress requests and keeps the value from the final request", async () => {
    fetchMock.resetMocks();
    fetchMock
      // Slow request
      .mockResponseOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  body: JSON.stringify({
                    data: [
                      { facility: "FACILITY_1", count: 50 },
                      { facility: "FACILITY_2", count: 100 },
                    ],
                    metadata: { lastUpdated: "2022-01-01" },
                  }),
                }),
              1000,
            ),
          ),
      )
      // Fast request
      .mockResponseOnce(
        JSON.stringify({
          data: [
            { facility: "FACILITY_1", count: 270 },
            { facility: "FACILITY_2", count: 180 },
          ],
          metadata: { lastUpdated: "2022-01-01" },
        }),
      );

    // Trigger the slow request
    runInAction(() => {
      metricsStore.filters = {
        ...metricsStore.filters,
        sex: ["MALE"],
      };
    });

    // Trigger the fast request
    runInAction(() => {
      metricsStore.filters = {
        ...metricsStore.filters,
        sex: ["FEMALE"],
      };
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(
        `${DIMENSION_COUNT_URL}?filters[sex]=MALE&group=facility`,
      ),
    );
    expect(fetchMock.mock.calls[1][0]).toEqual(
      encodeURI(
        `${DIMENSION_COUNT_URL}?filters[sex]=FEMALE&group=facility`,
      ),
    );
    expect(isAbortException(fetchMock.mock.results[0].value)).toBe(true);
    expect(metric.dataSeries).toEqual([
      {
        facility: "FACILITY_1",
        count: 270,
        populationProportion: "60",
      },
      {
        facility: "FACILITY_2",
        count: 180,
        populationProportion: "40",
      },
    ]);
  });
});
