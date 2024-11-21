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

import { Hydratable, HydratesFromSource } from "~hydration-utils";

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

  private hydrator: HydratesFromSource;

  constructor(
    protected supervisionStore: InsightsSupervisionStore,
    public officerPseudoId: string,
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

  get vitalsMetricDetails(): OfficerVitalsMetricDetail[] {
    const metrics = this.supervisionStore.vitalsMetricsByPseudoId.get(
      this.officerPseudoId,
    );
    if (!metrics) return [];

    return metrics.map((metric) => {
      return {
        label: labelForVitalsMetricId(metric.metricId),
        // The vitalsMetrics array will have one entry for officers
        ...metric.vitalsMetrics[0],
      };
    });
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
        this.supervisionStore.populateVitalsForOfficer(this.officerPseudoId),
      ),
    ];
  }

  /**
   * Returns an array of expectations for whether the necessary data has been populated.
   */
  expectPopulated() {
    return [this.expectVitalsForOfficerPopulated];
  }

  private expectVitalsForOfficerPopulated() {
    if (
      !this.supervisionStore.vitalsMetricsByPseudoId.get(this.officerPseudoId)
    )
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
