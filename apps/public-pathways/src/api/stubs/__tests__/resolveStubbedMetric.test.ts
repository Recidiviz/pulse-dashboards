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
  dynamicFilterOptionMapToFilterType,
  DynamicFilterOptionMetadataKey,
  FilterOption,
  validateDynamicFilterOptions,
} from "~shared-pathways";

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

  describe("dynamic filter options", () => {
    // Decodes exactly the way PathwaysNewBackendMetric does: parse the
    // metadata string, map each `<dimension>_id_name_map` key to its filter
    // type, then parse that key's own JSON string.
    const decodeAsMetricDoes = () => {
      const raw = JSON.parse(
        resolveStubbedMetric(`${BASE}/AdmissionsAndReleasesOverTime`)?.metadata
          .dynamicFilterOptions ?? "{}",
      ) as Record<string, string>;

      return Object.fromEntries(
        Object.entries(raw).map(([key, encoded]) => [
          dynamicFilterOptionMapToFilterType[
            key as DynamicFilterOptionMetadataKey
          ],
          JSON.parse(encoded) as FilterOption[],
        ]),
      );
    };

    it("uses keys the metric can map back to a filter type", () => {
      const raw = JSON.parse(
        resolveStubbedMetric(`${BASE}/AdmissionsAndReleasesOverTime`)?.metadata
          .dynamicFilterOptions ?? "{}",
      ) as Record<string, string>;

      Object.keys(raw).forEach((key) => {
        expect(
          dynamicFilterOptionMapToFilterType[
            key as DynamicFilterOptionMetadataKey
          ],
        ).toBeDefined();
      });
    });

    it("nests each key's options as their own JSON string", () => {
      const raw = JSON.parse(
        resolveStubbedMetric(`${BASE}/AdmissionsAndReleasesOverTime`)?.metadata
          .dynamicFilterOptions ?? "{}",
      ) as Record<string, string>;

      Object.values(raw).forEach((encoded) => {
        expect(typeof encoded).toBe("string");
        expect(validateDynamicFilterOptions(JSON.parse(encoded))).toBe(true);
      });
    });

    it("covers every filter the dashboard enables", () => {
      expect(Object.keys(decodeAsMetricDoes()).sort()).toEqual([
        "admissionType",
        "calendarYear",
        "communitySupervision",
        "custodyStatus",
        "releaseType",
      ]);
    });

    it("offers only values the charts can actually show", () => {
      const options = decodeAsMetricDoes();

      expect(options["custodyStatus"].map((o) => o.value)).toEqual([
        "Incarcerated Individual",
        "Incarcerated Parolee",
      ]);
      expect(options["calendarYear"].map((o) => o.value)).toEqual([
        "2023",
        "2024",
        "2025",
      ]);
    });

    it("keeps a type shared by both custody statuses separately selectable", () => {
      const options = decodeAsMetricDoes()["admissionType"];
      const others = options.filter((o) => o.label === "Other");

      // Same label under each custody status, but distinct values, so one can
      // be unchecked without touching the other.
      expect(others).toHaveLength(2);
      expect(new Set(others.map((o) => o.value)).size).toBe(2);
      expect(others.map((o) => o.value)).toEqual([
        "Incarcerated Individual|Other",
        "Incarcerated Parolee|Other",
      ]);
    });

    it("names the group each type renders under", () => {
      const groups = new Set(
        decodeAsMetricDoes()["releaseType"].map((o) => o.group),
      );

      expect(groups).toEqual(
        new Set(["Incarcerated Individuals", "Incarcerated Parolees"]),
      );
    });

    it("omits its own All option, which the filters store prepends", () => {
      const values = Object.values(decodeAsMetricDoes()).flatMap((opts) =>
        opts.map((o) => o.value),
      );

      expect(values).not.toContain("ALL");
    });
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
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=custody_status`,
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
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=admission_type`,
      );

      expect(data.every((r) => r.eventType === "ADMISSIONS")).toBe(true);
      expect(new Set(data.map((r) => r.custodyStatus))).toEqual(
        new Set(["Incarcerated Individual", "Incarcerated Parolee"]),
      );
      expect(data.map((r) => r.admissionType)).toContain("Court Commitment");
    });

    it("labels community supervision rows readably, since it has no filter", () => {
      const data = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=community_supervision`,
      );

      // The chart shows these values verbatim, because this dimension has no
      // filter to map ids to labels.
      expect(data.map((r) => r.communitySupervision)).toEqual([
        "Released to Community Supervision",
        "Not Released to Community Supervision",
      ]);
    });

    it("reports release types and community supervision as releases", () => {
      const releaseTypes = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=release_type`,
      );
      const community = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=community_supervision`,
      );

      expect(releaseTypes.every((r) => r.eventType === "RELEASES")).toBe(true);
      expect(community.every((r) => r.eventType === "RELEASES")).toBe(true);
    });

    it("scales counts to the calendar year that was asked for", () => {
      const [earlier] = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=custody_status&filters[calendar_year]=2023`,
      );
      const [later] = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=custody_status&filters[calendar_year]=2025`,
      );

      expect(earlier.calendarYear).toBe(2023);
      expect(later.calendarYear).toBe(2025);
      expect(earlier.count).not.toBe(later.count);
    });

    it("falls back to the latest year when none is asked for", () => {
      const [row] = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=custody_status`,
      );

      expect(row.calendarYear).toBe(2025);
    });

    it("falls back to the latest year when the year is not covered", () => {
      const [row] = rows(
        `${BASE}/AdmissionsAndReleasesByDimensionCount?group=custody_status&filters[calendar_year]=1999`,
      );

      expect(row.calendarYear).toBe(2025);
    });
  });
});

describe("resolveStubbedMetric filtering", () => {
  const rowsFor = (query: string) =>
    (resolveStubbedMetric(
      `${BASE}/AdmissionsAndReleasesByDimensionCount?${query}`,
    )?.data ?? []) as unknown as Record<string, string | number>[];

  it("narrows to the custody status the reader picked", () => {
    const rows = rowsFor(
      "group=custody_status&filters[custody_status]=Incarcerated Parolee",
    );

    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => {
      expect(row["custodyStatus"]).toBe("Incarcerated Parolee");
    });
  });

  it("keeps every custody status when none is asked for", () => {
    const statuses = new Set(
      rowsFor("group=custody_status").map((row) => row["custodyStatus"]),
    );

    expect(statuses.size).toBe(2);
  });

  it("narrows a breakdown to the types the reader picked", () => {
    const rows = rowsFor(
      "group=release_type&filters[release_type]=Incarcerated Individual|Parole",
    );

    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => expect(row["releaseType"]).toBe("Parole"));
  });

  it("keeps one custody status's Other while dropping the other's", () => {
    const rows = rowsFor(
      "group=admission_type&filters[admission_type]=Incarcerated Parolee|Other",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]["custodyStatus"]).toBe("Incarcerated Parolee");
    expect(rows[0]["admissionType"]).toBe("Other");
  });

  it("returns no rows when the selection matches nothing", () => {
    expect(
      rowsFor("group=release_type&filters[release_type]=Nobody|Nonexistent"),
    ).toEqual([]);
  });
});

describe("resolveStubbedMetric over-time calendar year", () => {
  const years = (query = "") =>
    (
      (resolveStubbedMetric(`${BASE}/AdmissionsAndReleasesOverTime?${query}`)
        ?.data ?? []) as unknown as Record<string, number>[]
    ).map((row) => row["year"]);

  it("draws every year when none is picked", () => {
    expect(years()).toEqual([2023, 2024, 2025]);
  });

  it("draws only the year the reader picked", () => {
    expect(years("filters[calendar_year]=2023")).toEqual([2023]);
  });

  it("draws each of several picked years, oldest first", () => {
    expect(
      years("filters[calendar_year]=2025&filters[calendar_year]=2023"),
    ).toEqual([2023, 2025]);
  });

  it("falls back to the whole span when no picked year is covered", () => {
    expect(years("filters[calendar_year]=1999")).toEqual([2023, 2024, 2025]);
  });
});

describe("resolveStubbedMetric over-time custody status", () => {
  const rows = (query = "") =>
    (resolveStubbedMetric(`${BASE}/AdmissionsAndReleasesOverTime?${query}`)
      ?.data ?? []) as unknown as Record<string, number>[];

  const admissionsIn = (query = "") =>
    rows(query).map((row) => row["admissionsCount"]);

  it("counts every event when no custody status is picked", () => {
    expect(admissionsIn("filters[calendar_year]=2023")).toEqual([
      TOTALS_BY_YEAR.ADMISSIONS[2023],
    ]);
  });

  it("scales the totals down to the picked custody status", () => {
    const [scaled] = admissionsIn(
      "filters[calendar_year]=2023&filters[custody_status]=Incarcerated Parolee",
    );

    expect(scaled).toBe(Math.round(TOTALS_BY_YEAR.ADMISSIONS[2023] * 0.15));
  });

  it("scales releases by the same share as admissions", () => {
    const [row] = rows(
      "filters[calendar_year]=2024&filters[custody_status]=Incarcerated Individual",
    );

    expect(row["admissionsCount"]).toBe(
      Math.round(TOTALS_BY_YEAR.ADMISSIONS[2024] * 0.85),
    );
    expect(row["releasesCount"]).toBe(
      Math.round(TOTALS_BY_YEAR.RELEASES[2024] * 0.85),
    );
  });

  it("leaves the totals alone when the custody status is unknown", () => {
    expect(
      admissionsIn(
        "filters[calendar_year]=2023&filters[custody_status]=Nobody",
      ),
    ).toEqual([TOTALS_BY_YEAR.ADMISSIONS[2023]]);
  });
});
