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
  ActionStrategyCopy,
  SupervisionOfficer,
  SupervisionOfficerOutcomes,
  SupervisionOfficerSupervisor,
} from "~datatypes";
import {
  castToError,
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import {
  ConfigLabels,
  HighlightedOfficersDetail,
  OfficerOutcomesData,
} from "./types";
import {
  getHighlightedOfficersByMetric,
  getOfficerOutcomesData,
} from "./utils";

/***
 * The SupervisionOfficersPresenter is the presenter for the v1 insights
 * supervisor page.
 */
export class SupervisionOfficersPresenter implements Hydratable {
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
          flowResult(
            this.supervisionStore.populateOutcomesForSupervisor(
              this.supervisorPseudoId,
            ),
          ),
        ]);
      },
      expectPopulated: [
        this.expectMetricsPopulated,
        this.expectOfficersPopulated,
        this.expectSupervisorPopulated,
        this.expectOutlierDataPopulated,
        this.expectOfficerOutcomesPopulated,
      ],
    });
  }

  private hydrator: HydratesFromSource;

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  private expectMetricsPopulated() {
    if (this.supervisionStore.metricConfigsById === undefined)
      throw new Error("Failed to populate metrics");
  }

  private expectOfficersPopulated() {
    if (!this.allOfficers?.length)
      throw new Error("failed to populate officers");
  }

  private expectOfficerOutcomesPopulated() {
    if (!this.officerOutcomes?.length)
      throw new Error("failed to populate officers' outcomes");
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

  get areCaseloadCategoryBreakdownsEnabled() {
    return this.supervisionStore.areCaseloadCategoryBreakdownsEnabled;
  }

  /**
   * The list of outlier officers with outcomes data. Augments officer data with all necessary
   * relationships fully hydrated. If this fails for any reason the value will instead
   * be the error that was encountered, useful mainly for debugging.
   */
  private get outlierDataOrError(): OfficerOutcomesData[] | Error {
    try {
      // not expected in practice due to checks above, but needed for type safety
      if (!this.officerOutcomes?.length) {
        throw new Error(
          "Missing expected outcomes data for supervised officers",
        );
      }

      return this.officerOutcomes
        .filter((outcomes) => outcomes.outlierMetrics.length > 0)
        .map((outcomes): OfficerOutcomesData => {
          const officer = this.allOfficers?.find(
            (officer) => officer.pseudonymizedId === outcomes.pseudonymizedId,
          );
          if (!officer) {
            throw new Error(
              `No officer with outcomes data found for pseudo id: [${outcomes.pseudonymizedId}]`,
            );
          }
          return getOfficerOutcomesData(
            officer,
            this.supervisionStore,
            outcomes,
          );
        });
    } catch (e) {
      return castToError(e);
    }
  }

  /**
   * The list of outlier officers with outcomes data. Augments officer data with all
   * necessary relationships fully hydrated.
   */
  get outlierOfficersData(): OfficerOutcomesData[] | undefined {
    if (this.outlierDataOrError instanceof Error) {
      return undefined;
    }
    return this.outlierDataOrError;
  }

  get actionStrategyCopy(): ActionStrategyCopy[string] | undefined {
    return this.supervisionStore.getActionStrategyCopy(this.supervisorPseudoId);
  }

  disableSurfaceActionStrategies(): void {
    this.supervisionStore.disableSurfaceActionStrategies();
  }

  setUserHasSeenActionStrategy(): void {
    this.supervisionStore.setUserHasSeenActionStrategy(this.supervisorPseudoId);
  }

  /**
   * Provides information about the currently selected supervisor
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
    supervisionLocation?: string | null;
  } {
    return this.supervisionStore.supervisionLocationInfo(
      this.supervisorPseudoId,
    );
  }

  /**
   * Provides string with current time period
   */
  get timePeriod(): string | undefined {
    return this.supervisionStore?.benchmarksTimePeriod;
  }

  /**
   * Provides a list of all officers that are in this supervisor's unit
   */
  get allOfficers(): SupervisionOfficer[] | undefined {
    return this.supervisionStore?.officersBySupervisorPseudoId.get(
      this.supervisorPseudoId,
    );
  }

  /**
   * Provides a list of all officer outcomes from this supervisor's unit
   */
  private get officerOutcomes(): SupervisionOfficerOutcomes[] | undefined {
    return this.supervisionStore?.officersOutcomesBySupervisorPseudoId.get(
      this.supervisorPseudoId,
    );
  }

  get supervisorIsCurrentUser() {
    return this.supervisionStore?.supervisorIsCurrentUser;
  }

  /**
   * Provides a list of outcome types are present on the page for the supervisor.
   */
  get outcomeTypes(): ("FAVORABLE" | "ADVERSE")[] {
    return (
      uniq(
        this.outlierOfficersData
          ?.map((d) => {
            return d.outlierMetrics.map((m) => m.config.outcomeType);
          })
          .flat(),
      ) || []
    );
  }

  get userCanAccessAllSupervisors() {
    return this.supervisionStore.userCanAccessAllSupervisors;
  }

  get labels(): ConfigLabels {
    return this.supervisionStore.labels;
  }

  get highlightedOfficersByMetric(): HighlightedOfficersDetail[] {
    return getHighlightedOfficersByMetric(
      this.supervisionStore.metricConfigsById,
      this.allOfficers,
      this.officerOutcomes,
    );
  }

  get isInsightsLanternState(): boolean {
    return this.supervisionStore.isInsightsLanternState;
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
