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

import { callPublicPathwaysApi } from "../../api/metricsClient";
import { disabledFiltersForEventType, EVENT_TYPES } from "../eventTypes";
import FiltersStore from "../FiltersStore";
import MetricsStore from "../MetricsStore";
import type { RootStore } from "../RootStore";

vi.mock("../../api/metricsClient", () => ({
  callPublicPathwaysApi: vi.fn(),
  fetchPublicPathwaysFile: vi.fn(),
}));

/**
 * The metadata as the export writes it: keyed by the export's own column
 * names, with each value a JSON string inside a JSON string.
 */
const API_METADATA = {
  lastUpdated: "2026-09-30",
  dynamicFilterOptions: JSON.stringify({
    custody_type_id_name_map: JSON.stringify([
      { value: "incarcerated_individual", label: "Incarcerated Individual" },
      { value: "incarcerated_parolee", label: "Incarcerated Parolee" },
    ]),
    release_to_community_supervision_indicator_id_name_map: JSON.stringify([
      {
        value: "released_to_community_supervision",
        label: "Released to Community Supervision",
      },
    ]),
    movement_type_id_name_map: JSON.stringify([
      { value: "court_commitment", label: "Court Commitment" },
      { value: "conditional_release", label: "Conditional Release" },
    ]),
  }),
};

const BY_DIMENSION_ROWS = [
  {
    eventType: "admission",
    custodyStatus: "incarcerated_individual",
    count: 3,
  },
  { eventType: "release", custodyStatus: "incarcerated_parolee", count: 1 },
];

const MONTHLY_ROWS = [
  { movementDate: "2024-01-01", eventType: "admission", count: 5 },
  { movementDate: "2024-01-01", eventType: "release", count: 7 },
  { movementDate: "2024-03-01", eventType: "release", count: 2 },
];

const requestedParams = () =>
  vi
    .mocked(callPublicPathwaysApi)
    .mock.calls.map(
      ([endpoint]) => new URLSearchParams(endpoint.split("?")[1]),
    );

const mockRootStore = {
  currentTenantId: "US_NY",
  page: PATHWAYS_PAGES.admissionsAndReleases,
  section: PATHWAYS_SECTIONS["countByCustodyStatus"],
  userStore: { getTokenSilently: vi.fn().mockResolvedValue("test-token") },
} as unknown as RootStore;
mockRootStore.filtersStore = new FiltersStore({ rootStore: mockRootStore });

/**
 * These cover the whole path from the API's metadata to the options a reader
 * sees. A metadata key the metric cannot map is skipped in silence, so a key
 * name that drifts yields an empty filter panel with no error anywhere.
 */
describe("Admissions & Releases filters", () => {
  let metricsStore: MetricsStore;

  beforeEach(() => {
    // restoreMocks wipes the implementation before every test, so set it here.
    vi.mocked(callPublicPathwaysApi).mockImplementation(async (endpoint) => ({
      data: endpoint.includes("/AdmissionsAndReleasesOverTime?")
        ? MONTHLY_ROWS
        : BY_DIMENSION_ROWS,
      metadata: API_METADATA,
    }));
    mockRootStore.filtersStore.resetFilters();
    metricsStore = new MetricsStore({ rootStore: mockRootStore });
    mockRootStore.metricsStore = metricsStore;
  });

  it("turns the export's metadata keys into options keyed by filter type", async () => {
    const metric = metricsStore.current;
    metric.hydrate();
    await when(() => isHydrated(metric));

    expect(Object.keys(metric.dynamicFilterOptions).sort()).toEqual(
      [FILTER_TYPES.COMMUNITY_SUPERVISION, FILTER_TYPES.CUSTODY_STATUS].sort(),
    );
  });

  it("labels admission and release types from the export's movement type map", async () => {
    const metric = metricsStore.admissionsByType;
    metric.hydrate();
    await when(() => isHydrated(metric));

    const labels = {
      court_commitment: "Court Commitment",
      conditional_release: "Conditional Release",
    };
    expect(metric.dimensionValueLabels).toEqual({
      admissionType: labels,
      releaseType: labels,
    });
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
      "incarcerated_individual",
      "incarcerated_parolee",
    ]);
    expect(options.map((o) => o.label)).toEqual([
      "All",
      "Incarcerated Individual",
      "Incarcerated Parolee",
    ]);
  });

  it("offers the same filters on every chart, as the design lays out", () => {
    Object.values(metricsStore.map).forEach((metric) => {
      expect([...metric.filters.enabledFilters].sort()).toEqual(
        [
          FILTER_TYPES.CUSTODY_STATUS,
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

  it("asks for monthly rows and draws both event counts on each month", async () => {
    const metric = metricsStore.admissionsAndReleasesOverTime;
    metric.hydrate();
    await when(() => isHydrated(metric));

    expect(requestedParams()[0].get("group")).toBe("movement_date_event_type");
    expect(metric.dataSeries).toEqual([
      { year: 2024, month: 1, admissionsCount: 5, releasesCount: 7 },
      { year: 2024, month: 2, admissionsCount: 0, releasesCount: 0 },
      { year: 2024, month: 3, admissionsCount: 0, releasesCount: 2 },
    ]);
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
