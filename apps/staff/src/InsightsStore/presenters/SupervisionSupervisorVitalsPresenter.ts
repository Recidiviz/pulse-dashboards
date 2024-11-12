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

import {
  ExcludedSupervisionOfficer,
  SupervisionOfficer,
  VITALS_METRIC_IDS,
  VitalsMetricForOfficer,
} from "~datatypes";
import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import {
  SupervisorVitalsMetricDetail,
  VitalsMetricDetailForOfficer,
} from "./types";

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
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrator = new HydratesFromSource({
      expectPopulated: this.expectPopulated(),
      populate: async () => {
        await Promise.all(this.populateMethods());
      },
    });
  }

  // ==============================
  // Component specific logic
  // ==============================

  mergeOfficerNames(
    metrics: VitalsMetricForOfficer[],
  ): VitalsMetricDetailForOfficer[] {
    return metrics
      .map((metric) => {
        const displayName = this.allOfficers.find(
          (o) => o.pseudonymizedId === metric.officerPseudonymizedId,
        )?.displayName;
        return {
          ...metric,
          displayName,
        };
      })
      .filter((m) => m.displayName);
  }

  get vitalsMetricDetails(): SupervisorVitalsMetricDetail[] {
    const metrics = this.supervisionStore.vitalsMetricsBySupervisorPseudoId.get(
      this.supervisorPseudoId,
    );
    if (!metrics) return [];

    return metrics.map((metric) => {
      return {
        label: this.labelForMetricId(metric.metricId),
        officersWithMetricValues: this.mergeOfficerNames(metric.vitalsMetrics),
      };
    });
  }

  // TODO #34616 Use Label from config once it is ready
  labelForMetricId(metricId: string): string {
    return metricId === VITALS_METRIC_IDS.enum.timely_contact
      ? "F2F Contact"
      : "Timely Risk Assessment";
  }

  // TODO #6617 - the next three methods along with their expectPopulated methods will move
  // to SupervisionSupervisorPagePresenter during the refactor so the redundancy will be removed.
  /**
   * Combines and returns all officers, both included and excluded, under this supervisor.
   * @returns An array of `SupervisionOfficer` and `ExcludedSupervisionOfficer`, or `undefined`.
   */
  get allOfficers(): (SupervisionOfficer | ExcludedSupervisionOfficer)[] {
    return [
      ...(this.officersWithOutliersData || []),
      ...(this.excludedOfficers || []),
    ];
  }

  /**
   * Provides a list of all officers in this supervisor's unit that were not
   * explicitly excluded from outcomes.
   * @returns An array of `SupervisionOfficer` or `undefined` if data is not available.
   */
  get officersWithOutliersData(): SupervisionOfficer[] | undefined {
    return this.supervisionStore.officersBySupervisorPseudoId.get(
      this.supervisorPseudoId,
    );
  }

  /**
   * Provides a list of all officers excluded from outcomes in this supervisor's unit.
   * @returns An array of `ExcludedSupervisionOfficer` or `undefined` if data is not available.
   */
  get excludedOfficers(): ExcludedSupervisionOfficer[] | undefined {
    return this.supervisionStore.excludedOfficersBySupervisorPseudoId.get(
      this.supervisorPseudoId,
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
      flowResult(
        this.supervisionStore.populateExcludedOfficersForSupervisor(
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
      this.expectOfficersWithOutliersPopulated,
      this.expectExcludedOfficersPopulated,
    ];
  }

  private expectVitalsForSupervisorPopulated() {
    if (
      !this.supervisionStore.vitalsMetricsBySupervisorPseudoId.get(
        this.supervisorPseudoId,
      )
    )
      throw new Error(
        `Failed to populate vitals metrics for supervisor ${this.supervisorPseudoId}`,
      );
  }

  /**
   * Asserts that officers with outliers have been populated.
   * @throws An error if officers with outliers are not populated.
   */
  private expectOfficersWithOutliersPopulated() {
    if (
      !this.supervisionStore.officersBySupervisorPseudoId.has(
        this.supervisorPseudoId,
      )
    )
      throw new Error("failed to populate officers with outliers");
  }

  /**
   * Asserts that excluded officers have been populated.
   * @throws An error if excluded officers are not populated.
   */
  private expectExcludedOfficersPopulated() {
    if (
      !this.supervisionStore.excludedOfficersBySupervisorPseudoId.has(
        this.supervisorPseudoId,
      )
    )
      throw new Error("failed to populate excluded officers");
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
