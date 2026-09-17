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
  COMPOUND_FILTER_VALUE_DELIMITER,
  MetricRecord,
  NewBackendRecord,
  splitCompoundFilterValue,
} from "~shared-pathways";

import {
  ADMISSION_TYPE_SHARES,
  COMMUNITY_SUPERVISION_SHARES,
  CUSTODY_STATUS_SHARES,
  RELEASE_TYPE_SHARES,
  STUB_LAST_UPDATED,
  STUB_YEARS,
  StubShare,
  StubYear,
  TOTALS_BY_YEAR,
} from "./admissionsAndReleasesFigures";

/**
 * The Admissions & Releases endpoints this stub answers. The backend does not
 * serve them yet, so in development these names resolve to the design's sample
 * figures instead of a network call. Delete an entry once its real endpoint
 * exists.
 */
export const STUBBED_ENDPOINTS = {
  overTime: "AdmissionsAndReleasesOverTime",
  byDimension: "AdmissionsAndReleasesByDimensionCount",
} as const;

const EVENT_TYPES = ["ADMISSIONS", "RELEASES"] as const;

type StubEventType = (typeof EVENT_TYPES)[number];

/** The most recent year the sample figures cover. */
const LATEST_STUB_YEAR = STUB_YEARS[STUB_YEARS.length - 1];

type StubRow = Record<string, string | number>;

function countFor(eventType: StubEventType, year: StubYear): number {
  return TOTALS_BY_YEAR[eventType][year];
}

function shareRows({
  eventType,
  year,
  dimension,
  shares,
  custodyStatus,
}: {
  eventType: StubEventType;
  year: StubYear;
  dimension: string;
  shares: StubShare[];
  custodyStatus?: string;
}): StubRow[] {
  const total = countFor(eventType, year);
  return shares.map(({ label, share }) => ({
    eventType,
    calendarYear: year,
    [dimension]: label,
    ...(custodyStatus ? { custodyStatus } : {}),
    count: Math.round(total * share),
  }));
}

/**
 * Returns the rows for one grouping, or undefined if the stub does not cover
 * that dimension. The event types a dimension applies to mirror the design:
 * admission types belong to admissions, release types and community
 * supervision to releases.
 */
function rowsForDimension(
  group: string,
  year: StubYear,
): StubRow[] | undefined {
  if (group === "custody_status") {
    return EVENT_TYPES.flatMap((eventType) =>
      shareRows({
        eventType,
        year,
        dimension: "custodyStatus",
        shares: CUSTODY_STATUS_SHARES,
      }),
    );
  }

  if (group === "admission_type") {
    return Object.entries(ADMISSION_TYPE_SHARES).flatMap(
      ([custodyStatus, shares]) =>
        shareRows({
          eventType: "ADMISSIONS",
          year,
          dimension: "admissionType",
          shares,
          custodyStatus,
        }),
    );
  }

  if (group === "release_type") {
    return Object.entries(RELEASE_TYPE_SHARES).flatMap(
      ([custodyStatus, shares]) =>
        shareRows({
          eventType: "RELEASES",
          year,
          dimension: "releaseType",
          shares,
          custodyStatus,
        }),
    );
  }

  if (group === "community_supervision") {
    return shareRows({
      eventType: "RELEASES",
      year,
      dimension: "communitySupervision",
      shares: COMMUNITY_SUPERVISION_SHARES,
    });
  }

  return undefined;
}

/**
 * The share of each year's total the chosen custody status accounts for. The
 * over-time chart counts every event rather than breaking them down, so a
 * custody status narrows it by scaling the totals rather than dropping rows.
 */
function custodyStatusShare(params: URLSearchParams): number {
  const selected = params.getAll("filters[custody_status]");
  if (selected.length === 0) return 1;

  const share = CUSTODY_STATUS_SHARES.filter(({ label }) =>
    selected.includes(label),
  ).reduce((total, { share: each }) => total + each, 0);

  return share > 0 ? share : 1;
}

function overTimeRows(years: readonly StubYear[], share: number): StubRow[] {
  return years.map((year) => ({
    year,
    // The record carries a month so it can share the date helpers with the
    // monthly charts. Annual figures sit on January of their year.
    month: 1,
    admissionsCount: Math.round(countFor("ADMISSIONS", year) * share),
    releasesCount: Math.round(countFor("RELEASES", year) * share),
  }));
}

/**
 * The years the over-time chart draws. This chart takes more than one year, so
 * it reads every value; an empty selection means the reader narrowed nothing
 * and gets the whole span.
 */
function selectedYears(params: URLSearchParams): readonly StubYear[] {
  const requested = params.getAll("filters[calendar_year]");
  if (requested.length === 0) return STUB_YEARS;

  const covered = STUB_YEARS.filter((year) => requested.includes(String(year)));
  return covered.length > 0 ? covered : STUB_YEARS;
}

function parseYear(params: URLSearchParams): StubYear {
  const requested = Number(params.get("filters[calendar_year]"));
  return STUB_YEARS.find((year) => year === requested) ?? LATEST_STUB_YEAR;
}

/**
 * Encodes options the way the backend does: each `<dimension>_id_name_map`
 * key holds its own JSON string, and the whole map is JSON-encoded again by
 * the caller. `PathwaysNewBackendMetric.parseDynamicFilterOptions` parses both
 * levels and maps the key back to a filter type.
 */
function encodeOptions(labels: string[]): string {
  return JSON.stringify(labels.map((label) => ({ label, value: label })));
}

/**
 * The filter options the real endpoints will derive from the data. The values
 * come from the same sample figures the charts draw, so a filter never offers
 * a value no chart can show.
 *
 * `FiltersStoreBase` merges these over the static definitions wherever the
 * filter sets `useDynamicOptions`, and prepends its own "All" option.
 *
 * Options for a dimension whose values only mean something alongside a custody
 * status. Each option keeps its plain label for the checkbox, carries the
 * custody status in its value, and names the group it renders under — so the
 * two "Other" types stay separately selectable.
 */
function encodeGroupedOptions(shares: Record<string, StubShare[]>): string {
  return JSON.stringify(
    Object.entries(shares).flatMap(([custodyStatus, group]) =>
      group.map(({ label }) => ({
        label,
        value: [custodyStatus, label].join(COMPOUND_FILTER_VALUE_DELIMITER),
        group: `${custodyStatus}s`,
      })),
    ),
  );
}

function dynamicFilterOptions(): Record<string, string> {
  return {
    custody_status_id_name_map: encodeOptions(
      CUSTODY_STATUS_SHARES.map(({ label }) => label),
    ),
    calendar_year_id_name_map: encodeOptions(STUB_YEARS.map(String)),
    admission_type_id_name_map: encodeGroupedOptions(ADMISSION_TYPE_SHARES),
    release_type_id_name_map: encodeGroupedOptions(RELEASE_TYPE_SHARES),
    community_supervision_id_name_map: encodeOptions(
      COMMUNITY_SUPERVISION_SHARES.map(({ label }) => label),
    ),
  };
}

/**
 * The row field each filter narrows. Calendar year is absent because it picks
 * which year to build rows from, rather than dropping rows after the fact.
 */
const FILTERED_FIELDS: Record<string, string> = {
  "filters[custody_status]": "custodyStatus",
  "filters[admission_type]": "admissionType",
  "filters[release_type]": "releaseType",
  "filters[community_supervision]": "communitySupervision",
};

/**
 * True if the row satisfies one selected value. A compound value names the
 * custody status alongside the dimension, so both parts have to match — this
 * is what keeps the two "Other" types apart.
 */
function rowMatches(row: StubRow, field: string, selected: string): boolean {
  const parts = splitCompoundFilterValue(selected);
  if (parts.length === 1) return String(row[field]) === selected;

  const [custodyStatus, value] = parts;
  return (
    String(row["custodyStatus"]) === custodyStatus &&
    String(row[field]) === value
  );
}

/**
 * Drops rows the reader filtered out. A filter left on "All" sends no value at
 * all, so an absent param narrows nothing. A row missing the field is kept,
 * because that dimension does not apply to it.
 */
function applyRowFilters(rows: StubRow[], params: URLSearchParams): StubRow[] {
  return Object.entries(FILTERED_FIELDS).reduce((kept, [param, field]) => {
    const selected = params.getAll(param);
    if (selected.length === 0) return kept;
    return kept.filter(
      (row) =>
        row[field] === undefined ||
        selected.some((value) => rowMatches(row, field, value)),
    );
  }, rows);
}

/**
 * Returns stubbed data for an Admissions & Releases endpoint, or undefined
 * when the request belongs to an endpoint the backend really serves.
 *
 * Calendar year picks which year to build from; every other filter narrows the
 * rows that year produced, so the charts move the way they will against the
 * real endpoints.
 */
export function resolveStubbedMetric<RecordFormat extends MetricRecord>(
  endpoint: string,
): NewBackendRecord<RecordFormat> | undefined {
  const [path, queryString] = endpoint.split("?");
  const metricName = path.split("/").pop();
  const params = new URLSearchParams(queryString);

  let data: StubRow[] | undefined;
  if (metricName === STUBBED_ENDPOINTS.overTime) {
    data = overTimeRows(selectedYears(params), custodyStatusShare(params));
  } else if (metricName === STUBBED_ENDPOINTS.byDimension) {
    const rows = rowsForDimension(params.get("group") ?? "", parseYear(params));
    data = rows && applyRowFilters(rows, params);
  }

  if (!data) return undefined;

  return {
    data,
    metadata: {
      lastUpdated: STUB_LAST_UPDATED,
      dynamicFilterOptions: JSON.stringify(dynamicFilterOptions()),
    },
  } as unknown as NewBackendRecord<RecordFormat>;
}
