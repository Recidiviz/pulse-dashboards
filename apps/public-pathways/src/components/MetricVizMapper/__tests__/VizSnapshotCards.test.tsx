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

import {
  FiltersStoreBase,
  SnapshotDataRecord,
  SnapshotMetric,
} from "~shared-pathways";

import VizSnapshotCards from "../VizSnapshotCards";

vi.mock("~shared-pathways", async () => {
  const actual = await vi.importActual("~shared-pathways");
  return {
    ...actual,
    VizPopulationSnapshot: () => null,
  };
});

const record = (custodyStatus: string, count: number): SnapshotDataRecord =>
  ({ custodyStatus, count }) as unknown as SnapshotDataRecord;

function buildMetric(dataSeries: SnapshotDataRecord[]): SnapshotMetric {
  return {
    id: "releasesByType",
    chartTitle: "Test Chart",
    dataSeries,
  } as unknown as SnapshotMetric;
}

const filtersStore = {} as unknown as FiltersStoreBase;

describe("VizSnapshotCards", () => {
  it("renders one card per value of the split dimension", () => {
    const metric = buildMetric([
      record("Incarcerated Individual", 10),
      record("Incarcerated Parolee", 5),
    ]);

    expect(() =>
      render(
        <VizSnapshotCards
          metric={metric}
          filtersStore={filtersStore}
          splitDimension="custodyStatus"
        />,
      ),
    ).not.toThrow();
  });

  it("renders nothing for no records, without throwing", () => {
    const metric = buildMetric([]);

    expect(() =>
      render(
        <VizSnapshotCards
          metric={metric}
          filtersStore={filtersStore}
          splitDimension="custodyStatus"
        />,
      ),
    ).not.toThrow();
  });

  it("throws if every record is missing the split dimension, rather than rendering blank cards", () => {
    const metric = buildMetric([
      { count: 10 } as unknown as SnapshotDataRecord,
    ]);

    expect(() =>
      render(
        <VizSnapshotCards
          metric={metric}
          filtersStore={filtersStore}
          splitDimension="custodyStatus"
        />,
      ),
    ).toThrow(/releasesByType/);
  });
});
