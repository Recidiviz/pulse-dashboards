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

import { flowResult, makeAutoObservable } from "mobx";

import {
  castToError,
  FlowMethod,
  Hydratable,
  HydratesFromSource,
} from "~hydration-utils";

import { InsightsAPI } from "../api/interface";
import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { ConfigLabels, OutlierOfficerData } from "./types";
import { getOutlierOfficerData } from "./utils";

export class SupervisionOfficerPresenter implements Hydratable {
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

  /**
   * Provide supervisor data for the current officer.
   */
  get supervisorInfo(): SupervisionOfficerSupervisor | undefined {
    const supervisorExternalId = this.officerRecord?.supervisorExternalId;
    if (!supervisorExternalId) return;
    return this.supervisionStore.supervisionOfficerSupervisorByExternalId(
      supervisorExternalId,
    );
  }

  /**
   * Provide access to all configured metrics.
   */
  get metricConfigsById() {
    return this.supervisionStore.metricConfigsById;
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

  private expectMetricsPopulated() {
    if (!this.supervisionStore.metricConfigsById)
      throw new Error("Failed to populate metric configs");
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

  /**
   * Fetch record for current officer.
   */
  private *populateSupervisionOfficer(): FlowMethod<
    InsightsAPI["supervisionOfficer"],
    void
  > {
    if (this.isOfficerPopulated) return;
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