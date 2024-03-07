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

import { flowResult, makeAutoObservable } from "mobx";

import { HydratesFromSource } from "../../core/models/HydratesFromSource";
import { Hydratable } from "../../core/models/types";
import { castToError } from "../../utils/castToError";
import { InsightsAPI } from "../api/interface";
import { MetricConfig } from "../models/MetricConfig";
import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { FlowMethod } from "../types";
import { ConfigLabels, OutlierOfficerData } from "./types";
import { getOutlierOfficerData } from "./utils";

export class SupervisionOfficerDetailPresenter implements Hydratable {
  // rather than dealing with a partially hydrated unit in the supervisionStore,
  // we will just put the API response here (when applicable)
  private fetchedOfficerRecord?: SupervisionOfficer;

  private hydrator: HydratesFromSource;

  constructor(
    private supervisionStore: InsightsSupervisionStore,
    public officerPseudoId: string,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        this.expectMetricsPopulated,
        this.expectOfficerPopulated,
        this.expectSupervisorPopulated,
        this.expectOutlierDataPopulated,
      ],
      populate: async () => {
        await Promise.all([
          flowResult(this.supervisionStore.populateMetricConfigs()),
          flowResult(
            this.supervisionStore.populateSupervisionOfficerSupervisors(),
          ),
          flowResult(this.populateSupervisionOfficer()),
        ]);
      },
    });
  }

  trackViewed(): void {
    const { userPseudoId } =
      this.supervisionStore.insightsStore.rootStore.userStore;

    this.supervisionStore.insightsStore.rootStore.analyticsStore.trackInsightsStaffPageViewed(
      {
        staffPseudonymizedId: this.officerPseudoId,
        supervisorPseudonymizedId: this.supervisorInfo?.pseudonymizedId,
        viewedBy: userPseudoId,
        numOutlierMetrics: this.outlierOfficerData?.outlierMetrics.length,
      },
    );
  }

  private expectMetricsPopulated() {
    if (!this.supervisionStore.metricConfigsById)
      throw new Error("Failed to populate metric configs");
  }

  private get officerRecordFromStore(): SupervisionOfficer | undefined {
    return Array.from(
      this.supervisionStore.officersBySupervisorPseudoId.values(),
    )
      .flat()
      .find((o) => o.pseudonymizedId === this.officerPseudoId);
  }

  private get officerRecord() {
    return this.officerRecordFromStore ?? this.fetchedOfficerRecord;
  }

  /**
   * Augments officer data with all necessary relationships fully hydrated.
   * If this fails for any reason, the value will instead reflect the error that was encountered.
   */
  private get outlierDataOrError(): OutlierOfficerData | Error {
    try {
      if (!this.officerRecord) throw new Error("Missing officer record");
      return getOutlierOfficerData(this.officerRecord, this.supervisionStore);
    } catch (e) {
      return castToError(e);
    }
  }

  /**
   * Augments officer data with all necessary relationships fully hydrated.
   */
  get outlierOfficerData(): OutlierOfficerData | undefined {
    if (this.outlierDataOrError instanceof Error) return;
    return this.outlierDataOrError;
  }

  get defaultMetricId() {
    return this.outlierOfficerData?.outlierMetrics[0]?.metricId;
  }

  get metricId() {
    return this.supervisionStore.metricId;
  }

  get currentMetricIndex(): number {
    return (
      this.outlierOfficerData?.outlierMetrics.findIndex(
        (m) => m.metricId === this.metricId,
      ) ?? 0
    );
  }

  get metricInfo(): MetricConfig | undefined {
    const metricId = this.metricId || this.defaultMetricId;
    if (!metricId || !this.supervisionStore.adverseMetricConfigsById) return;
    return this.supervisionStore.adverseMetricConfigsById.get(metricId);
  }

  get supervisorInfo(): SupervisionOfficerSupervisor | undefined {
    const supervisorExternalId = this.officerRecord?.supervisorExternalId;
    if (!supervisorExternalId) return;
    return this.supervisionStore.supervisionOfficerSupervisorByExternalId(
      supervisorExternalId,
    );
  }

  get methodologyUrl(): string {
    return this.supervisionStore.methodologyUrl;
  }

  get labels(): ConfigLabels {
    return this.supervisionStore.labels;
  }

  get timePeriod(): string | undefined {
    return this.supervisionStore?.benchmarksTimePeriod;
  }

  get areCaseloadTypeBreakdownsEnabled() {
    return this.supervisionStore.areCaseloadTypeBreakdownsEnabled;
  }

  private expectOfficerPopulated() {
    if (!this.officerRecord) throw new Error("Failed to populate officer data");
  }

  private expectSupervisorPopulated() {
    if (!this.supervisorInfo)
      throw new Error("Failed to populate supervisor info");
  }

  private expectOutlierDataPopulated() {
    if (this.outlierDataOrError instanceof Error) throw this.outlierDataOrError;
  }

  private get isOfficerPopulated() {
    return !(this.outlierDataOrError instanceof Error);
  }

  private *populateSupervisionOfficer(): FlowMethod<
    InsightsAPI["supervisionOfficer"],
    void
  > {
    if (this.isOfficerPopulated) return;

    if (this.metricId) {
      // we can prefetch metric event data here also rather than waiting for the page to load,
      // saving an additional loading spinner in the events table UI
      this.supervisionStore.populateMetricEventsForOfficer(
        this.officerPseudoId,
        this.metricId,
      );
    }

    this.fetchedOfficerRecord =
      yield this.supervisionStore.insightsStore.apiClient.supervisionOfficer(
        this.officerPseudoId,
      );
  }

  /**
   * Initiates hydration for all data needed within this presenter class
   */
  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get hydrationState() {
    return this.hydrator.hydrationState;
  }
}
