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

import { flowResult, makeObservable } from "mobx";

import {
  castToError,
  FlowMethod,
  Hydratable,
  HydratesFromSource,
} from "~hydration-utils";

import { InsightsAPI } from "../api/interface";
import {
  ExcludedSupervisionOfficer,
  SupervisionOfficer,
} from "../models/SupervisionOfficer";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionBasePresenter } from "./SupervisionBasePresenter";
import { ConfigLabels, OutlierOfficerData } from "./types";
import { getOutlierOfficerData } from "./utils";

export abstract class SupervisionOfficerPresenterBase<
    T extends SupervisionOfficer | ExcludedSupervisionOfficer,
  >
  extends SupervisionBasePresenter
  implements Hydratable
{
  // rather than dealing with a partially hydrated unit in the supervisionStore,
  // we will just put the API response here (when applicable)
  protected fetchedOfficerRecord?: T;

  protected hydrator: HydratesFromSource;

  constructor(
    protected supervisionStore: InsightsSupervisionStore,
    public officerPseudoId: string,
  ) {
    super(supervisionStore);
    makeObservable<
      SupervisionOfficerPresenterBase<T>,
      | "fetchedOfficerRecord"
      | "expectMetricsPopulated"
      | "hydrator"
      | "officerRecordFromStore"
      | "officerRecord"
      | "outlierDataOrError"
      | "expectOfficerPopulated"
      | "expectSupervisorPopulated"
      | "expectOutlierDataPopulated"
      | "isOfficerPopulated"
      | "populateSupervisionOfficer"
    >(
      this,
      {
        fetchedOfficerRecord: true,
        hydrator: true,
        populateMethods: true,
        expectPopulated: true,
        trackStaffPageViewed: true,
        expectMetricsPopulated: true,
        officerRecordFromStore: true,
        officerRecord: true,
        outlierDataOrError: true,
        officerExternalId: true,
        outlierOfficerData: true,
        supervisorsInfo: true,
        userCanAccessAllSupervisors: true,
        goToSupervisorInfo: true,
        methodologyUrl: true,
        labels: true,
        timePeriod: true,
        areCaseloadCategoryBreakdownsEnabled: true,
        expectOfficerPopulated: true,
        expectSupervisorPopulated: true,
        expectOutlierDataPopulated: true,
        isOfficerPopulated: true,
        populateSupervisionOfficer: true,
        hydrate: true,
        hydrationState: true,
      },
      { autoBind: true },
    );
    this.hydrator = new HydratesFromSource({
      expectPopulated: this.expectPopulated,
      populate: async () => {
        await Promise.all(this.populateMethods);
      },
    });
  }

  get populateMethods() {
    return [
      flowResult(this.supervisionStore.populateMetricConfigs()),
      flowResult(this.supervisionStore.populateSupervisionOfficerSupervisors()),
      flowResult(this.populateSupervisionOfficer()),
    ];
  }

  get expectPopulated() {
    return [
      this.expectMetricsPopulated,
      this.expectOfficerPopulated,
      this.expectSupervisorPopulated,
      this.expectOutlierDataPopulated,
    ];
  }

  trackStaffPageViewed(): void {
    const { userPseudoId } =
      this.supervisionStore.insightsStore.rootStore.userStore;

    this.supervisionStore.insightsStore.rootStore.analyticsStore.trackInsightsStaffPageViewed(
      {
        staffPseudonymizedId: this.officerPseudoId,
        supervisorPseudonymizedId: this.goToSupervisorInfo?.pseudonymizedId,
        viewedBy: userPseudoId,
        numOutlierMetrics: this.outlierOfficerData?.outlierMetrics?.length,
      },
    );
  }

  protected expectMetricsPopulated() {
    if (!this.supervisionStore.metricConfigsById)
      throw new Error("Failed to populate metric configs");
  }

  private get officerRecordFromStore(): T | undefined {
    const officer = [
      ...this.supervisionStore.officersBySupervisorPseudoId.values(),
      ...this.supervisionStore.excludedOfficersBySupervisorPseudoId.values(),
    ]
      .flat()
      .find((o) => o.pseudonymizedId === this.officerPseudoId);

    return officer ? (officer as T) : undefined;
  }

  private get officerRecord() {
    return this.officerRecordFromStore ?? this.fetchedOfficerRecord;
  }

  /**
   * Augments officer data with all necessary relationships fully hydrated.
   * If this fails for any reason, the value will instead reflect the error that was encountered.
   */
  private get outlierDataOrError(): OutlierOfficerData<T> | Error {
    try {
      if (!this.officerRecord) throw new Error("Missing officer record");
      return getOutlierOfficerData(this.officerRecord, this.supervisionStore);
    } catch (e) {
      return castToError(e);
    }
  }

  get officerExternalId() {
    return this.officerRecord?.externalId;
  }

  /**
   * Augments officer data with all necessary relationships fully hydrated.
   */
  get outlierOfficerData(): OutlierOfficerData<T> | undefined {
    if (this.outlierDataOrError instanceof Error) return;
    return this.outlierDataOrError;
  }

  get supervisorsInfo(): SupervisionOfficerSupervisor[] | undefined {
    const supervisorExternalIds = this.officerRecord?.supervisorExternalIds;
    if (!supervisorExternalIds) return;
    const supervisors = supervisorExternalIds
      .map((id) =>
        this.supervisionStore.supervisionOfficerSupervisorByExternalId(id),
      )
      .filter((s): s is SupervisionOfficerSupervisor => !!s);
    return supervisors.length > 0 ? supervisors : undefined;
  }

  get userCanAccessAllSupervisors(): boolean {
    return this.supervisionStore.userCanAccessAllSupervisors;
  }

  // supervisorInfo for the "Go to" link on the staff page. If the staff page
  // was navigated to from a supervisor page, use that supervisor.
  // Otherwise use the first of the officer's supervisors
  get goToSupervisorInfo(): SupervisionOfficerSupervisor | undefined {
    if (this.supervisionStore.mostRecentSupervisorPseudoId)
      return this.supervisionStore.supervisionOfficerSupervisorByPseudoId(
        this.supervisionStore.mostRecentSupervisorPseudoId,
      );

    return this.officerRecord?.supervisorExternalIds[0]
      ? this.supervisionStore.supervisionOfficerSupervisorByExternalId(
          this.officerRecord?.supervisorExternalIds[0],
        )
      : undefined;
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

  get areCaseloadCategoryBreakdownsEnabled() {
    return this.supervisionStore.areCaseloadCategoryBreakdownsEnabled;
  }

  private expectOfficerPopulated() {
    if (!this.officerRecord) throw new Error("Failed to populate officer data");
  }

  private expectSupervisorPopulated() {
    if (!this.supervisorsInfo)
      throw new Error("Failed to populate supervisor info");
  }

  private expectOutlierDataPopulated() {
    if (this.outlierDataOrError instanceof Error) throw this.outlierDataOrError;
  }

  protected get isOfficerPopulated() {
    return !(this.outlierDataOrError instanceof Error);
  }

  protected abstract populateSupervisionOfficer(): FlowMethod<
    InsightsAPI["supervisionOfficer" | "excludedSupervisionOfficer"],
    void
  >;

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
