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

import { index } from "d3-array";
import { makeAutoObservable, observable } from "mobx";

import { OutliersAPI } from "../api/interface";
import { MetricBenchmark } from "../models/MetricBenchmark";
import { MetricConfig } from "../models/MetricConfig";
import { OutliersConfig } from "../models/OutliersConfig";
import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import type { OutliersStore } from "../OutliersStore";
import { SupervisionOfficersPresenter } from "../presenters/SupervisionOfficersPresenter";
import { FlowMethod } from "../types";

export class OutliersSupervisionStore {
  private benchmarksByMetricAndCaseloadType?: Map<
    string,
    Map<string, MetricBenchmark>
  >;

  officersBySupervisor: Map<string, SupervisionOfficer[]> = new Map();

  supervisorId?: string;

  supervisionOfficerSupervisors?: SupervisionOfficerSupervisor[];

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

    this.benchmarksByMetricAndCaseloadType = benchmarksByMetricAndCaseloadType;
  }

  /**
   * Provides a mapping of all configured metrics, including nested benchmarks data.
   */
  get metricConfigsById(): Map<string, MetricConfig> | undefined {
    const { benchmarksByMetricAndCaseloadType } = this;
    if (!benchmarksByMetricAndCaseloadType) return;

    // we expect all metrics to be present; this is also handled downstream in the presenter,
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

  /**
   * Fetches supervision officer supervisor data for the current tenant.
   */
  *hydrateSupervisionOfficerSupervisors(): FlowMethod<
    OutliersAPI["supervisionOfficerSupervisors"],
    void
  > {
    if (this.supervisionOfficerSupervisors) return;

    this.supervisionOfficerSupervisors =
      yield this.outliersStore.apiClient.supervisionOfficerSupervisors();
  }

  /**
   * Fetches officer and metric data for the specified supervisor
   */
  *hydrateOfficersForSupervisor(
    supervisorId: string
  ): FlowMethod<OutliersAPI["officersForSupervisor"], void> {
    if (this.officersBySupervisor.has(supervisorId)) return;

    const officersData =
      yield this.outliersStore.apiClient.officersForSupervisor(supervisorId);

    if (officersData.length > 0)
      this.officersBySupervisor.set(supervisorId, officersData);
  }

  /**
   * Creates and returns the supervisionOfficersPresenter for the current supervisorId
   */
  get supervisionOfficersPresenter(): SupervisionOfficersPresenter | undefined {
    if (this.supervisorId) {
      return new SupervisionOfficersPresenter(this, this.supervisorId);
    }
    return undefined;
  }

  setSupervisorId(supervisorId: string | undefined): void {
    this.supervisorId = supervisorId;
  }
}
