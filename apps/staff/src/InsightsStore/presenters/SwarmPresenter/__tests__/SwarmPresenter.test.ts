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

import { flowResult } from "mobx";

import {
  InsightsConfigFixture,
  supervisionOfficerFixture,
  supervisionOfficerOutcomesFixture,
} from "~datatypes";

import { RootStore } from "../../../../RootStore";
import { InsightsSupervisionStore } from "../../../stores/InsightsSupervisionStore";
import { getOfficerOutcomesData } from "../../utils";
import { SwarmPresenter } from "../SwarmPresenter";

// vitest does not support Web Workers;
// this will substitute a manual mock with the same underlying implementation
vi.mock("../getSwarmLayoutWorker");

let presenter: SwarmPresenter;

beforeEach(async () => {
  const store = new InsightsSupervisionStore(
    new RootStore().insightsStore,
    InsightsConfigFixture,
  );
  await flowResult(store.populateMetricConfigs());

  const processedOfficerData = getOfficerOutcomesData(
    supervisionOfficerFixture[2],
    store,
    supervisionOfficerOutcomesFixture[2],
  );

  presenter = new SwarmPresenter(processedOfficerData.outlierMetrics[0]);
});

test("prepareChartData", async () => {
  expect(presenter.isLoading).toBeTrue();
  expect(presenter.chartData).toBeUndefined();
  expect(presenter.width).toBe(0);

  await flowResult(presenter.prepareChartData(300));

  expect(presenter.width).toBe(300);
  expect(presenter.isLoading).toBeFalse();
  expect(presenter.chartData).toMatchSnapshot();
});

test("radii adjust to width", async () => {
  await flowResult(presenter.prepareChartData(800));

  expect(presenter.chartData?.backgroundRadius).toBe(6);
  presenter.chartData?.swarmPoints
    .slice(1)
    .forEach((p) => expect(p.radius).toBe(6));

  expect(presenter.chartData?.highlightRadius).toBe(10);
  // this is larger because it includes a stroke width
  expect(presenter.chartData?.swarmPoints[0].radius).toBe(12);

  await flowResult(presenter.prepareChartData(400));

  expect(presenter.chartData?.backgroundRadius).toBe(4);
  presenter.chartData?.swarmPoints
    .slice(1)
    .forEach((p) => expect(p.radius).toBe(4));

  expect(presenter.chartData?.highlightRadius).toBe(8);
  expect(presenter.chartData?.swarmPoints[0].radius).toBe(10);
});

test("chart height", async () => {
  await flowResult(presenter.prepareChartData(1000));
  expect(presenter.chartHeight).toBe(350);
});
