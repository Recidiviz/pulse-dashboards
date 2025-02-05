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

import { ascending } from "d3-array";
import { flowResult, makeAutoObservable } from "mobx";

import { SupervisionOfficer, VitalsMetricForOfficer } from "~datatypes";
import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import {
  SupervisorVitalsMetricDetail,
  VitalsMetricDetailForOfficer,
} from "./types";
import { labelForVitalsMetricId } from "./utils";

/**
 * The `SupervisionSupervisorVitalsPresenter` class is responsible for managing and presenting
 * data related to a supervisor's officers' vitals metrics within the Recidiviz platform.
 * It handles data hydration, data aggregation, and user-specific contextual information.
 */
export class SupervisionSupervisorVitalsPresenter implements Hydratable {
  // ==============================
  // Properties and Constructor
  // ==============================

  private hydrator: HydratesFromSource;

  constructor(
    protected supervisionStore: InsightsSupervisionStore,
    public supervisorPseudoId: string,
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

  mergeOfficerNames(
    metrics: VitalsMetricForOfficer[],
  ): VitalsMetricDetailForOfficer[] {
    const metricDetails: VitalsMetricDetailForOfficer[] = [];
    metrics.forEach((metric) => {
      const displayName = this.allOfficers.find(
        (o) => o.pseudonymizedId === metric.officerPseudonymizedId,
      )?.displayName;
      if (displayName)
        metricDetails.push({
          ...metric,
          displayName,
        });
    });
    return metricDetails;
  }

  get vitalsMetricsMethodologyUrl() {
    return this.supervisionStore.labels.vitalsMetricsMethodologyUrl;
  }

  get vitalsMetricDetails(): SupervisorVitalsMetricDetail[] {
    const metrics = this.supervisionStore.vitalsMetricsByPseudoId.get(
      this.supervisorPseudoId,
    );

    if (!metrics) return [];

    return metrics.map((metric) => {
      const sortedMetrics = [...metric.vitalsMetrics].sort((a, b) =>
        ascending(a.metricValue, b.metricValue),
      );
      return {
        label: labelForVitalsMetricId(
          metric.metricId,
          this.supervisionStore.vitalsMetricsConfig,
        ),
        officersWithMetricValues: this.mergeOfficerNames(sortedMetrics),
      };
    });
  }

  // TODO #6617 - the next method along with their expectPopulated methods will move
  // to SupervisionSupervisorPagePresenter during the refactor so the redundancy will be removed.
  /**
   * Returns all officers, both included and excluded, under this supervisor.
   * @returns An array of `SupervisionOfficer` (empty if data is not available).
   */
  get allOfficers(): SupervisionOfficer[] {
    return (
      this.supervisionStore.officersBySupervisorPseudoId.get(
        this.supervisorPseudoId,
      ) ?? []
    );
  }

  // ==============================
  // Hydration and Initialization
  // ==============================

  /**
   * Returns an array of promises representing the methods required to populate
   * the necessary data for this presenter.
   */
  populateMethods() {
    return [
      flowResult(
        this.supervisionStore.populateVitalsForSupervisor(
          this.supervisorPseudoId,
        ),
      ),
      flowResult(
        this.supervisionStore.populateOfficersForSupervisor(
          this.supervisorPseudoId,
        ),
      ),
    ];
  }

  /**
   * Returns an array of expectations for whether the necessary data has been populated.
   */
  expectPopulated() {
    return [
      this.expectVitalsForSupervisorPopulated,
      this.expectOfficersPopulated,
    ];
  }

  private expectVitalsForSupervisorPopulated() {
    if (
      !this.supervisionStore.vitalsMetricsByPseudoId.get(
        this.supervisorPseudoId,
      )
    )
      throw new Error(
        `Failed to populate vitals metrics for supervisor ${this.supervisorPseudoId}`,
      );
  }

  /**
   * Asserts that all officers have been populated.
   * @throws An error if all officers are not populated.
   */
  private expectOfficersPopulated() {
    if (
      !this.supervisionStore.officersBySupervisorPseudoId.has(
        this.supervisorPseudoId,
      )
    )
      throw new Error("failed to populate officers");
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
