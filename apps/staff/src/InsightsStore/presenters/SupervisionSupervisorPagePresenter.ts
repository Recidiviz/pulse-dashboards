// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { SupervisionOfficer, SupervisionOfficerSupervisor } from "~datatypes";
import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { HighlightedOfficersDetail } from "./types";
import { getHighlightedOfficersByMetric } from "./utils";

export class SupervisionSupervisorPagePresenter implements Hydratable {
  protected hydrator: HydratesFromSource;

  constructor(
    protected supervisionStore: InsightsSupervisionStore,
    public supervisorPseudoId: string,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.hydrator = new HydratesFromSource({
      populate: async () => {
        await Promise.all([...this.populateMethods()]);
      },
      expectPopulated: this.expectPopulated(),
    });
  }

  get isWorkflowsEnabled() {
    const { userStore } = this.supervisionStore.insightsStore.rootStore;

    // Check if...
    return (
      // ...the user has allowed navigation to workflows and...
      userStore.getRoutePermission("workflowsSupervision") &&
      // ...if the active feature variant for supervisorHomepageWorkflows is enabled.
      !!userStore.activeFeatureVariants.supervisorHomepageWorkflows
    );
  }

  get isVitalsEnabled() {
    return this.supervisionStore.isVitalsEnabled;
  }

  /**
   * Returns an array of promises representing the methods required to populate
   * the necessary data for this presenter.
   */
  populateMethods() {
    return [
      flowResult(
        this.supervisionStore.populateOfficersForSupervisor(
          this.supervisorPseudoId,
        ),
      ),
      flowResult(this.supervisionStore.populateSupervisionOfficerSupervisors()),
    ];
  }

  /**
   * Returns an array of expectations for whether the necessary data has been populated.
   */
  expectPopulated() {
    return [this.expectOfficersPopulated, this.expectSupervisorPopulated];
  }

  get pageTitle() {
    return `${this.supervisorInfo?.displayName} Overview`;
  }

  get labels() {
    return this.supervisionStore.labels;
  }

  /**
   * Provides a string with the current time period.
   * @returns The time period string or `undefined` if not available.
   */
  get timePeriod(): string | undefined {
    return this.supervisionStore.benchmarksTimePeriod;
  }

  /**
   * Checks if the current user has access to all supervisors.
   * @returns `true` if the user can access all supervisors, `false` otherwise.
   */
  get userCanAccessAllSupervisors() {
    return this.supervisionStore.userCanAccessAllSupervisors;
  }

  /**
   * Provides a list of all officers excluded from outcomes in this supervisor's unit.
   * @returns An array of `SupervisionOfficer` or `undefined` if data is not available.
   */
  get officersIncludedInOutcomes(): SupervisionOfficer[] | undefined {
    return this.supervisionStore.officersBySupervisorPseudoId
      .get(this.supervisorPseudoId)
      ?.filter((o) => o.includeInOutcomes === true);
  }

  /**
   * Combines and returns all officers, both included and excluded, under this supervisor.
   * @returns An array of `SupervisionOfficer` (empty if data not available).
   */
  get allOfficers(): SupervisionOfficer[] {
    return (
      this.supervisionStore.officersBySupervisorPseudoId.get(
        this.supervisorPseudoId,
      ) ?? []
    );
  }

  /**
   * Provides a list of all officers excluded from outcomes in this supervisor's unit.
   * @returns An array of `SupervisionOfficer` or `undefined` if data is not available.
   */
  get officersExcludedFromOutcomes(): SupervisionOfficer[] | undefined {
    return this.supervisionStore.officersBySupervisorPseudoId
      .get(this.supervisorPseudoId)
      ?.filter((o) => o.includeInOutcomes !== true);
  }

  /**
   * Returns officers of this supervisor in the top X percent of officers in the state,
   * grouped by metric.
   * @returns An array of objects containing the metric, top X percent criteria, and info about
   * officers meeting the top X percent criteria.
   */
  get highlightedOfficersByMetric(): HighlightedOfficersDetail[] {
    return getHighlightedOfficersByMetric(
      this.supervisionStore.metricConfigsById,
      this.officersIncludedInOutcomes,
      this.supervisionStore.officersOutcomesBySupervisorPseudoId.get(
        this.supervisorPseudoId,
      ),
    );
  }

  /**
   * Provides information about the currently selected supervisor.
   * @returns The supervisor record, or `undefined` if not yet fetched.
   */
  get supervisorInfo(): SupervisionOfficerSupervisor | undefined {
    return this.supervisionStore.supervisorInfo(this.supervisorPseudoId);
  }

  /**
   * Provides information about the currently selected supervisor's
   * supervision location, whether it is by unit or by district
   */
  get supervisionLocationInfo(): {
    locationLabel: string;
    supervisionLocationForListPage?: string | null;
    supervisionLocationForSupervisorPage?: string | null;
  } {
    return this.supervisionStore.supervisionLocationInfo(
      this.supervisorPseudoId,
    );
  }

  /**
   * Tracks the event when a supervisor's page is viewed by the user.
   */
  trackViewed(): void {
    const { userPseudoId } =
      this.supervisionStore.insightsStore.rootStore.userStore;
    this.supervisionStore.insightsStore.rootStore.analyticsStore.trackInsightsSupervisorPageViewed(
      {
        supervisorPseudonymizedId: this.supervisorPseudoId,
        viewedBy: userPseudoId,
      },
    );
  }

  private expectOfficersPopulated() {
    if (
      !this.supervisionStore.officersBySupervisorPseudoId.has(
        this.supervisorPseudoId,
      )
    )
      throw new Error("failed to populate officers with outliers");
  }

  /**
   * Asserts that supervisor data has been populated.
   * @throws An error if supervisor data is not populated.
   */
  private expectSupervisorPopulated() {
    if (!this.supervisorInfo) throw new Error("failed to populate supervisor");
  }

  /**
   * Initiates hydration for all data needed within this presenter class
   */
  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }
}
