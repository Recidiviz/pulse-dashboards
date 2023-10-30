// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import * as Comlink from "comlink";
import { makeAutoObservable, toJS } from "mobx";

import { FlowMethod } from "../../types";
import { MetricWithConfig } from "../types";
import { getSwarmLayoutWorker } from "./getSwarmLayoutWorker";
import { PreparedChartData, SwarmLayout } from "./types";

export class SwarmPresenter {
  width = 0;

  isLoading = true;

  chartData?: PreparedChartData;

  constructor(public readonly metric: MetricWithConfig) {
    makeAutoObservable(this);
  }

  *prepareChartData(
    width: number
  ): FlowMethod<Comlink.Remote<SwarmLayout>["prepareChartData"], void> {
    if (width === 0) return;
    // NOTE: we don't reset loading state on every recalculation.
    // this presenter will only be loading when it is first constructed,
    // until the first time this method finishes.

    const swarmLayout = getSwarmLayoutWorker();

    const preparedData = yield swarmLayout.prepareChartData(
      toJS(this.metric),
      width
    );

    this.width = width;
    this.chartData = preparedData;
    this.isLoading = false;
  }
}
