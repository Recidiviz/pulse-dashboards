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

import { getSubsetManifest } from "../../constants/subsetManifest";
import { createSubset } from "../createSubset";

const violationTypeFilters = ["felony", "law", "misdemeanor"];
const chargeCategoryFilters = ["sex_offense"];

vi.mock("../../constants/subsetManifest", () => {
  return {
    getSubsetManifest: vi.fn(),
    FILES_WITH_SUBSETS: [
      "revocations_matrix_distribution_by_district",
      "revocations_matrix_distribution_by_gender",
    ],
  };
});

beforeEach(() => {
  vi.mocked(getSubsetManifest).mockImplementation(() => {
    return [
      [
        "violation_type",
        [
          ["all", "absconded"],
          ["felony", "law"],
        ],
      ],
      ["charge_category", [["all", "general"], ["sex_offense"]]],
    ];
  });
});

describe("createSubset", () => {
  let fileKey;
  let metricFile;
  let output;
  let expectedFilteredValues;
  let expectedMetadata;

  describe("Given a file without subsets and without a user restrictions", () => {
    it("does not filter the metric file", () => {
      fileKey = "not_in_the_subset_manifest";
      metricFile = { [fileKey]: "lots of great data" };
      expect(createSubset(fileKey, {}, metricFile)).toEqual(metricFile);
    });
  });

  describe("Filtering a file in the optimized format", () => {
    const chargeCategoryValues = "2,2,2,2,2";
    const violationTypeValues = "0,1,2,2,2";
    const supervisionTypeValues = "0,0,1,1,0";
    const levelOneSupervisionLocationValues = "0,0,1,1,1";
    const valueValues = "10,10,10,10,10";
    const metricContents = {
      flattenedValueMatrix: [
        chargeCategoryValues,
        violationTypeValues,
        supervisionTypeValues,
        levelOneSupervisionLocationValues,
        valueValues,
      ].join(","),
      metadata: {
        total_data_points: "5",
        dimension_manifest: [
          ["charge_category", ["all", "general", "sex_offense"]],
          [
            "violation_type",
            ["all", "absconded", "felony", "law", "misdemeanor"],
          ],
          ["supervision_type", ["all", "dual", "parole", "probation"]],
          ["level_1_supervision_location", ["01", "03n"]],
        ],
        value_keys: ["total_revocations"],
      },
    };

    describe("with subset filters", () => {
      beforeEach(() => {
        fileKey = "revocations_matrix_distribution_by_district";
        metricFile = { [fileKey]: metricContents };
        const subsetFilters = {
          violation_type: violationTypeFilters,
          charge_category: chargeCategoryFilters,
        };
        expectedMetadata = {
          total_data_points: 3,
          dimension_manifest: [
            ["charge_category", ["sex_offense"]],
            ["violation_type", ["felony", "law", "misdemeanor"]],
            ["supervision_type", ["all", "dual", "parole", "probation"]],
            ["level_1_supervision_location", ["01", "03n"]],
          ],
          value_keys: ["total_revocations"],
        };
        expectedFilteredValues = [
          "0,0,0,", // charge_category sex_offense
          "0,0,0,", // violation_type felony
          "1,1,0,", // supervision_type dual, dual, all
          "1,1,1,", // level_1_supervision_location 03n
          "10,10,10", // total_revocations
        ].join("");
        output = createSubset(fileKey, subsetFilters, metricFile);
      });

      it("returns a metric file in the expected format", () => {
        expect(output).toHaveProperty(fileKey);
        expect(output[fileKey]).toHaveProperty("flattenedValueMatrix");
        expect(output[fileKey]).toHaveProperty("metadata");
        expect(output[fileKey]).toHaveProperty("metadata.total_data_points");
        expect(output[fileKey]).toHaveProperty("metadata.dimension_manifest");
        expect(output[fileKey]).toHaveProperty("metadata.value_keys");
      });

      it("returns a transformed metadata to reflect the subsets", () => {
        expect(output[fileKey].metadata).toEqual(expectedMetadata);
      });

      it("returns a filtered dataset as a flattenedValueMatrix", () => {
        expect(output[fileKey].flattenedValueMatrix).toEqual(
          expectedFilteredValues,
        );
      });
    });

    describe("with subset filters and user restrictions", () => {
      beforeEach(() => {
        fileKey = "revocations_matrix_distribution_by_gender";
        metricFile = { [fileKey]: metricContents };
        const filters = {
          violation_type: violationTypeFilters,
          charge_category: chargeCategoryFilters,
          level_1_supervision_location: ["03n"],
        };

        expectedMetadata = {
          total_data_points: 3,
          dimension_manifest: [
            ["charge_category", ["sex_offense"]],
            ["violation_type", ["felony", "law", "misdemeanor"]],
            ["supervision_type", ["all", "dual", "parole", "probation"]],
            ["level_1_supervision_location", ["03n"]],
          ],
          value_keys: ["total_revocations"],
        };
        expectedFilteredValues = [
          "0,0,0,", // charge_category sex_offense
          "0,0,0,", // violation_type felony
          "1,1,0,", // supervision_type dual, dual, all
          "0,0,0,", // level_1_supervision_location 03n
          "10,10,10", // total_revocations
        ].join("");
        output = createSubset(fileKey, filters, metricFile);
      });

      it("returns the data with the user restrictions applied", () => {
        expect(output[fileKey].flattenedValueMatrix).toEqual(
          expectedFilteredValues,
        );
        expect(output[fileKey].metadata).toEqual(expectedMetadata);
      });
    });
  });

  describe("Given a metric file with JSON data points", () => {
    beforeEach(() => {
      fileKey = "revocations_matrix_distribution_by_district";
      const subsetFilters = {
        violation_type: violationTypeFilters,
        charge_category: chargeCategoryFilters,
      };
      metricFile = {
        [fileKey]: [
          {
            charge_category: "sex_offense",
            violation_type: "felony",
            supervision_type: "dual",
          },
          {
            charge_category: "sex_offense",
            violation_type: "felony",
            supervision_type: "probation",
          },
          {
            charge_category: "general",
            violation_type: "law",
            supervision_type: "parole",
          },
          {
            charge_category: "all",
            violation_type: "absconded",
            supervision_type: "all",
          },
        ],
      };
      expectedMetadata = {
        total_data_points: 2,
        dimension_manifest: [
          ["violation_type", ["felony", "law", "misdemeanor"]],
          ["charge_category", ["sex_offense"]],
        ],
      };
      expectedFilteredValues = [metricFile[fileKey][0], metricFile[fileKey][1]];
      output = createSubset(fileKey, subsetFilters, metricFile);
    });

    it("returns a metric file in the expected format", () => {
      expect(output).toHaveProperty(fileKey);
      expect(output[fileKey]).toHaveProperty("data");
      expect(output[fileKey]).toHaveProperty("metadata");
      expect(output[fileKey]).toHaveProperty("metadata.total_data_points");
      expect(output[fileKey]).toHaveProperty("metadata.dimension_manifest");
    });

    it("returns a transformed metadata to reflect the subsets", () => {
      expect(output[fileKey].metadata).toEqual(expectedMetadata);
    });

    it("returns a filtered dataset in the expanded format", () => {
      expect(output[fileKey].data).toEqual(expectedFilteredValues);
    });

    describe("Given user restrictions for a file without subsets", () => {
      it("filters by user restrictions and returns an empty dimension_manifest", () => {
        fileKey = "not_in_the_subset_manifest";
        metricFile = {
          [fileKey]: [
            { level_1_supervision_location: "01" },
            { level_1_supervision_location: "02" },
          ],
        };
        const expected = {
          [fileKey]: {
            data: [{ level_1_supervision_location: "01" }],
            metadata: {
              dimension_manifest: [],
              total_data_points: 1,
            },
          },
        };
        const filters = { level_1_supervision_location: ["01"] };

        expect(createSubset(fileKey, filters, metricFile)).toEqual(expected);
      });
    });

    describe("Given a file with subsets and user restrictions", () => {
      it("filters by user restrictions and returns a subset manifest", () => {
        fileKey = "revocations_matrix_distribution_by_gender";
        metricFile = {
          [fileKey]: [
            {
              level_1_supervision_location: "01",
              violation_type: "all",
              charge_category: "all",
            },
            {
              level_1_supervision_location: "02",
              violation_type: "felony",
              charge_category: "all",
            },
            {
              level_1_supervision_location: "01",
              violation_type: "felony",
              charge_category: "sex_offense",
            },
          ],
        };

        const expected = {
          [fileKey]: {
            data: [
              {
                level_1_supervision_location: "01",
                violation_type: "felony",
                charge_category: "sex_offense",
              },
            ],
            metadata: {
              dimension_manifest: [
                ["violation_type", ["felony", "law", "misdemeanor"]],
                ["charge_category", ["sex_offense"]],
              ],
              total_data_points: 1,
            },
          },
        };
        const filters = {
          level_1_supervision_location: ["01"],
          violation_type: violationTypeFilters,
          charge_category: chargeCategoryFilters,
        };

        expect(createSubset(fileKey, filters, metricFile)).toEqual(expected);
      });
    });
  });
});
