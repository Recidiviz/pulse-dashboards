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

import { RootStore } from "../../../../RootStore";
import { InsightsConfigFixture } from "../../../models/offlineFixtures/InsightsConfigFixture";
import { supervisionOfficerFixture } from "../../../models/offlineFixtures/SupervisionOfficerFixture";
import { InsightsSupervisionStore } from "../../../stores/InsightsSupervisionStore";
import { getOutlierOfficerData } from "../../utils";
import {
  HIGHLIGHT_DOT_RADIUS_LG,
  HIGHLIGHT_DOT_RADIUS_SM,
  SWARM_DOT_RADIUS_LG,
  SWARM_DOT_RADIUS_SM,
  SWARM_SIZE_BREAKPOINT,
} from "../constants";
import { SwarmPresenterV2 } from "../SwarmPresenterV2";

// vitest does not support Web Workers;
// this will substitute a manual mock with the same underlying implementation
vi.mock("../getSwarmLayoutWorker");

let presenter: SwarmPresenterV2;

beforeEach(async () => {
  const store = new InsightsSupervisionStore(
    new RootStore().insightsStore,
    InsightsConfigFixture,
  );
  await flowResult(store.populateMetricConfigs());

  const processedOfficerData = getOutlierOfficerData(
    supervisionOfficerFixture[2],
    store,
  );

  presenter = new SwarmPresenterV2(processedOfficerData.outlierMetrics[0], [
    processedOfficerData,
  ]);
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

  expect(presenter.chartData?.backgroundRadius).toBe(SWARM_DOT_RADIUS_LG);
  presenter.chartData?.swarmPoints
    .slice(1)
    .forEach((p) => expect(p.radius).toBe(SWARM_DOT_RADIUS_LG));

  expect(presenter.chartData?.highlightRadius).toBe(HIGHLIGHT_DOT_RADIUS_LG);
  // this is larger because it includes a stroke width
  expect(presenter.chartData?.swarmPoints[0].radius).toBe(12);

  await flowResult(presenter.prepareChartData(SWARM_SIZE_BREAKPOINT));

  expect(presenter.chartData?.backgroundRadius).toBe(SWARM_DOT_RADIUS_SM);
  presenter.chartData?.swarmPoints
    .slice(1)
    .forEach((p) => expect(p.radius).toBe(SWARM_DOT_RADIUS_SM));

  expect(presenter.chartData?.highlightRadius).toBe(HIGHLIGHT_DOT_RADIUS_SM);
  expect(presenter.chartData?.swarmPoints[0].radius).toBe(
    HIGHLIGHT_DOT_RADIUS_LG,
  );
});

test("chart height", async () => {
  await flowResult(presenter.prepareChartData(1000));
  expect(presenter.chartHeight).toBe(350);
});
