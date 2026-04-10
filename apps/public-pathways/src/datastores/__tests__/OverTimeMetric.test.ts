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

import { when } from "mobx";

import { isHydrated } from "~hydration-utils";
import { OverTimeMetric, PATHWAYS_SECTIONS } from "~shared-pathways";

import FiltersStore from "../FiltersStore";
import MetricsStore from "../MetricsStore";
import type { RootStore } from "../RootStore";

const BASE_URL = "http://localhost:5000";

const mockRootStore = {
  currentTenantId: "US_NY",
  section: PATHWAYS_SECTIONS["countOverTime"],
  userStore: {
    getTokenSilently: vi.fn().mockResolvedValue("test-token"),
  },
} as unknown as RootStore;
mockRootStore.filtersStore = new FiltersStore({
  rootStore: mockRootStore,
});

describe("OverTimeMetric", () => {
  let metric: OverTimeMetric;
  let metricsStore: MetricsStore;

  const facilityOptions = JSON.stringify([
    { label: "Option 1", value: "OPTION_1" },
    { label: "Option 2", value: "OPTION_2" },
  ]);
  const genderOptions = JSON.stringify([
    { label: "Male", value: "MALE" },
    { label: "Non-binary", value: "NON_BINARY" },
  ]);

  beforeEach(async () => {
    vi.stubEnv("VITE_PUBLIC_PATHWAYS_API_URL_BASE", BASE_URL);

    fetchMock.mockResponse(
      JSON.stringify({
        data: [
          { year: 2022, month: 1, count: 1000, avg90day: 1000 },
          { year: 2022, month: 2, count: 0, avg90day: 1000 },
          { year: 2022, month: 3, count: 3000, avg90day: 1500 },
          { year: 2022, month: 4, count: 4000, avg90day: 2500 },
        ],
        metadata: {
          lastUpdated: "2022-05-01",
          dynamicFilterOptions: JSON.stringify({
            facility_id_name_map: facilityOptions,
            gender_id_name_map: genderOptions,
          }),
        },
      }),
    );

    metricsStore = new MetricsStore({ rootStore: mockRootStore });
    mockRootStore.metricsStore = metricsStore;
    metric = metricsStore.prisonPopulationOverTime;
    metric.hydrate();
    await when(() => isHydrated(metric));
  });

  it("fetches metrics when initialized", () => {
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(
        `${BASE_URL}/public_pathways/US_NY/PrisonPopulationOverTime?filters[time_period]=months_0_6`,
      ),
    );
  });

  it("sets hydration state", () => {
    expect(metric.hydrationState.status).toBe("hydrated");
  });

  it("finds most recent month", () => {
    expect(OverTimeMetric.mostRecentDate(metric.dataSeries)).toEqual(
      new Date(2022, 3),
    );
  });

  it("sets isEmpty to false", () => {
    expect(metric.isEmpty).toEqual(false);
  });

  it("sets isEmpty to true before hydration", () => {
    const store = new MetricsStore({ rootStore: mockRootStore });
    const unhyrdatedMetric = store.prisonPopulationOverTime;
    expect(unhyrdatedMetric.isEmpty).toEqual(true);
  });

  it("does not throw when accessing the most recent date without loaded data", () => {
    const store = new MetricsStore({ rootStore: mockRootStore });
    const unhydratedMetric = store.prisonPopulationOverTime;
    expect(OverTimeMetric.mostRecentDate(unhydratedMetric.dataSeries)).toEqual(
      new Date(9999, 11, 31),
    );
  });

  it("fills in missing months with default monthRange", () => {
    // Backend returns Jan-Apr 2022 (4 months). Frontend no longer pads
    // leading months before the first record, so the series is just the
    // 4 records the backend sent.
    expect(metric.dataSeries).toHaveLength(4);

    // first entry is January 2022
    expect(metric.dataSeries[0]).toEqual({
      year: 2022,
      month: 1,
      count: 1000,
      avg90day: 1000,
    });

    // last entry is April 2022
    expect(metric.dataSeries[3]).toEqual({
      year: 2022,
      month: 4,
      count: 4000,
      avg90day: 2500,
    });
  });

  it("parses facility_id_name_map from metadata", () => {
    expect(metric.dynamicFilterOptions.facility).toEqual(
      JSON.parse(facilityOptions),
    );
  });

  it("parses gender_id_name_map from metadata", () => {
    expect(metric.dynamicFilterOptions.gender).toEqual(
      JSON.parse(genderOptions),
    );
  });

  it("does not set dynamic filter option if invalid", async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        data: [],
        metadata: {
          lastUpdated: "2022-05-01",
          dynamicFilterOptions: JSON.stringify({
            facility_id_name_map: [{ label: "Option 1" }, { anything_else: 1 }],
          }),
        },
      }),
    );

    const store = new MetricsStore({ rootStore: mockRootStore });
    const m = store.prisonPopulationOverTime;
    await m.hydrate();
    expect(m.dynamicFilterOptions).toEqual({});
  });

  it("does not set dynamic filter option if empty", async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        data: [],
        metadata: {
          lastUpdated: "2022-05-01",
          dynamicFilterOptions: JSON.stringify({
            facility_id_name_map: [],
            gender_id_name_map: [],
          }),
        },
      }),
    );

    const store = new MetricsStore({ rootStore: mockRootStore });
    const m = store.prisonPopulationOverTime;
    await m.hydrate();
    expect(m.dynamicFilterOptions).toEqual({});
  });
});
