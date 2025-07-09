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

import { makeObservable } from "mobx";

import { SupervisionVitalsMetric, VitalsMetricId } from "~datatypes";
import { FlowMethod, HydratesFromSource } from "~hydration-utils";

import { JusticeInvolvedPerson, SupervisionTask } from "../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { InsightsAPI } from "../api/interface";
import { WithJusticeInvolvedPersonStore } from "../mixins/WithJusticeInvolvedPersonsPresenterMixin";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionOfficerPresenterBase } from "./SupervisionOfficerPresenterBase";
import { ConfigLabels, OfficerVitalsMetricDetail } from "./types";

/**
 * The `SupervisionOfficerVitalsPresenter` class is responsible for managing and presenting
 * data related to an officer's vitals metrics within the Recidiviz platform.
 * It handles data hydration, data aggregation, and user-specific contextual information.
 */
export class SupervisionOfficerVitalsPresenter extends WithJusticeInvolvedPersonStore(
  SupervisionOfficerPresenterBase,
) {
  // ==============================
  // Properties and Constructor
  // ==============================

  private fetchedOfficerVitalsMetrics?: SupervisionVitalsMetric[];

  private _selectedMetricId: string | undefined;

  constructor(
    protected supervisionStore: InsightsSupervisionStore,
    protected justiceInvolvedPersonStore: JusticeInvolvedPersonsStore,
    public officerPseudoId: string,
  ) {
    super(supervisionStore, officerPseudoId);
    this.justiceInvolvedPersonsStore = justiceInvolvedPersonStore;

    makeObservable<
      SupervisionOfficerVitalsPresenter,
      | "expectVitalsForOfficerPopulated"
      | "populateVitalsForOfficer"
      | "expectCaseloadPopulated"
      | "findClientsForOfficer"
      | "_selectedMetricId"
    >(this, {
      expectVitalsForOfficerPopulated: true,
      populateVitalsForOfficer: true,
      isDrilldownEnabled: true,
      expectCaseloadPopulated: true,
      findClientsForOfficer: true,
      vitalsMetricDetails: true,
      selectedMetricDetails: true,
      _selectedMetricId: true,
      setSelectedMetricId: true,
    });

    this.personFieldsToHydrate = ["supervisionTasks"];

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        this.expectVitalsForOfficerPopulated,
        () =>
          this.isDrilldownEnabled &&
          this.expectCaseloadPopulated(this.officerExternalId),
      ],
      populate: async () => {
        await this.populateSupervisionOfficer();
        await this.populateVitalsForOfficer();
        if (this.officerExternalId && this.isDrilldownEnabled) {
          await this.populateCaseloadForOfficer(this.officerExternalId);
        }
      },
    });
    this.hydrator.isIgnored = this.supervisionStore.isUserEnriched;
  }

  get clients(): JusticeInvolvedPerson[] | undefined {
    if (!this.officerExternalId) return undefined;
    return this.findClientsForOfficer(this.officerExternalId);
  }

  /**
   * Passthrough to the supervision store
   * Checks if Vitals is enabled based on user permissions.
   * @returns `true` if vitals is enabled, otherwise `false`.
   */
  get isVitalsEnabled() {
    return this.supervisionStore.isVitalsEnabled;
  }

  // ==============================
  // Component specific logic
  // ==============================

  get officerVitalsMetrics() {
    return (
      this.supervisionStore.officerVitalsMetrics ??
      this.fetchedOfficerVitalsMetrics
    );
  }

  get vitalsMetricDetails(): OfficerVitalsMetricDetail[] {
    const metrics = this.officerVitalsMetrics;
    if (!metrics) return [];

    return metrics.flatMap((metric) =>
      metric.vitalsMetrics.length > 0 ? [this.detailsForMetric(metric)] : [],
    );
  }

  private detailsForMetric(
    metric: SupervisionVitalsMetric,
  ): OfficerVitalsMetricDetail {
    const { bodyDisplayName, titleDisplayName } =
      this.supervisionStore.getVitalsMetricConfig(metric.metricId);
    return {
      metricId: metric.metricId,
      bodyDisplayName,
      titleDisplayName,
      tasks: this.getTasksForMetric(metric.metricId),
      // The vitalsMetrics array will have one entry for officers
      ...metric.vitalsMetrics[0],
    };
  }

  get isDrilldownEnabled(): boolean {
    return !!this.supervisionStore.insightsStore.rootStore.userStore
      .activeFeatureVariants.operationsDrilldown;
  }

  private getTasksForMetric(metricId: VitalsMetricId): SupervisionTask[] {
    if (!this.officerExternalId) return [];
    const clients = this.findClientsForOfficer(this.officerExternalId) ?? [];
    return clients.flatMap((client) => {
      const tasks = client.supervisionTasks?.tasks ?? [];
      return tasks.filter((task) => task.vitalsMetricId === metricId);
    });
  }

  get selectedMetricDetails(): OfficerVitalsMetricDetail | undefined {
    if (!this._selectedMetricId) return undefined;
    const metric = this.officerVitalsMetrics?.find(
      (m) => m.metricId === this._selectedMetricId,
    );
    if (!metric) return undefined;
    return this.detailsForMetric(metric);
  }

  setSelectedMetricId(metricId?: string): void {
    this._selectedMetricId = metricId;
  }

  // ==============================
  // Hydration and Initialization
  // ==============================

  /**
   * Fetch vitals metrics for current officer.
   */
  *populateVitalsForOfficer(): FlowMethod<
    InsightsAPI["vitalsForOfficer"],
    void
  > {
    this.fetchedOfficerVitalsMetrics =
      yield this.supervisionStore.insightsStore.apiClient.vitalsForOfficer(
        this.officerPseudoId,
      );
  }

  private expectVitalsForOfficerPopulated() {
    if (!this.officerVitalsMetrics)
      throw new Error(
        `Failed to populate vitals metrics for officer ${this.officerPseudoId}`,
      );
  }

  get labels(): ConfigLabels {
    return this.supervisionStore.labels;
  }
}
