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

import { SupervisionVitalsMetric } from "~datatypes";
import { FlowMethod, HydratesFromSource } from "~hydration-utils";

import {
  JusticeInvolvedPerson,
  SupervisionTask,
  SupervisionTaskType,
} from "../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { InsightsAPI } from "../api/interface";
import { WithJusticeInvolvedPersonStore } from "../mixins/WithJusticeInvolvedPersonsPresenterMixin";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionOfficerPresenterBase } from "./SupervisionOfficerPresenterBase";
import { OfficerVitalsMetricDetail } from "./types";
import { labelForVitalsMetricId } from "./utils";

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
    >(this, {
      expectVitalsForOfficerPopulated: true,
      populateVitalsForOfficer: true,
      isDrilldownEnabled: true,
      expectCaseloadPopulated: true,
      findClientsForOfficer: true,
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

    const formattedMetrics: OfficerVitalsMetricDetail[] = [];
    metrics.forEach((metric) => {
      if (metric.vitalsMetrics.length === 0) return;
      formattedMetrics.push({
        label: labelForVitalsMetricId(
          metric.metricId,
          this.supervisionStore.vitalsMetricsConfig,
        ),
        tasks: this.getTasksOfType(this.taskTypeMapping[metric.metricId]),
        // The vitalsMetrics array will have one entry for officers
        ...metric.vitalsMetrics[0],
      });
    });
    return formattedMetrics;
  }

  private get taskTypeMapping() {
    const tasks =
      this.supervisionStore.insightsStore.rootStore.tenantStore
        .tasksConfiguration?.tasks ?? {};
    return Object.fromEntries(
      Object.entries(tasks).flatMap(([taskName, { vitalsMetricId }]) =>
        vitalsMetricId
          ? [[vitalsMetricId, taskName as SupervisionTaskType]]
          : [],
      ),
    );
  }

  get isDrilldownEnabled() {
    const { operationsDrilldown } =
      this.supervisionStore.insightsStore.rootStore.userStore
        .activeFeatureVariants;
    return operationsDrilldown && Object.keys(this.taskTypeMapping).length > 0;
  }

  private getTasksOfType(
    taskType?: SupervisionTaskType,
  ): SupervisionTask[] | undefined {
    if (!taskType) return undefined;
    if (!this.officerExternalId) return undefined;
    const clients = this.findClientsForOfficer(this.officerExternalId) ?? [];
    return clients.flatMap((client) => {
      const tasks = client.supervisionTasks?.tasks ?? [];
      return tasks.filter((task) => task.type === taskType);
    });
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
}
