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

import { uniq } from "lodash";
import { flowResult, makeObservable, override } from "mobx";

import { MetricConfig, SupervisionOfficer } from "~datatypes";
import { FlowMethod, HydratesFromSource } from "~hydration-utils";

import { InsightsAPI } from "../api/interface";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionOfficerPresenterBase } from "./SupervisionOfficerPresenterBase";
import { getLocationWithoutLabel } from "./utils";

export class SupervisionOfficerDetailPresenter extends SupervisionOfficerPresenterBase<SupervisionOfficer> {
  constructor(
    supervisionStore: InsightsSupervisionStore,
    officerPseudoId: string,
  ) {
    super(supervisionStore, officerPseudoId);

    makeObservable<
      SupervisionOfficerDetailPresenter,
      "populateSupervisionOfficer"
    >(this, {
      trackMetricViewed: true,
      defaultMetricId: true,
      metricId: true,
      currentMetricIndex: true,
      metricInfo: true,
      ctaText: true,
      isInsightsLanternState: true,
      populateSupervisionOfficer: override,
      supervisionLocationInfo: true,
    });

    this.hydrator = new HydratesFromSource({
      expectPopulated: this.expectPopulated(),
      populate: async () => {
        await Promise.all([...this.populateMethods()]);
        // Follows the above method so we have the officer record hydrated.
        await flowResult(this.populateSupervisionOfficerOutcomes());
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

  supervisionLocationInfo(): {
    locationLabel: string;
    supervisionLocation?: string | null;
  } {
    const {
      tenantStore: { insightsUnitState },
    } = this.supervisionStore.insightsStore.rootStore;
    const locationLabel = insightsUnitState
      ? this.labels.supervisionUnitLabel
      : this.labels.supervisionDistrictLabel;
    const locations = uniq(
      this.supervisorsInfo?.map((s) =>
        insightsUnitState ? s.supervisionUnit : s.supervisionDistrict,
      ),
    );
    if (locations.length > 1)
      throw new Error("Supervisors have different supervision locations");
    const supervisionLocation = getLocationWithoutLabel(
      locations[0],
      locationLabel,
    );
    return {
      locationLabel,
      supervisionLocation,
    };
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
