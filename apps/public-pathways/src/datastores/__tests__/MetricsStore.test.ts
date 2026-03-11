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

import {
  OverTimeMetric,
  PATHWAYS_SECTIONS,
  SnapshotMetric,
} from "~shared-pathways";

import FiltersStore from "../FiltersStore";
import MetricsStore from "../MetricsStore";
import type { RootStore } from "../RootStore";

const mockRootStore = {
  currentTenantId: "US_NY",
  userStore: {
    getTokenSilently: vi.fn().mockResolvedValue("test-token"),
  },
} as unknown as RootStore;
mockRootStore.filtersStore = new FiltersStore({
  rootStore: mockRootStore,
});

describe("MetricsStore", () => {
  let metricsStore: MetricsStore;

  beforeEach(() => {
    fetchMock.mockResponse(JSON.stringify({ data: [], metadata: {} }));
    metricsStore = new MetricsStore({ rootStore: mockRootStore });
    mockRootStore.metricsStore = metricsStore;
  });

  it("has page set to prison", () => {
    expect(metricsStore.page).toBe("prison");
  });

  it("has section defaulting to countOverTime", () => {
    expect(metricsStore.section).toBe(PATHWAYS_SECTIONS["countOverTime"]);
  });

  it("has currentTenantId set to US_NY", () => {
    expect(metricsStore.currentTenantId).toBe("US_NY");
  });

  it("has filtersStore with default monthRange", () => {
    expect(metricsStore.filtersStore.monthRange).toBe(6);
  });

  it("has default filter values", () => {
    expect(metricsStore.filters.timePeriod).toEqual(["6"]);
    expect(metricsStore.filters.facility).toEqual(["ALL"]);
    expect(metricsStore.filters.sex).toEqual(["ALL"]);
    expect(metricsStore.filters.race).toEqual(["ALL"]);
  });

  describe("metrics", () => {
    it("has prisonPopulationOverTime as an OverTimeMetric", () => {
      expect(metricsStore.prisonPopulationOverTime).toBeInstanceOf(
        OverTimeMetric,
      );
    });

    it.each([
      "prisonFacilityPopulation",
      "prisonPopulationByRace",
      "prisonPopulationByAgeGroup",
      "prisonPopulationByGender",
      "prisonPopulationBySex",
      "prisonPopulationByEthnicity",
      "prisonPopulationBySentenceLengthMin",
      "prisonPopulationBySentenceLengthMax",
    ] as const)("%s is a SnapshotMetric", (metricName) => {
      expect(
        metricsStore[metricName as keyof typeof metricsStore],
      ).toBeInstanceOf(SnapshotMetric);
    });
  });

  describe("map", () => {
    it("has 11 entries", () => {
      expect(Object.keys(metricsStore.map)).toHaveLength(11);
    });

    it("maps each section to a metric", () => {
      const expectedSections = [
        "countOverTime",
        "countByLocation",
        "countByRace",
        "countByAgeGroup",
        "countByGender",
        "countBySex",
        "countByEthnicity",
        "countBySentenceLengthMin",
        "countBySentenceLengthMax",
        "countByChargeCountyCode",
        "countByOffenseType",
      ];

      expectedSections.forEach((section) => {
        expect(metricsStore.map[PATHWAYS_SECTIONS[section]]).toBeDefined();
      });
    });

    it("maps countOverTime to an OverTimeMetric", () => {
      expect(
        metricsStore.map[PATHWAYS_SECTIONS["countOverTime"]],
      ).toBeInstanceOf(OverTimeMetric);
    });

    it("maps countByLocation to a SnapshotMetric", () => {
      expect(
        metricsStore.map[PATHWAYS_SECTIONS["countByLocation"]],
      ).toBeInstanceOf(SnapshotMetric);
    });
  });

  describe("current", () => {
    it("returns an OverTimeMetric by default", () => {
      expect(metricsStore.current).toBeInstanceOf(OverTimeMetric);
    });

    it("falls back to prisonPopulationOverTime for unknown sections", () => {
      metricsStore.section = "nonExistentSection";
      expect(metricsStore.current).toBeInstanceOf(OverTimeMetric);
    });
  });
});
