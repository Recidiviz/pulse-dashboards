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

import pattern from "patternomaly";

import {
  applyStatisticallySignificantShading,
  applyStatisticallySignificantShadingToDataset,
  isDenominatorsMatrixStatisticallySignificant,
  isDenominatorStatisticallySignificant,
  tooltipForFooterWithCounts,
} from "../significantStatistics";

vi.mock("patternomaly");

const statisticallySignificantDenominators = [0, 100, 1019];
const statisticallyNotSignificantDenominators = [1, 10, 99];

const statisticallySignificantDenominatorMatrix = [
  [100, 234, 235, 123],
  [930, 823, 348, 729],
  [0, 829, 520, 327],
  [981, 0, 124, 987],
];

const statisticallyNotSignificantDenominatorMatrix = [
  [100, 234, 235, 123],
  [930, 823, 348, 729],
  [0, 829, 20, 327],
  [981, 0, 124, 987],
];

describe("isDenominatorStatisticallySignificant function", () => {
  it("should not be statistically significant", () => {
    const given = statisticallyNotSignificantDenominators;

    given.forEach((denominator) => {
      expect(isDenominatorStatisticallySignificant(denominator)).toBe(false);
    });
  });

  it("should be statistically significant", () => {
    const given = statisticallySignificantDenominators;

    given.forEach((denominator) => {
      expect(isDenominatorStatisticallySignificant(denominator)).toBe(true);
    });
  });
});

describe("isDenominatorsMatrixStatisticallySignificant function", () => {
  it("should not be statistically significant", () => {
    const given = statisticallyNotSignificantDenominatorMatrix;

    expect(isDenominatorsMatrixStatisticallySignificant(given)).toBe(false);
  });

  it("should be statistically significant", () => {
    const given = statisticallySignificantDenominatorMatrix;

    expect(isDenominatorsMatrixStatisticallySignificant(given)).toBeTrue();
  });
});

describe("applyStatisticallySignificantShading function", () => {
  it("should not apply shading when statistically significant", () => {
    const given = statisticallySignificantDenominators;
    const color = "anyColor";

    given.forEach((denominator) => {
      expect(applyStatisticallySignificantShading(color, denominator)).toBe(
        color,
      );
    });
    expect(pattern.draw).not.toHaveBeenCalled();
  });

  it("should apply shading when not statistically significant", async () => {
    const given = statisticallyNotSignificantDenominators;
    const color = "anyColor";

    given.forEach((denominator) => {
      applyStatisticallySignificantShading(color, denominator);
    });

    expect(pattern.draw).toHaveBeenCalledTimes(
      statisticallyNotSignificantDenominators.length,
    );
  });
});

describe("applyStatisticallySignificantShadingToDataset function", () => {
  const color = "anyColor";

  it("should not apply shading when statistically significant", () => {
    const dataset = statisticallySignificantDenominators;

    const backgroundColorFn = applyStatisticallySignificantShadingToDataset(
      color,
      dataset,
    );
    dataset.forEach((_denominator, idx) => {
      expect(backgroundColorFn({ dataIndex: idx })).toBe(color);
    });
    expect(pattern.draw).not.toHaveBeenCalled();
  });

  it("should apply shading when not statistically significant", () => {
    const dataset = statisticallyNotSignificantDenominators;

    const backgroundColorFn = applyStatisticallySignificantShadingToDataset(
      color,
      dataset,
    );

    dataset.forEach((_denominator, idx) => {
      backgroundColorFn({ dataIndex: idx });
    });
    expect(pattern.draw).toHaveBeenCalledTimes(dataset.length);
  });

  describe("when the dataset is a matrix with an insignificant datapoint", () => {
    let backgroundColorFn;
    const dataset = statisticallyNotSignificantDenominatorMatrix;

    beforeEach(() => {
      backgroundColorFn = applyStatisticallySignificantShadingToDataset(
        color,
        dataset,
      );
    });

    it("should not apply the shading to a statistically significant datapoint", () => {
      expect(backgroundColorFn({ datasetIndex: 2, dataIndex: 1 })).toBe(color);
      expect(pattern.draw).not.toHaveBeenCalled();
    });

    it("should not apply the shading to the statistically insignificant datapoint", () => {
      backgroundColorFn({ datasetIndex: 2, dataIndex: 2 });
      expect(pattern.draw).toHaveBeenCalled();
    });
  });
});

describe("tooltipForFooterWithCounts function", () => {
  describe("when the denominators are not significantly significant", () => {
    it("returns warning footnote", () => {
      const given = statisticallyNotSignificantDenominators;
      const index = 2;

      expect(tooltipForFooterWithCounts([{ index }], given)).toBe(
        "* indicates the group is too small to make generalizations",
      );
    });

    it("returns empty footnote", () => {
      const given = statisticallySignificantDenominators;
      const index = 1;

      expect(tooltipForFooterWithCounts([{ index }], given)).toBe("");
    });
  });

  describe("when the denominators are significantly significant", () => {
    it("returns warning footnote for matrix", () => {
      const given = statisticallyNotSignificantDenominatorMatrix;
      const index = 2;

      expect(tooltipForFooterWithCounts([{ index }], given)).toBe(
        "* indicates the group is too small to make generalizations",
      );
    });

    it("returns empty footnote for matrix", () => {
      const given = statisticallyNotSignificantDenominatorMatrix;
      const index = 3;

      expect(tooltipForFooterWithCounts([{ index }], given)).toBe("");
    });
  });
});
