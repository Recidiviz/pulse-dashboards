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

import { render } from "@testing-library/react";
import { vi } from "vitest";

import { METRIC_MODES } from "../../../constants";
import { FiltersStoreBase } from "../../../FiltersStoreBase";
import SnapshotMetric from "../../../metrics/SnapshotMetric";
import { SnapshotDataPoint } from "../../PopulationSnapshotChart/PopulationSnapshotChart";
import VizPopulationSnapshot from "../VizPopulationSnapshot";

const capturedData: { current: SnapshotDataPoint[] | null } = { current: null };

vi.mock("../../PopulationSnapshotChart", () => ({
  PopulationSnapshotChart: (props: { data: SnapshotDataPoint[] }) => {
    capturedData.current = props.data;
    return null;
  },
}));

type MetricOverrides = {
  accessor?: string;
  dataSeries?: Record<string, unknown>[];
  accessorIsNotFilterType?: boolean;
};

type FilterStoreOverrides = {
  filters?: Record<string, string[]>;
  filterOptions?: Record<
    string,
    { options: { value: string; label: string }[] }
  >;
};

function buildMetric(overrides: MetricOverrides = {}): SnapshotMetric {
  return {
    id: "test-metric",
    chartTitle: "Test Chart",
    chartXAxisTitle: undefined,
    accessor: overrides.accessor ?? "facility",
    accessorIsNotFilterType: overrides.accessorIsNotFilterType ?? false,
    dataSeries: overrides.dataSeries ?? [],
    enableMetricModeToggle: false,
    supervisionLevelOrder: undefined,
    offenseTypeOrder: undefined,
    isHorizontal: true,
    rotateLabels: false,
    isGeographic: false,
    lastUpdated: new Date(2025, 0, 1),
  } as unknown as SnapshotMetric;
}

function buildFiltersStore(
  overrides: FilterStoreOverrides = {},
): FiltersStoreBase {
  return {
    filters: overrides.filters ?? {},
    filterOptions: overrides.filterOptions ?? {},
    getFilterLabel: (_type: string, value: string) => `label-${value}`,
    getFilterLongLabel: (_type: string, value: string) => `long-${value}`,
    currentMetricMode: METRIC_MODES.COUNTS,
    filtersDescription: "",
  } as unknown as FiltersStoreBase;
}

function renderViz(
  metric: SnapshotMetric,
  filtersStore: FiltersStoreBase,
): SnapshotDataPoint[] {
  capturedData.current = null;
  render(<VizPopulationSnapshot metric={metric} filtersStore={filtersStore} />);
  if (!capturedData.current) {
    throw new Error("PopulationSnapshotChart was not rendered");
  }
  return capturedData.current;
}

describe("VizPopulationSnapshot data composition", () => {
  it("filters and synthesizes 0-count rows when the accessor itself is filtered", () => {
    const metric = buildMetric({
      accessor: "facility",
      dataSeries: [
        { facility: "A", count: 10 },
        { facility: "B", count: 5 },
      ],
    });
    const filtersStore = buildFiltersStore({
      filters: { facility: ["A", "C"] },
    });

    const data = renderViz(metric, filtersStore);
    const rows = Object.fromEntries(
      data.map((d) => [d.accessorValue, Number(d.value)]),
    );

    expect(data).toHaveLength(2);
    expect(rows).toEqual({ A: 10, C: 0 });
    expect(data.find((d) => d.accessorValue === "B")).toBeUndefined();
  });

  it("synthesizes 0-count rows for accessor values absent from dataSeries when nothing is picked", () => {
    const metric = buildMetric({
      accessor: "facility",
      dataSeries: [{ facility: "A", count: 10 }],
    });
    const filtersStore = buildFiltersStore({
      filters: { facility: ["ALL"] },
      filterOptions: {
        facility: {
          options: [
            { value: "ALL", label: "All" },
            { value: "A", label: "Facility A" },
            { value: "B", label: "Facility B" },
            { value: "C", label: "Facility C" },
          ],
        },
      },
    });

    const data = renderViz(metric, filtersStore);
    const rows = Object.fromEntries(
      data.map((d) => [d.accessorValue, Number(d.value)]),
    );

    expect(data).toHaveLength(3);
    expect(rows).toEqual({ A: 10, B: 0, C: 0 });
  });

  it("uses long and short labels from filtersStore for synthesized rows", () => {
    const metric = buildMetric({
      accessor: "facility",
      dataSeries: [],
    });
    const filtersStore = buildFiltersStore({
      filters: { facility: ["X"] },
    });

    const data = renderViz(metric, filtersStore);

    expect(data).toEqual([
      expect.objectContaining({
        accessorValue: "X",
        accessorLabel: "label-X",
        tooltipLabel: "long-X",
        value: "0",
      }),
    ]);
  });

  it("passes dataSeries through unchanged when the accessor is not a filter type", () => {
    const metric = buildMetric({
      accessor: "lengthOfStay",
      accessorIsNotFilterType: true,
      dataSeries: [
        { lengthOfStay: "0-3", count: 7 },
        { lengthOfStay: "3-6", count: 2 },
      ],
    });
    const filtersStore = buildFiltersStore({
      filters: { facility: ["ALL"] },
      filterOptions: {
        facility: {
          options: [
            { value: "ALL", label: "All" },
            { value: "A", label: "Facility A" },
          ],
        },
      },
    });

    const data = renderViz(metric, filtersStore);

    expect(data.map((d) => d.accessorValue)).toEqual(["0-3", "3-6"]);
    expect(data.map((d) => Number(d.value))).toEqual([7, 2]);
  });

  it("falls back to dataSeries when no filterOptions exist for the accessor", () => {
    const metric = buildMetric({
      accessor: "facility",
      dataSeries: [{ facility: "A", count: 10 }],
    });
    const filtersStore = buildFiltersStore({
      filters: { facility: ["ALL"] },
      filterOptions: {},
    });

    const data = renderViz(metric, filtersStore);

    expect(data).toHaveLength(1);
    expect(data[0].accessorValue).toBe("A");
    expect(Number(data[0].value)).toBe(10);
  });
});
