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

import { MetricRecord, NewBackendRecord } from "~shared-pathways";

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
  if (group === "custodyStatus") {
    return EVENT_TYPES.flatMap((eventType) =>
      shareRows({
        eventType,
        year,
        dimension: "custodyStatus",
        shares: CUSTODY_STATUS_SHARES,
      }),
    );
  }

  if (group === "admissionType") {
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

  if (group === "releaseType") {
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

  if (group === "communitySupervision") {
    return shareRows({
      eventType: "RELEASES",
      year,
      dimension: "communitySupervision",
      shares: COMMUNITY_SUPERVISION_SHARES,
    });
  }

  return undefined;
}

function overTimeRows(): StubRow[] {
  return STUB_YEARS.map((year) => ({
    year,
    // The record carries a month so it can share the date helpers with the
    // monthly charts. Annual figures sit on January of their year.
    month: 1,
    admissionsCount: countFor("ADMISSIONS", year),
    releasesCount: countFor("RELEASES", year),
  }));
}

function parseYear(params: URLSearchParams): StubYear {
  const requested = Number(params.get("filters[calendar_year]"));
  return STUB_YEARS.find((year) => year === requested) ?? LATEST_STUB_YEAR;
}

/**
 * Returns stubbed data for an Admissions & Releases endpoint, or undefined
 * when the request belongs to an endpoint the backend really serves.
 *
 * Filters other than `filters[calendarYear]` are ignored: the sample figures
 * are fixed shares, so there is nothing further to narrow.
 */
export function resolveStubbedMetric<RecordFormat extends MetricRecord>(
  endpoint: string,
): NewBackendRecord<RecordFormat> | undefined {
  const [path, queryString] = endpoint.split("?");
  const metricName = path.split("/").pop();
  const params = new URLSearchParams(queryString);

  let data: StubRow[] | undefined;
  if (metricName === STUBBED_ENDPOINTS.overTime) {
    data = overTimeRows();
  } else if (metricName === STUBBED_ENDPOINTS.byDimension) {
    data = rowsForDimension(params.get("group") ?? "", parseYear(params));
  }

  if (!data) return undefined;

  return {
    data,
    metadata: {
      lastUpdated: STUB_LAST_UPDATED,
      // Each filter gains its options as its own PR wires that dimension up.
      dynamicFilterOptions: "{}",
    },
  } as unknown as NewBackendRecord<RecordFormat>;
}
