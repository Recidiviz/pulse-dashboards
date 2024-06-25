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

import { captureException } from "@sentry/react";
import { makeAutoObservable, toJS } from "mobx";

import { castToError, FlowMethod } from "~hydration-utils";

import { MetricConfigWithBenchmark, OutlierOfficerData } from "../types";
import {
  CHART_ASPECT_RATIO,
  SWARM_AREA_BOTTOM_OFFSET,
  SWARM_AREA_TOP_OFFSET,
} from "./constants";
import { getSwarmLayoutWorkerV2, SwarmWorkerV2 } from "./getSwarmLayoutWorker";
import { HighlightedDot, PreparedChartData } from "./types";

export class SwarmPresenterV2 {
  width = 0;

  isLoading = true;

  chartData?: PreparedChartData;

  metricId: string;
  constructor(
    public readonly metric: MetricConfigWithBenchmark,
    readonly outlierOfficersForMetric: OutlierOfficerData[],
  ) {
    this.metricId = metric.config.name;
    makeAutoObservable(this);
  }

  /**
   * Height is of a fixed ratio to width
   */
  get chartHeight(): number {
    // rounding up to avoid fractional pixel values
    return Math.ceil(this.width * CHART_ASPECT_RATIO);
  }

  private get swarmHeight(): number {
    return Math.max(
      this.chartHeight - (SWARM_AREA_TOP_OFFSET + SWARM_AREA_BOTTOM_OFFSET),
      // clamping this to zero to avoid nonsensical intermediate values that could cause HTML errors
      0,
    );
  }

  private get getHighlightedDotsOrError(): HighlightedDot[] | Error {
    try {
      return this.outlierOfficersForMetric.map((officer) => {
        const metricWithConfig = officer.outlierMetrics.find(
          (m) => m.metricId === this.metricId,
        );
        const value = metricWithConfig?.currentPeriodData.metricRate;
        const label = officer.fullName.givenNames;

        // In practice, this shouldn't happen, as the officers for a given metric
        // will always have a corresponding metricWithConfig hydrated.
        if (value === undefined) {
          throw new Error(
            `Missing expected data for highlighted swarm plot dots for officer with pseudoId: ${officer.pseudonymizedId}`,
          );
        }
        return {
          value,
          label,
          officerId: officer.externalId,
          officerPseudoId: officer.pseudonymizedId,
          metricId: this.metricId,
        };
      });
    } catch (e) {
      return castToError(e);
    }
  }

  /**
   * Return plot info necessary for all highlighted officers.
   */
  get highlightedDots(): HighlightedDot[] {
    if (this.getHighlightedDotsOrError instanceof Error) {
      captureException(this.getHighlightedDotsOrError);
      return [];
    }
    return this.getHighlightedDotsOrError;
  }

  *prepareChartData(
    width: number,
  ): FlowMethod<SwarmWorkerV2["prepareChartDataV2"], void> {
    if (width === 0) return;
    // NOTE: we don't reset loading state on every recalculation.
    // this presenter will only be loading when it is first constructed,
    // until the first time this method finishes.

    this.width = width;

    const swarmLayout = getSwarmLayoutWorkerV2();

    const preparedData = yield swarmLayout.prepareChartDataV2(
      toJS(this.metric),
      this.highlightedDots,
      width,
      this.swarmHeight,
    );

    this.chartData = preparedData;
    this.isLoading = false;
  }
}
