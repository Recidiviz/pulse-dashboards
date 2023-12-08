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
import { parseISO } from "date-fns";
import { uniq } from "lodash";
import { makeAutoObservable, observable } from "mobx";
import moment from "moment";

import { formatDate } from "../../utils";
import { OutliersAPI } from "../api/interface";
import { ClientEvent } from "../models/ClientEvent";
import { ClientInfo } from "../models/ClientInfo";
import { MetricBenchmark } from "../models/MetricBenchmark";
import { MetricConfig } from "../models/MetricConfig";
import { OutliersConfig } from "../models/OutliersConfig";
import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { SupervisionOfficerMetricEvent } from "../models/SupervisionOfficerMetricEvent";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { UserInfo } from "../models/UserInfo";
import type { OutliersStore } from "../OutliersStore";
import { ConfigLabels } from "../presenters/types";
import { FlowMethod, StringMap2D } from "../types";

export class OutliersSupervisionStore {
  private benchmarksByMetricAndCaseloadType?: StringMap2D<MetricBenchmark>;

  userInfo?: UserInfo;

  officersBySupervisorPseudoId: Map<string, SupervisionOfficer[]> = new Map();

  supervisorPseudoId?: string;

  officerPseudoId?: string;

  metricId?: string;

  clientId?: string;

  outcomeDate?: Date;

  latestBenchmarksDate?: Date;

  private allSupervisionOfficerSupervisors?: SupervisionOfficerSupervisor[];

  metricEventsByOfficerPseudoIdAndMetricId: StringMap2D<
    Array<SupervisionOfficerMetricEvent>
  > = new Map();

  clientEventsByClientPseudoIdAndOutcomeDate: StringMap2D<Array<ClientEvent>> =
    new Map();

  clientInfoByClientPseudoId: Map<string, ClientInfo> = new Map();

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

    const latestBenchmarksDate = new Date(
      Math.max(
        ...uniq(
          benchmarks
            .map((b) => b.benchmarks.map((d) => d.endDate))
            .flat(2)
            .map((d) => d.getTime())
        )
      )
    );

    this.benchmarksByMetricAndCaseloadType = benchmarksByMetricAndCaseloadType;
    this.latestBenchmarksDate = latestBenchmarksDate;
  }

  *hydrateUserInfo(): FlowMethod<OutliersAPI["userInfo"], void> {
    if (this.userInfo) return;

    const { userAppMetadata, isRecidivizUser, stateCode } =
      this.outliersStore.rootStore.userStore;

    // Recidiviz and CSG users might not have pseudonymizedIds, but should have an experience
    // similar to leadership users.
    if (isRecidivizUser || stateCode === "CSG") {
      this.userInfo = {
        entity: null,
        role: null,
      };
      return;
    }

    if (!userAppMetadata) {
      throw new Error("Missing app_metadata for user");
    }

    const { pseudonymizedId } = userAppMetadata;

    if (!pseudonymizedId) {
      throw new Error("Missing pseudonymizedId for user");
    }
    this.userInfo = yield this.outliersStore.apiClient.userInfo(
      pseudonymizedId
    );
  }

  private get allCaseloadTypes(): Set<string> {
    return new Set(
      ...Array.from(
        this.benchmarksByMetricAndCaseloadType?.values() ?? []
      ).flatMap((b) => b.keys())
    );
  }

  get areCaseloadTypeBreakdownsEnabled(): boolean {
    return this.allCaseloadTypes.size > 1;
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

  get userCanAccessAllSupervisors(): boolean {
    const { userStore } = this.outliersStore.rootStore;
    return userStore.getRoutePermission("supervisors-list");
  }

  get currentSupervisorUser(): SupervisionOfficerSupervisor | undefined {
    if (this.userInfo?.role === "supervision_officer_supervisor") {
      return this.userInfo.entity;
    }
  }

  get supervisionOfficerSupervisors():
    | SupervisionOfficerSupervisor[]
    | undefined {
    // if the user is a supervisor, the only record they need is their own
    if (this.currentSupervisorUser) return [this.currentSupervisorUser];

    return this.allSupervisionOfficerSupervisors;
  }

  get benchmarksTimePeriod(): string | undefined {
    if (!this.latestBenchmarksDate) return;

    const latestBenchmarkDateOneYearEarlier = moment(this.latestBenchmarksDate)
      .subtract(1, "year")
      .toDate();

    return `${formatDate(latestBenchmarkDateOneYearEarlier)} - ${formatDate(
      this.latestBenchmarksDate
    )}`;
  }

  get methodologyUrl(): string {
    return this.config.learnMoreUrl;
  }

  get labels(): ConfigLabels {
    return {
      supervisionOfficerLabel: this.config.supervisionOfficerLabel,
      supervisionDistrictLabel: this.config.supervisionDistrictLabel,
      supervisionDistrictManagerLabel:
        this.config.supervisionDistrictManagerLabel,
      supervisionJiiLabel: this.config.supervisionJiiLabel,
      supervisionSupervisorLabel: this.config.supervisionSupervisorLabel,
      supervisionUnitLabel: this.config.supervisionUnitLabel,
    };
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

  setClientId(clientId: string | undefined): void {
    this.clientId = clientId;
  }

  setOutcomeDate(dateString: string | undefined): void {
    this.outcomeDate = dateString ? parseISO(dateString) : undefined;
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

  /*
   * Fetches events specified client and outcome date.
   */
  *hydrateClientEventsForClient(
    clientPseudoId: string,
    outcomeDate: Date
  ): FlowMethod<OutliersAPI["clientEvents"], void> {
    if (
      this.clientEventsByClientPseudoIdAndOutcomeDate
        .get(clientPseudoId)
        ?.has(outcomeDate.toISOString())
    )
      return;

    const clientEventsData = yield this.outliersStore.apiClient.clientEvents(
      clientPseudoId,
      outcomeDate
    );

    const metricsMap =
      this.clientEventsByClientPseudoIdAndOutcomeDate.get(clientPseudoId) ??
      new Map();
    metricsMap.set(outcomeDate.toISOString(), clientEventsData);
    if (!this.clientEventsByClientPseudoIdAndOutcomeDate.has(clientPseudoId)) {
      this.clientEventsByClientPseudoIdAndOutcomeDate.set(
        clientPseudoId,
        metricsMap
      );
    }
  }

  /*
   * Fetches profile info for  specified client.
   */
  *hydrateClientInfoForClient(
    clientPseudoId: string
  ): FlowMethod<OutliersAPI["clientInfo"], void> {
    if (this.clientInfoByClientPseudoId.get(clientPseudoId)) return;

    const clientInfo = yield this.outliersStore.apiClient.clientInfo(
      clientPseudoId
    );

    this.clientInfoByClientPseudoId.set(clientPseudoId, clientInfo);
  }
}
