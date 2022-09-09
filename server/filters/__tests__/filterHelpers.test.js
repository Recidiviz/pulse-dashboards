// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
const { matchesAllFilters } = require("shared-filters");

const {
  createSubsetFilters,
  getFilterFnByMetricName,
  getNewRevocationsFiltersByMetricName,
  createUserRestrictionsFilters,
} = require("../filterHelpers");

jest.mock("../../constants/subsetManifest", () => {
  return {
    getSubsetManifest: jest.fn().mockImplementation(() => {
      return [
        [
          "violation_type",
          [
            ["all", "absconsion"],
            ["felony", "law"],
          ],
        ],
        ["charge_category", [["all", "domestic_violence"], ["sex_offense"]]],
      ];
    }),
    FILES_WITH_SUBSETS: ["revocations_matrix_distribution_by_district"],
  };
});
jest.mock("shared-filters/", () => {
  return {
    matchesAllFilters: jest.fn(),
    getFilterKeys: () => {
      return { METRIC_PERIOD_MONTHS: "metric_period_months" };
    },
  };
});

describe("createSubsetFilters", () => {
  afterAll(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("Given a filters object with filter values", () => {
    const filters = {
      violation_type: "FELONY",
      charge_category: "DOMESTIC_VIOLENCE",
    };

    it("replaces the filter value with an array of values from the subset manifest", () => {
      expect(createSubsetFilters({ filters })).toEqual({
        violation_type: ["felony", "law"],
        charge_category: ["all", "domestic_violence"],
      });
    });

    it("does not include filter values that are not in the subset manifest", () => {
      filters.supervision_type = "DUAL";
      expect(createSubsetFilters({ filters })).toEqual({
        violation_type: ["felony", "law"],
        charge_category: ["all", "domestic_violence"],
      });
    });
  });

  describe("Given a filters object with index values", () => {
    const metricName = "revocations_matrix_distribution_by_risk_level";
    const filters = {
      violation_type: 0,
      charge_category: 1,
    };
    it("replaces the filter value with an array of values from the subset manifest", () => {
      expect(createSubsetFilters({ filters, metricName })).toEqual({
        violation_type: ["all", "absconsion"],
        charge_category: ["sex_offense"],
      });
    });
  });
});

describe("getFilterFnByMetricName", () => {
  afterAll(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("given metricName=revocations_matrix_by_month", () => {
    const filters = {};
    const metricName = "revocations_matrix_by_month";

    it("matchesAllFilters is called with correct skippedFilters param", () => {
      getFilterFnByMetricName(metricName, filters);
      expect(matchesAllFilters).toHaveBeenCalledWith({
        filters,
        skippedFilters: ["metric_period_months"],
      });
    });
  });
});

describe("getNewRevocationsFiltersByMetricName", () => {
  const userRestrictionsFilters = { level_1_supervision_location: ["03"] };
  const subsetFilters = { violation_type: "all" };
  afterAll(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("given files with subsets", () => {
    [
      "revocations_matrix_distribution_by_risk_level",
      "revocations_matrix_distribution_by_gender",
      "revocations_matrix_distribution_by_officer",
      "revocations_matrix_distribution_by_race",
      "revocations_matrix_distribution_by_violation",
      "revocations_matrix_by_month",
    ].forEach((metricName) => {
      it(`given ${metricName} it returns the filters object`, () => {
        expect(
          getNewRevocationsFiltersByMetricName({
            metricName,
            subsetFilters,
            userRestrictionsFilters,
          })
        ).toEqual({ ...subsetFilters, ...userRestrictionsFilters });
      });
    });
  });

  describe("given files without subsets that filter user restrictions", () => {
    [
      "revocations_matrix_cells",
      "revocations_matrix_filtered_caseload",
    ].forEach((metricName) => {
      it(`given ${metricName} it returns a filters object with only the user restrictions`, () => {
        expect(
          getNewRevocationsFiltersByMetricName({
            metricName,
            subsetFilters,
            userRestrictionsFilters,
          })
        ).toEqual({
          level_1_supervision_location: ["03"],
        });
      });
    });
  });

  describe("given files with subsets that do not filter user restrictions", () => {
    it("given revocations_matrix_distribution_by_district it returns a filters object with only subset filters", () => {
      expect(
        getNewRevocationsFiltersByMetricName({
          metricName: "revocations_matrix_distribution_by_district",
          subsetFilters,
          userRestrictionsFilters,
        })
      ).toEqual({
        violation_type: "all",
      });
    });
  });

  describe("given a file that should not be filtered", () => {
    it("returns an empty object", () => {
      expect(
        getNewRevocationsFiltersByMetricName({
          metricName: "revocations_matrix_supervision_location_ids_to_names",
          subsetFilters,
          userRestrictionsFilters,
        })
      ).toEqual({});
    });
  });
});

describe("createUserRestrictionsFilters", () => {
  const appMetadata = {
    allowed_supervision_location_ids: ["25", "08N"],
    allowed_supervision_location_level: "level_1_supervision_level",
  };

  it("returns the filters when given ids and level", () => {
    expect(createUserRestrictionsFilters(appMetadata)).toEqual({
      level_1_supervision_level: ["25", "08n"],
    });
  });

  it("returns an empty object when missing ids", () => {
    const missingIds = {
      ...appMetadata,
      allowed_supervision_location_ids: undefined,
    };
    expect(createUserRestrictionsFilters(missingIds)).toEqual({});
  });

  it("returns an empty object when missing level", () => {
    const missingLevel = {
      ...appMetadata,
      allowed_supervision_location_level: undefined,
    };
    expect(createUserRestrictionsFilters(missingLevel)).toEqual({});
  });

  it("returns an empty object when missing both values", () => {
    expect(createUserRestrictionsFilters({})).toEqual({});
  });
});
