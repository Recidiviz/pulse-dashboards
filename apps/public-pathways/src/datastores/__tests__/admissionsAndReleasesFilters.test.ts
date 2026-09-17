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
import {
  FILTER_TYPES,
  PATHWAYS_PAGES,
  PATHWAYS_SECTIONS,
} from "~shared-pathways";

import { disabledFiltersForEventType, EVENT_TYPES } from "../eventTypes";
import FiltersStore from "../FiltersStore";
import MetricsStore from "../MetricsStore";
import type { RootStore } from "../RootStore";

const mockRootStore = {
  currentTenantId: "US_NY",
  page: PATHWAYS_PAGES.admissionsAndReleases,
  section: PATHWAYS_SECTIONS["countByCustodyStatus"],
  userStore: { getTokenSilently: vi.fn().mockResolvedValue("test-token") },
} as unknown as RootStore;
mockRootStore.filtersStore = new FiltersStore({ rootStore: mockRootStore });

/**
 * These cover the whole path from the stub's metadata to the options a reader
 * sees. The metadata is double-encoded and keyed by `<dimension>_id_name_map`,
 * and a key the metric cannot map is skipped in silence — so a stub that emits
 * the wrong shape yields an empty filter panel with no error anywhere.
 */
describe("Admissions & Releases filters", () => {
  let metricsStore: MetricsStore;

  beforeEach(() => {
    mockRootStore.filtersStore.resetFilters();
    metricsStore = new MetricsStore({ rootStore: mockRootStore });
    mockRootStore.metricsStore = metricsStore;
  });

  it("turns the stub's metadata into options keyed by filter type", async () => {
    const metric = metricsStore.current;
    metric.hydrate();
    await when(() => isHydrated(metric));

    expect(Object.keys(metric.dynamicFilterOptions).sort()).toEqual(
      [
        FILTER_TYPES.ADMISSION_TYPE,
        FILTER_TYPES.CALENDAR_YEAR,
        FILTER_TYPES.COMMUNITY_SUPERVISION,
        FILTER_TYPES.CUSTODY_STATUS,
        FILTER_TYPES.RELEASE_TYPE,
      ].sort(),
    );
  });

  it("offers the reader every custody status the charts draw, plus All", async () => {
    // filtersStore reads metricsStore.current, and each named getter mints a
    // fresh metric, so hydrate the instance the store itself exposes.
    const metric = metricsStore.current;
    metric.hydrate();
    await when(() => isHydrated(metric));

    const options =
      mockRootStore.filtersStore.filterOptions[FILTER_TYPES.CUSTODY_STATUS]
        .options;

    expect(options.map((o) => o.value)).toEqual([
      "ALL",
      "Incarcerated Individual",
      "Incarcerated Parolee",
    ]);
  });

  it("offers the same filters on every chart, as the design lays out", () => {
    Object.values(metricsStore.map).forEach((metric) => {
      expect([...metric.filters.enabledFilters].sort()).toEqual(
        [
          FILTER_TYPES.CUSTODY_STATUS,
          FILTER_TYPES.CALENDAR_YEAR,
          FILTER_TYPES.ADMISSION_TYPE,
          FILTER_TYPES.RELEASE_TYPE,
          FILTER_TYPES.COMMUNITY_SUPERVISION,
        ].sort(),
      );
    });
  });

  it("disables the breakdowns the event type leaves nothing to filter", () => {
    expect(disabledFiltersForEventType(EVENT_TYPES.ALL)).toEqual({});

    expect(disabledFiltersForEventType(EVENT_TYPES.ADMISSIONS)).toEqual({
      [FILTER_TYPES.RELEASE_TYPE]: "Releases only",
      [FILTER_TYPES.COMMUNITY_SUPERVISION]: "Releases only",
    });

    expect(disabledFiltersForEventType(EVENT_TYPES.RELEASES)).toEqual({
      [FILTER_TYPES.ADMISSION_TYPE]: "Admissions only",
    });
  });

  it("lets only the over-time chart take more than one calendar year", () => {
    const overTime = metricsStore.admissionsAndReleasesOverTime;
    const snapshot = metricsStore.admissionsAndReleasesByCustodyStatus;

    expect(overTime.multiSelectFilters).toContain(FILTER_TYPES.CALENDAR_YEAR);
    expect(snapshot.multiSelectFilters).toEqual([]);
  });

  describe("clearing every option of a filter", () => {
    it("returns no records rather than every record", async () => {
      const metric = metricsStore.current;
      metric.hydrate();
      await when(() => isHydrated(metric));
      expect(metric.records?.length).toBeGreaterThan(0);

      mockRootStore.filtersStore.setFilters({
        [FILTER_TYPES.CUSTODY_STATUS]: [],
      });
      await when(() => isHydrated(metric));

      expect(metric.records).toEqual([]);
    });

    it("does not ask the backend for data that cannot match", () => {
      const metric = metricsStore.current;

      expect(metric.hasEmptyFilterSelection).toBe(false);

      mockRootStore.filtersStore.setFilters({
        [FILTER_TYPES.CUSTODY_STATUS]: [],
      });

      expect(metric.hasEmptyFilterSelection).toBe(true);
    });
  });

  describe("zero-fill and compound filter values", () => {
    // Zero-fill matches a filter's option values against the plain value on a
    // record. A compound value names a custody status too, so it can never
    // match — the chart would fill with zeroes and render as "no data".
    it("turns zero-fill off exactly where the filter values are compound", () => {
      expect(metricsStore.admissionsByType.accessorIsNotFilterType).toBe(true);
      expect(metricsStore.releasesByType.accessorIsNotFilterType).toBe(true);
    });

    it("keeps zero-fill on where a filter's values match the records", () => {
      expect(
        metricsStore.admissionsAndReleasesByCustodyStatus
          .accessorIsNotFilterType,
      ).toBe(false);
      expect(
        metricsStore.releasesByCommunitySupervision.accessorIsNotFilterType,
      ).toBe(false);
    });
  });
});
