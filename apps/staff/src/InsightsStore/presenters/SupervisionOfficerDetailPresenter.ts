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

import { makeObservable, override, runInAction } from "mobx";

import { MetricConfig } from "~datatypes";
import { HydratesFromSource } from "~hydration-utils";

import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { WithJusticeInvolvedPersonStore } from "../mixins/WithJusticeInvolvedPersonsPresenterMixin";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionOfficerOutcomesPresenter } from "./SupervisionOfficerOutcomesPresenter";

export class SupervisionOfficerDetailPresenter extends WithJusticeInvolvedPersonStore(
  SupervisionOfficerOutcomesPresenter,
) {
  constructor(
    supervisionStore: InsightsSupervisionStore,
    officerPseudoId: string,
    justiceInvolvedPersonStore: JusticeInvolvedPersonsStore,
  ) {
    super(supervisionStore, officerPseudoId);
    this.justiceInvolvedPersonsStore = justiceInvolvedPersonStore;

    makeObservable<
      SupervisionOfficerDetailPresenter,
      "populateSupervisionOfficer" | "populateCaseload"
    >(this, {
      trackMetricViewed: true,
      defaultMetricId: true,
      metricId: true,
      currentMetricIndex: true,
      metricInfo: true,
      ctaText: true,
      isInsightsLanternState: true,
      populateSupervisionOfficer: override,
      populateCaseload: true,
    });

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        ...this.expectPopulated(),
        ...this.expectOutcomesDependenciesPopulated(),
        () => this.expectCaseloadPopulated(this.officerExternalId),
      ],
      populate: async () => {
        await Promise.all([...this.populateMethods()]);
        // Follows the above method so we have the officer record hydrated.
        await this.populateSupervisionOfficerOutcomes();
        await this.populateCaseload();
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
    return this.officerOutcomesData?.outlierMetrics[0]?.metricId;
  }

  get metricId() {
    return this.supervisionStore.metricId;
  }

  get currentMetricIndex(): number {
    return (
      this.officerOutcomesData?.outlierMetrics.findIndex(
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

  get numClientsOnCaseload(): number | undefined {
    if (!this.officerExternalId) return undefined;
    return this.findClientsForOfficer(this.officerExternalId)?.length;
  }

  private async populateCaseload() {
    if (!this.isWorkflowsEnabled || !this.officerExternalId) return;
    await this.populateCaseloadForOfficer(this.officerExternalId);
  }

  // Overridden bound flow methods seem to produce mobx errors, so use regular actions here instead:
  // https://github.com/Recidiviz/pulse-dashboards/pull/7352#issuecomment-2655130415
  protected async populateSupervisionOfficer() {
    if (this.isOfficerPopulated) return;

    if (this.metricId) {
      // we can prefetch metric event data here also rather than waiting for the page to load,
      // saving an additional loading spinner in the events table UI
      this.supervisionStore.populateMetricEventsForOfficer(
        this.officerPseudoId,
        this.metricId,
      );
    }
    const officer =
      await this.supervisionStore.insightsStore.apiClient.supervisionOfficer(
        this.officerPseudoId,
      );
    runInAction(() => {
      this.fetchedOfficerRecord = officer;
    });
  }
}
