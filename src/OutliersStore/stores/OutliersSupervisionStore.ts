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

import { isOfflineMode } from "../../utils/isOfflineMode";
import { OutliersAPI } from "../api/interface";
import { MetricBenchmark } from "../models/MetricBenchmark";
import { MetricConfig } from "../models/MetricConfig";
import { OutliersConfig } from "../models/OutliersConfig";
import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { SupervisionOfficerMetricEvent } from "../models/SupervisionOfficerMetricEvent";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import type { OutliersStore } from "../OutliersStore";
import { FlowMethod, StringMap2D } from "../types";

export class OutliersSupervisionStore {
  private benchmarksByMetricAndCaseloadType?: StringMap2D<MetricBenchmark>;

  officersBySupervisorPseudoId: Map<string, SupervisionOfficer[]> = new Map();

  supervisorPseudoId?: string;

  officerPseudoId?: string;

  metricId?: string;

  private allSupervisionOfficerSupervisors?: SupervisionOfficerSupervisor[];

  metricEventsByOfficerPseudoIdAndMetricId: StringMap2D<
    Array<SupervisionOfficerMetricEvent>
  > = new Map();

  constructor(
    public readonly outliersStore: OutliersStore,
    private readonly config: OutliersConfig
  ) {
    makeAutoObservable<this, "config">(this, {
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
   * If undefined, it is still awaiting hydration.
   */
  get metricConfigsById(): Map<string, MetricConfig> | undefined {
    const { benchmarksByMetricAndCaseloadType } = this;
    if (!benchmarksByMetricAndCaseloadType) return;

    return index(
      this.config.metrics.map((m): MetricConfig => {
        const metricBenchmarksByCaseloadType =
          benchmarksByMetricAndCaseloadType.get(m.name);

        return {
          ...m,
          metricBenchmarksByCaseloadType,
        };
      }),
      (m) => m.name
    );
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

  get currentSupervisorUser(): SupervisionOfficerSupervisor | undefined {
    const { userAppMetadata } = this.outliersStore.rootStore.userStore;
    if (isOfflineMode()) return undefined;

    if (userAppMetadata) {
      const { role, externalId, district, pseudonymizedId } = userAppMetadata;
      if (
        // until metadata is extended with role subtypes,
        // this should be a safe proxy for distinguishing supervisors from leadership
        // (as long as no other line staff are granted access)
        role === "supervision_staff" &&
        // nothing will work without these ID values, so we can't construct a useful
        // supervisor identity record if we didn't get them both from Auth0
        externalId &&
        pseudonymizedId
      ) {
        return {
          externalId,
          supervisionDistrict: district ?? null,
          pseudonymizedId,
          // unfortunately we don't reliably get anyone's name from auth0
          fullName: {},
          displayName: "",
        };
      }
    }
  }

  get supervisionOfficerSupervisors():
    | SupervisionOfficerSupervisor[]
    | undefined {
    // if the user is a supervisor, the only record they need is their own
    if (this.currentSupervisorUser) return [this.currentSupervisorUser];

    return this.allSupervisionOfficerSupervisors;
  }

  supervisionOfficerSupervisorByExternalId(
    supervisorId: string
  ): SupervisionOfficerSupervisor | undefined {
    return this.supervisionOfficerSupervisors?.find(
      (s) => s.externalId === supervisorId
    );
  }

  supervisionOfficerSupervisorByPseudoId(
    supervisorPseudoId: string
  ): SupervisionOfficerSupervisor | undefined {
    return this.supervisionOfficerSupervisors?.find(
      (s) => s.pseudonymizedId === supervisorPseudoId
    );
  }

  /**
   * Fetches supervision officer supervisor data for the current tenant.
   */
  *hydrateSupervisionOfficerSupervisors(): FlowMethod<
    OutliersAPI["supervisionOfficerSupervisors"],
    void
  > {
    // note that this will bypass hydration if the current user is a supervisor
    // (since we expect to have already populated this list with their Auth0 data).
    // we expect the API request to fail for these users anyway so there is no reason
    // to let the request proceed
    if (this.supervisionOfficerSupervisors) return;

    this.allSupervisionOfficerSupervisors =
      yield this.outliersStore.apiClient.supervisionOfficerSupervisors();
  }

  /**
   * Fetches officer and metric data for the specified supervisor
   */
  *hydrateOfficersForSupervisor(
    supervisorPseudoId: string
  ): FlowMethod<OutliersAPI["officersForSupervisor"], void> {
    if (this.officersBySupervisorPseudoId.has(supervisorPseudoId)) return;

    const officersData =
      yield this.outliersStore.apiClient.officersForSupervisor(
        supervisorPseudoId
      );

    if (officersData.length > 0)
      this.officersBySupervisorPseudoId.set(supervisorPseudoId, officersData);
  }

  setSupervisorPseudoId(supervisorPseudoId: string | undefined): void {
    this.supervisorPseudoId = supervisorPseudoId;
  }

  setOfficerPseudoId(officerPseudoId: string | undefined): void {
    this.officerPseudoId = officerPseudoId;
  }

  setMetricId(metricId: string | undefined): void {
    this.metricId = metricId;
  }

  /*
   * Fetches events data for the specified officer and metric.
   */
  *hydrateMetricEventsForOfficer(
    officerPseudoId: string,
    metricId: string
  ): FlowMethod<OutliersAPI["supervisionOfficerMetricEvents"], void> {
    if (
      this.metricEventsByOfficerPseudoIdAndMetricId
        .get(officerPseudoId)
        ?.has(metricId)
    )
      return;

    const eventsData =
      yield this.outliersStore.apiClient.supervisionOfficerMetricEvents(
        officerPseudoId,
        metricId
      );

    const metricsMap =
      this.metricEventsByOfficerPseudoIdAndMetricId.get(officerPseudoId) ??
      new Map();
    metricsMap.set(metricId, eventsData);
    if (!this.metricEventsByOfficerPseudoIdAndMetricId.has(officerPseudoId)) {
      this.metricEventsByOfficerPseudoIdAndMetricId.set(
        officerPseudoId,
        metricsMap
      );
    }
  }
}
