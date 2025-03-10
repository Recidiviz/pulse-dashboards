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

import { SupervisionVitalsMetric } from "~datatypes";
import { FlowMethod, Hydratable, HydratesFromSource } from "~hydration-utils";

import { InsightsAPI } from "../api/interface";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { OfficerVitalsMetricDetail } from "./types";
import { labelForVitalsMetricId } from "./utils";

/**
 * The `SupervisionOfficerVitalsPresenter` class is responsible for managing and presenting
 * data related to an officer's vitals metrics within the Recidiviz platform.
 * It handles data hydration, data aggregation, and user-specific contextual information.
 */
export class SupervisionOfficerVitalsPresenter implements Hydratable {
  // ==============================
  // Properties and Constructor
  // ==============================

  private fetchedOfficerVitalsMetrics?: SupervisionVitalsMetric[];
  private hydrator: HydratesFromSource;

  constructor(
    protected supervisionStore: InsightsSupervisionStore,
    public officerPseudoId: string,
  ) {
    makeAutoObservable(
      this,
      { vitalsMetricDetails: false },
      { autoBind: true },
    );

    this.hydrator = new HydratesFromSource({
      expectPopulated: this.expectPopulated(),
      populate: async () => {
        await Promise.all(this.populateMethods());
      },
    });
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
        // The vitalsMetrics array will have one entry for officers
        ...metric.vitalsMetrics[0],
      });
    });
    return formattedMetrics;
  }

  // ==============================
  // Hydration and Initialization
  // ==============================

  /**
   * Returns an array of promises representing the methods required to populate
   * the necessary data for this presenter.
   */
  populateMethods() {
    return [flowResult(this.populateVitalsForOfficer())];
  }

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

  /**
   * Returns an array of expectations for whether the necessary data has been populated.
   */
  expectPopulated() {
    return [this.expectVitalsForOfficerPopulated];
  }

  private expectVitalsForOfficerPopulated() {
    if (!this.officerVitalsMetrics)
      throw new Error(
        `Failed to populate vitals metrics for officer ${this.officerPseudoId}`,
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
