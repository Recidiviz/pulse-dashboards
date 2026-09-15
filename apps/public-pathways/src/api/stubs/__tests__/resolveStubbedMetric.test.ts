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

import { TOTALS_BY_YEAR } from "../admissionsAndReleasesFigures";
import { resolveStubbedMetric } from "../index";

const BASE = "public_pathways/US_NY";

/** The stub row fields these cases assert on. Each grouping sets a subset. */
type Row = {
  eventType?: string;
  calendarYear?: number;
  year?: number;
  count?: number;
  admissionsCount?: number;
  releasesCount?: number;
  custodyStatus?: string;
  admissionType?: string;
  releaseType?: string;
  communitySupervision?: string;
};

function rows(endpoint: string): Row[] {
  const result = resolveStubbedMetric(endpoint);
  if (!result) throw new Error(`Expected stub data for [${endpoint}]`);
  return result.data as unknown as Row[];
}

describe("resolveStubbedMetric", () => {
  it("leaves an endpoint the backend really serves alone", () => {
    expect(
      resolveStubbedMetric(
        `${BASE}/PrisonPopulationByDimensionCount?group=race`,
      ),
    ).toBeUndefined();
  });

  it("returns the response envelope the client expects", () => {
    const result = resolveStubbedMetric(
      `${BASE}/AdmissionsAndReleasesOverTime`,
    );

    expect(result?.metadata.lastUpdated).toBe("2026-02-01");
    // The client parses this, so it has to be a JSON string, not an object.
    expect(typeof result?.metadata.dynamicFilterOptions).toBe("string");
    expect(() =>
      JSON.parse(result?.metadata.dynamicFilterOptions ?? ""),
    ).not.toThrow();
  });

  describe("over time", () => {
    it("gives one row per year carrying both counts", () => {
      const data = rows(`${BASE}/AdmissionsAndReleasesOverTime`);

      expect(data.map((r) => r.year)).toEqual([2023, 2024, 2025]);
      expect(
        data.every(
          (r) =>
            r.admissionsCount !== undefined && r.releasesCount !== undefined,
        ),
      ).toBe(true);
    });

    it("reports the design's yearly totals", () => {
      const data = rows(`${BASE}/AdmissionsAndReleasesOverTime`);
      const row2024 = data.find((r) => r.year === 2024);

      expect(row2024?.admissionsCount).toBe(TOTALS_BY_YEAR.ADMISSIONS[2024]);
      expect(row2024?.releasesCount).toBe(TOTALS_BY_YEAR.RELEASES[2024]);
    });
  });

  describe("by dimension", () => {
    it("returns nothing for a dimension it does not cover", () => {
      expect(
        resolveStubbedMetric(
          `${BASE}/AdmissionsAndReleasesByDimensionCount?group=notADimension`,
        ),
      ).toBeUndefined();
    });

    it("splits custody status across both event types", () => {
      const data = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=custodyStatus`,
      );

      expect(new Set(data.map((r) => r.custodyStatus))).toEqual(
        new Set(["Incarcerated Individual", "Incarcerated Parolee"]),
      );
      expect(new Set(data.map((r) => r.eventType))).toEqual(
        new Set(["ADMISSIONS", "RELEASES"]),
      );
    });

    it("reports admission types as admissions, split by custody status", () => {
      const data = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=admissionType`,
      );

      expect(data.every((r) => r.eventType === "ADMISSIONS")).toBe(true);
      expect(new Set(data.map((r) => r.custodyStatus))).toEqual(
        new Set(["Incarcerated Individual", "Incarcerated Parolee"]),
      );
      expect(data.map((r) => r.admissionType)).toContain("Court Commitment");
    });

    it("reports release types and community supervision as releases", () => {
      const releaseTypes = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=releaseType`,
      );
      const community = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=communitySupervision`,
      );

      expect(releaseTypes.every((r) => r.eventType === "RELEASES")).toBe(true);
      expect(community.every((r) => r.eventType === "RELEASES")).toBe(true);
    });

    it("scales counts to the calendar year that was asked for", () => {
      const [earlier] = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=custodyStatus&filters[calendar_year]=2023`,
      );
      const [later] = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=custodyStatus&filters[calendar_year]=2025`,
      );

      expect(earlier.calendarYear).toBe(2023);
      expect(later.calendarYear).toBe(2025);
      expect(earlier.count).not.toBe(later.count);
    });

    it("falls back to the latest year when none is asked for", () => {
      const [row] = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=custodyStatus`,
      );

      expect(row.calendarYear).toBe(2025);
    });

    it("falls back to the latest year when the year is not covered", () => {
      const [row] = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=custodyStatus&filters[calendar_year]=1999`,
      );

      expect(row.calendarYear).toBe(2025);
    });
  });
});
