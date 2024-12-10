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
  ActionStrategyCopy,
  ExcludedSupervisionOfficer,
  SupervisionOfficer,
  SupervisionOfficerOutcomes,
  SupervisionOfficerSupervisor,
} from "~datatypes";
import {
  castToError,
  FlowMethod,
  Hydratable,
  HydratesFromSource,
} from "~hydration-utils";

import { InsightsAPI } from "../api/interface";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionBasePresenter } from "./SupervisionBasePresenter";
import { ConfigLabels, OutlierOfficerData } from "./types";
import { getOutlierOfficerData, isExcludedSupervisionOfficer } from "./utils";

export abstract class SupervisionOfficerPresenterBase<
    T extends SupervisionOfficer | ExcludedSupervisionOfficer,
  >
  extends SupervisionBasePresenter
  implements Hydratable
{
  // rather than dealing with a partially hydrated unit in the supervisionStore,
  // we will just put the API response here (when applicable)
  protected fetchedOfficerRecord?: T;

  protected fetchedOfficerOutcomes?: SupervisionOfficerOutcomes;

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
      | "officerRecord"
      | "outlierDataOrError"
      | "expectOfficerPopulated"
      | "expectOfficerOutcomesPopulated"
      | "expectSupervisorPopulated"
      | "expectOutlierDataPopulated"
      | "isOfficerPopulated"
      | "populateSupervisionOfficer"
      | "populateSupervisionOfficerOutcomes"
    >(
      this,
      {
        fetchedOfficerRecord: true,
        hydrator: true,
        populateMethods: true,
        expectPopulated: true,
        trackStaffPageViewed: true,
        expectMetricsPopulated: true,
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
        actionStrategyCopy: true,
        setUserHasSeenActionStrategy: true,
        disableSurfaceActionStrategies: true,
        expectOfficerPopulated: true,
        expectOfficerOutcomesPopulated: true,
        expectSupervisorPopulated: true,
        expectOutlierDataPopulated: true,
        isOfficerPopulated: true,
        populateSupervisionOfficer: true,
        populateSupervisionOfficerOutcomes: true,
        hydrate: true,
        hydrationState: true,
        metricConfigsById: true,
      },
      { autoBind: true },
    );
    this.hydrator = new HydratesFromSource({
      expectPopulated: this.expectPopulated(),
      populate: async () => {
        await Promise.all(this.populateMethods());
      },
    });
  }

  populateMethods() {
    return [
      flowResult(this.supervisionStore.populateMetricConfigs()),
      flowResult(this.supervisionStore.populateSupervisionOfficerSupervisors()),
      flowResult(this.populateSupervisionOfficer()),
    ];
  }

  expectPopulated() {
    return [
      this.expectMetricsPopulated,
      this.expectOfficerPopulated,
      this.expectSupervisorPopulated,
      this.expectOutlierDataPopulated,
      this.expectOfficerOutcomesPopulated,
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

  private expectOfficerOutcomesPopulated() {
    if (isExcludedSupervisionOfficer(this.officerRecord)) return;
    if (!this.officerOutcomes)
      throw new Error("Failed to populate officer outcomes data");
  }

  get officerRecord() {
    return this.supervisionStore.officerRecord ?? this.fetchedOfficerRecord;
  }

  protected get officerOutcomes() {
    return this.supervisionStore.officerOutcomes ?? this.fetchedOfficerOutcomes;
  }

  /**
   * Augments officer data with all necessary relationships fully hydrated.
   * If this fails for any reason, the value will instead reflect the error that was encountered.
   */
  private get outlierDataOrError(): OutlierOfficerData<T> | Error {
    try {
      if (!this.officerRecord) throw new Error("Missing officer record");
      if (
        !isExcludedSupervisionOfficer(this.officerRecord) &&
        !this.officerOutcomes
      )
        throw new Error("Missing officer outcomes");

      return getOutlierOfficerData(
        this.officerRecord,
        this.supervisionStore,
        this.officerOutcomes,
      ) as OutlierOfficerData<T>;
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

  get metricConfigsById() {
    return this.supervisionStore.metricConfigsById;
  }

  /**
   * Passthrough to supervisionStore.
   * Provides the Action Strategy copy with prompt and body text
   * @returns an ActionStrategyCopy object
   */
  get actionStrategyCopy(): ActionStrategyCopy[string] | undefined {
    return this.supervisionStore.getActionStrategyCopy(this.officerPseudoId);
  }

  /**
   * Passthrough to supervisionStore.
   * Disables Action Strategies so that the banner is not seen
   * again in the current session
   */
  disableSurfaceActionStrategies(): void {
    this.supervisionStore.disableSurfaceActionStrategies();
  }

  /**
   * Passthrough to supervisionStore.
   * When the user has seen an Action Strategy banner,
   * use this to notify the BE of the new surfaced event
   */
  setUserHasSeenActionStrategy(): void {
    this.supervisionStore.setUserHasSeenActionStrategy(this.officerPseudoId);
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
   * Fetch outcomes for current officer.
   */
  protected *populateSupervisionOfficerOutcomes(): FlowMethod<
    InsightsAPI["outcomesForOfficer"],
    void
  > {
    if (isExcludedSupervisionOfficer(this.officerRecord)) return;
    this.fetchedOfficerOutcomes =
      yield this.supervisionStore.insightsStore.apiClient.outcomesForOfficer(
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

  get isInsightsLanternState(): boolean {
    return this.supervisionStore.isInsightsLanternState;
  }
}
