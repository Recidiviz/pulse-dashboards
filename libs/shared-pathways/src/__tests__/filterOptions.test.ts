// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { FILTER_TYPES, METRIC_MODES } from "../constants";
import filterOptions, {
  convertLabelsToValues,
  defaultDistrict,
  defaultMetricMode,
  defaultMetricPeriod,
  defaultSupervisionType,
} from "../filterOptions";
import type { PopulationFilterLabels } from "../filters";

describe("Filter default values", () => {
  it("should be right", () => {
    expect(defaultDistrict).toEqual(["all"]);
    expect(defaultMetricPeriod).toBe("12");
    expect(defaultMetricMode).toBe(METRIC_MODES.COUNTS);
    expect(defaultSupervisionType).toBe("all");
  });
});

describe("convertLabelsToValues", () => {
  it("should return the filters object with values", () => {
    const filtersLabels = {
      [FILTER_TYPES.TIME_PERIOD]: "6 months",
      [FILTER_TYPES.LEGAL_STATUS]: "Parole Violator",
    } as PopulationFilterLabels;
    const expected = {
      legalStatus: ["PAROLE_BOARD_HOLD"],
      timePeriod: ["6"],
    };
    expect(convertLabelsToValues(filtersLabels, filterOptions.US_ID)).toEqual(
      expected,
    );
  });

  it("leaves out a dynamic filter whose options have not loaded yet", () => {
    // custodyStatus is useDynamicOptions on US_NY, and starts with only the
    // "All" placeholder — this is its shape at mount, before the metric that
    // supplies its real options has hydrated.
    const filtersLabels = {
      [FILTER_TYPES.CUSTODY_STATUS]: "Incarcerated Individual",
    } as PopulationFilterLabels;

    expect(convertLabelsToValues(filtersLabels, filterOptions.US_NY)).toEqual(
      {},
    );
  });

  it("resolves a dynamic filter normally once its real options are loaded", () => {
    const filtersLabels = {
      [FILTER_TYPES.CUSTODY_STATUS]: "Incarcerated Individual",
    } as PopulationFilterLabels;
    const hydratedOptions = {
      ...filterOptions.US_NY,
      [FILTER_TYPES.CUSTODY_STATUS]: {
        ...filterOptions.US_NY[FILTER_TYPES.CUSTODY_STATUS],
        options: [
          { label: "All", value: "ALL" },
          {
            label: "Incarcerated Individual",
            value: "Incarcerated Individual",
          },
          { label: "Incarcerated Parolee", value: "Incarcerated Parolee" },
        ],
      },
    };

    expect(convertLabelsToValues(filtersLabels, hydratedOptions)).toEqual({
      custodyStatus: ["Incarcerated Individual"],
    });
  });

  it("still returns an empty array for a static filter whose label matches nothing", () => {
    // Not a timing issue: sex is static, not dynamic, so a genuinely
    // unresolvable label should still surface as "matches nothing".
    const filtersLabels = {
      [FILTER_TYPES.SEX]: "Not A Real Sex Value",
    } as PopulationFilterLabels;

    expect(convertLabelsToValues(filtersLabels, filterOptions.US_ID)).toEqual({
      sex: [],
    });
  });
});
