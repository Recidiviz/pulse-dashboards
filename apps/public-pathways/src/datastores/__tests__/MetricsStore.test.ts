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

import MetricsStore from "../MetricsStore";
import type { RootStore } from "../RootStore";

const mockRootStore = {
  userStore: {
    getTokenSilently: vi.fn().mockResolvedValue("test-token"),
  },
} as unknown as RootStore;

describe("MetricsStore", () => {
  let metricsStore: MetricsStore;

  beforeEach(() => {
    fetchMock.mockResponse(JSON.stringify({ data: [], metadata: {} }));
    metricsStore = new MetricsStore({ rootStore: mockRootStore });
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

  it("has filtersStore with monthRange 60", () => {
    expect(metricsStore.filtersStore.monthRange).toBe(60);
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
    it("has 9 entries", () => {
      expect(Object.keys(metricsStore.map)).toHaveLength(9);
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
