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

import { flowResult, makeAutoObservable, runInAction } from "mobx";

import { Hydratable } from "../../core/models/types";
import { castToError } from "../../utils/castToError";
import { OutliersAPI } from "../api/interface";
import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { OutliersSupervisionStore } from "../stores/OutliersSupervisionStore";
import { FlowMethod } from "../types";
import { getOutlierOfficerData } from "./getOutlierOfficerData";
import { OutlierOfficerData } from "./types";

export class SupervisionOfficerDetailPresenter implements Hydratable {
  error?: Error | undefined;

  isLoading = false;

  // rather than dealing with a partially hydrated unit in the supervisionStore,
  // we will just put the API response here (when applicable)
  private fetchedOfficerRecord?: SupervisionOfficer;

  constructor(
    private supervisionStore: OutliersSupervisionStore,
    public officerPseudoId: string
  ) {
    makeAutoObservable(this);
  }

  private get areMetricsHydrated() {
    return this.supervisionStore.metricConfigsById !== undefined;
  }

  private get officerRecordFromStore(): SupervisionOfficer | undefined {
    return Array.from(
      this.supervisionStore.officersBySupervisorPseudoId.values()
    )
      .flat()
      .find((o) => o.pseudonymizedId === this.officerPseudoId);
  }

  private get officerRecord() {
    return this.officerRecordFromStore ?? this.fetchedOfficerRecord;
  }

  get outlierOfficerData(): OutlierOfficerData | undefined {
    if (!this.officerRecord) return;

    try {
      return getOutlierOfficerData(this.officerRecord, this.supervisionStore);
    } catch (e) {
      runInAction(() => {
        this.setError(castToError(e));
      });
    }
  }

  get defaultMetricId() {
    return this.outlierOfficerData?.outlierMetrics[0].metricId;
  }

  get metricId() {
    return this.supervisionStore.metricId;
  }

  get currentMetricIndex(): number {
    return (
      this.outlierOfficerData?.outlierMetrics.findIndex(
        (m) => m.metricId === this.metricId
      ) ?? 0
    );
  }

  get supervisorInfo(): SupervisionOfficerSupervisor | undefined {
    const supervisorExternalId = this.officerRecord?.supervisorExternalId;
    if (!supervisorExternalId) return;
    return this.supervisionStore.supervisionOfficerSupervisorByExternalId(
      supervisorExternalId
    );
  }

  private get isOfficerHydrated() {
    return this.officerRecord !== undefined;
  }

  private get isSupervisorHydrated() {
    return this.supervisorInfo !== undefined;
  }

  get isHydrated() {
    return (
      this.areMetricsHydrated &&
      this.isOfficerHydrated &&
      this.isSupervisorHydrated
    );
  }

  private *hydrateSupervisionOfficer(): FlowMethod<
    OutliersAPI["supervisionOfficer"],
    void
  > {
    if (this.isOfficerHydrated) return;

    if (this.metricId) {
      // we can prefetch metric event data here also rather than waiting for the page to load,
      // saving an additional loading spinner in the events table UI
      this.supervisionStore.hydrateMetricEventsForOfficer(
        this.officerPseudoId,
        this.metricId
      );
    }

    this.fetchedOfficerRecord =
      yield this.supervisionStore.outliersStore.apiClient.supervisionOfficer(
        this.officerPseudoId
      );
  }

  /**
   * Initiates hydration for all data needed within this presenter class
   */
  async hydrate(): Promise<void> {
    if (this.isHydrated) return;

    this.setIsLoading(true);
    this.setError(undefined);

    try {
      await Promise.all([
        flowResult(this.supervisionStore.hydrateMetricConfigs()),
        flowResult(
          this.supervisionStore.hydrateSupervisionOfficerSupervisors()
        ),
        flowResult(this.hydrateSupervisionOfficer()),
      ]);
      this.setIsLoading(false);
    } catch (e) {
      this.setError(castToError(e));
      this.setIsLoading(false);
    }
  }

  private setError(error: Error | undefined) {
    this.error = error;
  }

  private setIsLoading(loadingValue: boolean) {
    this.isLoading = loadingValue;
  }
}
