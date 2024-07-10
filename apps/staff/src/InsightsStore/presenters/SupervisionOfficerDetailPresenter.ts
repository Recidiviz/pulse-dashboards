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

import { makeObservable } from "mobx";

import { FlowMethod, HydratesFromSource } from "~hydration-utils";

import { InsightsAPI } from "../api/interface";
import { MetricConfig } from "../models/MetricConfig";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionOfficerPresenterBase } from "./SupervisionOfficerPresenterBase";

export class SupervisionOfficerDetailPresenter extends SupervisionOfficerPresenterBase {
  constructor(
    supervisionStore: InsightsSupervisionStore,
    officerPseudoId: string,
  ) {
    super(supervisionStore, officerPseudoId);

    makeObservable<
      SupervisionOfficerDetailPresenter,
      | "populateSupervisionOfficer"
      | "expectMetricsPopulated"
      | "expectOfficerPopulated"
      | "expectSupervisorPopulated"
      | "expectOutlierDataPopulated"
    >(
      this,
      {
        populateMethods: true,
        expectPopulated: true,
        trackStaffPageViewed: true,
        trackMetricViewed: true,
        officerExternalId: true,
        outlierOfficerData: true,
        defaultMetricId: true,
        metricId: true,
        currentMetricIndex: true,
        metricInfo: true,
        supervisorsInfo: true,
        userCanAccessAllSupervisors: true,
        goToSupervisorInfo: true,
        methodologyUrl: true,
        labels: true,
        timePeriod: true,
        areCaseloadTypeBreakdownsEnabled: true,
        populateSupervisionOfficer: true,
        hydrate: true,
        hydrationState: true,
        officerPseudoId: true,
        expectMetricsPopulated: true,
        expectOfficerPopulated: true,
        expectSupervisorPopulated: true,
        expectOutlierDataPopulated: true,
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

  trackMetricViewed(metricId: string): void {
    const { userPseudoId } =
      this.supervisionStore.insightsStore.rootStore.userStore;

    this.supervisionStore.insightsStore.rootStore.analyticsStore.trackInsightsStaffMetricViewed(
      {
        staffPseudonymizedId: this.officerPseudoId,
        supervisorPseudonymizedId: this.goToSupervisorInfo?.pseudonymizedId,
        viewedBy: userPseudoId,
        metricId,
      },
    );
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
    if (!metricId || !this.supervisionStore.metricConfigsById) return;
    return this.supervisionStore.metricConfigsById.get(metricId);
  }

  get ctaText() {
    const { labels, isInsightsLanternState } = this;
    return {
      insightsLanternStateCaseLearnMore: `${isInsightsLanternState ? `Click on a ${labels.supervisionJiiLabel} to see more information about this case, such as how long they had been with this ${labels.supervisionOfficerLabel} and more.` : ``}`,
    };
  }

  get isInsightsLanternState(): boolean {
    return this.supervisionStore.isInsightsLanternState;
  }

  protected *populateSupervisionOfficer(): FlowMethod<
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
}
