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

import { uniq } from "lodash/fp";
import { flowResult, makeAutoObservable } from "mobx";

import {
  castToError,
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { ConfigLabels, OutlierOfficerData } from "./types";
import { getOutlierOfficerData } from "./utils";

export class SupervisionSupervisorPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  constructor(
    private supervisionStore: InsightsSupervisionStore,
    public supervisorPseudoId: string,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrator = new HydratesFromSource({
      populate: async () => {
        await Promise.all([
          flowResult(this.supervisionStore.populateMetricConfigs()),
          flowResult(
            this.supervisionStore.populateOfficersForSupervisor(
              this.supervisorPseudoId,
            ),
          ),
          flowResult(
            this.supervisionStore.populateSupervisionOfficerSupervisors(),
          ),
        ]);
      },
      expectPopulated: [
        this.expectMetricsPopulated,
        this.expectOfficersPopulated,
        this.expectSupervisorPopulated,
        this.expectOutlierDataPopulated,
      ],
    });
  }

  /**
   * Augments officer data with all necessary relationships fully hydrated.
   * If this fails for any reason the value will instead be the error that was encountered.
   */
  private get outlierDataOrError(): OutlierOfficerData[] | Error {
    try {
      const officersData =
        this.supervisionStore.officersBySupervisorPseudoId.get(
          this.supervisorPseudoId,
        );

      // not expected in practice due to checks above, but needed for type safety
      if (!officersData) {
        throw new Error("Missing expected data for supervised officers");
      }

      return officersData
        .filter((o) => o.outlierMetrics.length > 0)
        .map((o): OutlierOfficerData => {
          return getOutlierOfficerData(o, this.supervisionStore);
        });
    } catch (e) {
      return castToError(e);
    }
  }

  /**
   * Provide outlier officers' data with all necessary relationships fully hydrated.
   */
  get outlierOfficersData(): OutlierOfficerData[] | undefined {
    if (this.outlierDataOrError instanceof Error) {
      return undefined;
    }
    return this.outlierDataOrError;
  }

  /**
   * Provides information about the currently selected supervisor
   */
  get supervisorInfo(): SupervisionOfficerSupervisor | undefined {
    return this.supervisionStore.supervisionOfficerSupervisorByPseudoId(
      this.supervisorPseudoId,
    );
  }

  /**
   * Provides string with current time period
   */
  get timePeriod(): string | undefined {
    return this.supervisionStore.benchmarksTimePeriod;
  }

  /**
   * Provides a list of all officers that are in this supervisor's unit
   */
  get allOfficers(): SupervisionOfficer[] | undefined {
    return this.supervisionStore.officersBySupervisorPseudoId.get(
      this.supervisorPseudoId,
    );
  }

  /**
   * Provide access to all configured metrics.
   */
  get metricConfigsById() {
    return this.supervisionStore.metricConfigsById;
  }

  get supervisorIsCurrentUser() {
    return (
      !!this.supervisorPseudoId &&
      this.supervisorPseudoId ===
        this.supervisionStore.currentSupervisorUser?.pseudonymizedId
    );
  }

  get userCanAccessAllSupervisors() {
    return this.supervisionStore.userCanAccessAllSupervisors;
  }

  get labels(): ConfigLabels {
    return this.supervisionStore.labels;
  }

  /**
   * Return all outlier officers of this supervisor, grouped by metricId
   */
  get outlierOfficersByMetric(): {
    metricId: string;
    officersForMetric: OutlierOfficerData[];
  }[] {
    const metricsWithOutliers = uniq(
      this.outlierOfficersData?.flatMap((o) =>
        o.outlierMetrics.map((om) => om.metricId),
      ),
    );

    return metricsWithOutliers.map((m) => {
      const officersForMetric =
        this.outlierOfficersData?.filter((o) =>
          o.outlierMetrics.map((om) => om.metricId).includes(m),
        ) || []; // Empty array should never happen but makes for simpler typing.
      return {
        metricId: m,
        officersForMetric,
      };
    });
  }

  private expectMetricsPopulated() {
    if (this.supervisionStore.metricConfigsById === undefined)
      throw new Error("Failed to populate metrics");
  }

  private expectOfficersPopulated() {
    if (
      !this.supervisionStore.officersBySupervisorPseudoId.has(
        this.supervisorPseudoId,
      )
    )
      throw new Error("failed to populate officers");
  }

  private expectSupervisorPopulated() {
    if (!this.supervisorInfo) throw new Error("failed to populate supervisor");
  }

  private expectOutlierDataPopulated() {
    if (this.outlierDataOrError instanceof Error) throw this.outlierDataOrError;
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
}
