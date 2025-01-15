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
import { computed, flowResult, makeAutoObservable } from "mobx";

import {
  ExcludedSupervisionOfficer,
  SupervisionOfficer,
  VitalsMetricForOfficer,
} from "~datatypes";
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
      { vitalsMetricDetails: computed },
      { autoBind: true },
    );

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
        label: labelForVitalsMetricId(metric.metricId),
        officersWithMetricValues: this.mergeOfficerNames(sortedMetrics),
      };
    });
  }

  // TODO(#6453) - you don't need any of the bottom two in this presenter.
  // TODO #6617 - the next three methods along with their expectPopulated methods will move
  // to SupervisionSupervisorPagePresenter during the refactor so the redundancy will be removed.
  /**
   * Combines and returns all officers, both included and excluded, under this supervisor.
   * @returns An array of `SupervisionOfficer` and `ExcludedSupervisionOfficer`, or `undefined`.
   */
  get allOfficers(): (SupervisionOfficer | ExcludedSupervisionOfficer)[] {
    return [
      ...(this.officersWithOutcomesData || []),
      ...(this.excludedOfficers || []),
    ];
  }

  /**
   * Provides a list of all officers in this supervisor's unit that were not
   * explicitly excluded from outcomes.
   * @returns An array of `SupervisionOfficer` or `undefined` if data is not available.
   */
  get officersWithOutcomesData(): SupervisionOfficer[] | undefined {
    return this.supervisionStore.officersBySupervisorPseudoId
      .get(this.supervisorPseudoId)
      ?.filter((o) => o.includeInOutcomes === true);
  }

  // TODO(#6453): this should look at and filter officersBySupervisorPseudoId
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
      this.expectOfficersWithOutcomesPopulated,
      this.expectExcludedOfficersPopulated,
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
   * Asserts that officers with outcomes have been populated.
   * @throws An error if officers with outcomes are not populated.
   */
  private expectOfficersWithOutcomesPopulated() {
    if (
      !this.supervisionStore.officersBySupervisorPseudoId.has(
        this.supervisorPseudoId,
      )
    )
      throw new Error("failed to populate officers with outcomes");
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
