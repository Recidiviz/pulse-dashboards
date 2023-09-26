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

import { difference, index } from "d3-array";
import { makeAutoObservable, observable } from "mobx";

import { OutliersAPI } from "../api/interface";
import { MetricBenchmark } from "../models/MetricBenchmark";
import { MetricConfig } from "../models/MetricConfig";
import { OutliersConfig } from "../models/OutliersConfig";
import type { OutliersStore } from "../OutliersStore";
import { FlowMethod } from "../types";

export class OutliersSupervisionStore {
  private benchmarksByMetricAndCaseloadType?: Map<
    string,
    Map<string, MetricBenchmark>
  >;

  constructor(
    public readonly outliersStore: OutliersStore,
    public readonly config: OutliersConfig
  ) {
    makeAutoObservable(this, {
      // this object will be static so there's no need to deeply observe it
      config: observable.ref,
    });
  }

  /**
   * Fetches metric benchmark data for the current tenant.
   *
   * This is a MobX flow method and should be called with mobx.flowResult.
   */
  *hydrateMetricConfigs(): FlowMethod<OutliersAPI["metricBenchmarks"], void> {
    if (this.benchmarksByMetricAndCaseloadType) return;

    const benchmarks = yield this.outliersStore.apiClient.metricBenchmarks();
    const benchmarksByMetricAndCaseloadType = index(
      benchmarks,
      (b) => b.metricId,
      (b) => b.caseloadType
    );

    // since we already know what metrics to expect, we can verify that none are missing
    const missingMetrics = difference(
      this.config.metrics.map((m) => m.name),
      benchmarksByMetricAndCaseloadType.keys()
    );
    if (missingMetrics.size) {
      throw new Error(
        `Missing benchmark data for ${Array.from(missingMetrics.values()).join(
          ", "
        )}`
      );
    }

    this.benchmarksByMetricAndCaseloadType = benchmarksByMetricAndCaseloadType;
  }

  /**
   * Provides a mapping of all configured metrics, including nested benchmarks data.
   */
  get metricConfigsById(): Map<string, MetricConfig> | undefined {
    const { benchmarksByMetricAndCaseloadType } = this;
    if (!benchmarksByMetricAndCaseloadType) return;

    // we expect all metrics to be present; in practice this should be handled upstream,
    // but for type safety we will verify here
    try {
      return index(
        this.config.metrics.map((m): MetricConfig => {
          const metricBenchmarksByCaseloadType =
            benchmarksByMetricAndCaseloadType.get(m.name);

          if (!metricBenchmarksByCaseloadType) {
            throw new Error(`Missing benchmarks for ${m.name}`);
          }
          return {
            ...m,
            metricBenchmarksByCaseloadType,
          };
        }),
        (m) => m.name
      );
    } catch {
      return undefined;
    }
  }

  /**
   * Provides a mapping of all configured adverse outcome metrics, including nested benchmarks data.
   */
  get adverseMetricConfigsById(): Map<string, MetricConfig> | undefined {
    if (!this.metricConfigsById) return;

    return new Map(
      Array.from(this.metricConfigsById.entries()).filter(
        ([id, m]) => m.outcomeType === "ADVERSE"
      )
    );
  }
}
