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
  ChartPoint,
  HISTORICAL_LINE_CLASS,
  PROJECTED_LINE_CLASS,
  resolveTimeSeriesLines,
} from "../helpers";

const point = (year: number, value: number): ChartPoint => ({
  date: new Date(year, 0, 1),
  value,
});

const historicalPopulation = [point(2023, 10), point(2024, 20)];

describe("resolveTimeSeriesLines", () => {
  describe("without named series", () => {
    it("draws the historical population as the only line", () => {
      const { lines, allPoints } = resolveTimeSeriesLines({
        historicalPopulation,
      });

      expect(lines).toEqual([
        { class: HISTORICAL_LINE_CLASS, data: historicalPopulation },
      ]);
      expect(allPoints).toEqual(historicalPopulation);
    });

    it("adds the projection as a second line", () => {
      const projectedPopulation = [point(2024, 20), point(2025, 30)];

      const { lines } = resolveTimeSeriesLines({
        historicalPopulation,
        projectedPopulation,
      });

      expect(lines.map((line) => line.class)).toEqual([
        HISTORICAL_LINE_CLASS,
        PROJECTED_LINE_CLASS,
      ]);
    });

    it("counts the point the two lines share only once", () => {
      const projectedPopulation = [point(2024, 20), point(2025, 30)];

      const { allPoints } = resolveTimeSeriesLines({
        historicalPopulation,
        projectedPopulation,
      });

      expect(allPoints).toEqual([
        point(2023, 10),
        point(2024, 20),
        point(2025, 30),
      ]);
    });

    it("leaves both lines unnamed and uncolored, so no legend is built", () => {
      const { lines } = resolveTimeSeriesLines({
        historicalPopulation,
        projectedPopulation: [point(2024, 20)],
      });

      expect(lines.every((line) => !line.name && !line.color)).toBe(true);
    });
  });

  describe("with named series", () => {
    const admissions = [point(2023, 10), point(2024, 12)];
    const releases = [point(2023, 20), point(2024, 22)];

    it("draws one line per series, carrying its name and color", () => {
      const { lines } = resolveTimeSeriesLines({
        series: [
          { name: "Admissions", data: admissions, color: "#1F4E6D" },
          { name: "Releases", data: releases, color: "#D4A017" },
        ],
        historicalPopulation,
      });

      expect(
        lines.map(({ class: lineClass, name, color }) => ({
          class: lineClass,
          name,
          color,
        })),
      ).toEqual([
        {
          class: HISTORICAL_LINE_CLASS,
          name: "Admissions",
          color: "#1F4E6D",
        },
        {
          class: HISTORICAL_LINE_CLASS,
          name: "Releases",
          color: "#D4A017",
        },
      ]);
      expect(lines[0].data.map(({ value }) => value)).toEqual([10, 12]);
      expect(lines[1].data.map(({ value }) => value)).toEqual([20, 22]);
    });

    it("stamps each point with its line's color, so the dots match", () => {
      const { lines } = resolveTimeSeriesLines({
        series: [
          { name: "Admissions", data: admissions, color: "#1F4E6D" },
          { name: "Releases", data: releases, color: "#D4A017" },
        ],
        historicalPopulation,
      });

      expect(lines[0].data.map((point) => point.color)).toEqual([
        "#1F4E6D",
        "#1F4E6D",
      ]);
      expect(lines[1].data.map((point) => point.color)).toEqual([
        "#D4A017",
        "#D4A017",
      ]);
    });

    it("leaves points alone when a series has no color", () => {
      const { lines } = resolveTimeSeriesLines({
        series: [{ name: "Admissions", data: admissions }],
        historicalPopulation,
      });

      expect(lines[0].data).toBe(admissions);
    });

    it("gathers the points from every series for the axes", () => {
      const { allPoints } = resolveTimeSeriesLines({
        series: [
          { name: "Admissions", data: admissions },
          { name: "Releases", data: releases },
        ],
        historicalPopulation,
      });

      expect(allPoints).toEqual([...admissions, ...releases]);
    });

    it("ignores the historical population when series are given", () => {
      const { lines } = resolveTimeSeriesLines({
        series: [{ name: "Admissions", data: admissions }],
        historicalPopulation,
        projectedPopulation: [point(2025, 30)],
      });

      expect(lines).toHaveLength(1);
      expect(lines[0].data).toEqual(admissions);
    });

    it("falls back to the historical population for an empty series list", () => {
      const { lines } = resolveTimeSeriesLines({
        series: [],
        historicalPopulation,
      });

      expect(lines).toEqual([
        { class: HISTORICAL_LINE_CLASS, data: historicalPopulation },
      ]);
    });
  });
});
