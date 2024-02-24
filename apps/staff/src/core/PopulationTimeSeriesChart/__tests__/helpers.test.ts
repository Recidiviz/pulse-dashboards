/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */
import { ChartPoint, getChartBottom, getChartTop } from "../helpers";

describe("Tests for helpers", () => {
  const generateData = (mockData: number[]): ChartPoint[] => {
    return mockData.map((value: number, index: number) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      return {
        date,
        value,
      };
    });
  };

  const generateDataWithUncertainty = (mockData: number[][]): ChartPoint[] => {
    return mockData.map((values: number[], index: number) => {
      const [value, upperBound, lowerBound] = values;
      const date = new Date();
      date.setDate(date.getDate() + index);
      return {
        date,
        value,
        upperBound,
        lowerBound,
      };
    });
  };

  const checkExpectedBound = (
    helperFn: (data: ChartPoint[]) => number,
    mockData: number[],
    expectedBound: number
  ): void => {
    const data = generateData(mockData);
    expect(helperFn(data)).toEqual(expectedBound);
  };

  describe("Tests for getChartTop()", () => {
    it("returns a reasonable upper bound for values under 200", () => {
      checkExpectedBound(getChartTop, [70, 82, 85], 120);
    });

    it("returns a reasonable upper bound for values under 1000", () => {
      checkExpectedBound(getChartTop, [320, 280, 490], 600);
    });

    it("returns a reasonable upper bound for values under 2000", () => {
      checkExpectedBound(getChartTop, [1288, 1588, 1788], 2000);
    });

    it("returns a reasonable upper bound for values under 10000", () => {
      checkExpectedBound(getChartTop, [6800, 2800, 800], 8000);
    });

    it("returns a reasonable upper bound for large values", () => {
      checkExpectedBound(getChartTop, [21000, 18000, 12490], 24000);
    });
    it("takes into account the upper bound if it is set", () => {
      const data = generateDataWithUncertainty([
        [1000, 5000, 900],
        [2000, 7500, 1500],
      ]);
      expect(getChartTop(data)).toEqual(9000);
    });
  });

  describe("Tests for getChartBottom()", () => {
    it("returns a reasonable lower bound for values under 200", () => {
      checkExpectedBound(getChartBottom, [70, 82, 85], 40);
    });

    it("returns a reasonable lower bound for values under 1000", () => {
      checkExpectedBound(getChartBottom, [320, 280, 490], 100);
    });

    it("returns a reasonable lower bound for values under 2000", () => {
      checkExpectedBound(getChartBottom, [1288, 1588, 1788], 1000);
    });

    it("returns a reasonable lower bound for values under 10000", () => {
      checkExpectedBound(getChartBottom, [6800, 2800, 800], 700);
    });

    it("returns a reasonable lower bound for large values", () => {
      checkExpectedBound(getChartBottom, [21000, 18000, 12490], 10000);
    });
    it("returns a non-negaitive lower bound for small values", () => {
      checkExpectedBound(getChartBottom, [4, 4, 4], 0);
    });
    it("takes into account the lower bound if it is set", () => {
      const data = generateDataWithUncertainty([
        [1000, 5000, 900],
        [2000, 7500, 1500],
      ]);
      expect(getChartBottom(data)).toEqual(800);
    });
  });
});
