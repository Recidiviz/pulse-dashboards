// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { Hydratable } from "../../core/models/types";
import { castToError } from "../../utils/castToError";
import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { OutliersSupervisionStore } from "../stores/OutliersSupervisionStore";
import { ConfigLabels, OutlierOfficerData } from "./types";
import { getOutlierOfficerData } from "./utils";

export class SupervisionOfficersPresenter implements Hydratable {
  error?: Error | undefined;

  isLoading = false;

  constructor(
    private supervisionStore: OutliersSupervisionStore,
    public supervisorPseudoId: string
  ) {
    makeAutoObservable(this);
  }

  get isHydrated(): boolean {
    return (
      this.areMetricsHydrated &&
      this.areOfficersHydrated &&
      this.isSupervisorHydrated
    );
  }

  private get areMetricsHydrated() {
    return this.supervisionStore.metricConfigsById !== undefined;
  }

  private get areOfficersHydrated() {
    return this.supervisionStore.officersBySupervisorPseudoId.has(
      this.supervisorPseudoId
    );
  }

  private get isSupervisorHydrated() {
    return this.supervisorInfo !== undefined;
  }

  /**
   * Initiates hydration for all data needed within this presenter class
   */
  async hydrate(): Promise<void> {
    if (this.isHydrated) return;

    this.setIsLoading(true);
    this.setError(undefined);

    try {
      await Promise.all([
        flowResult(this.supervisionStore.hydrateMetricConfigs()),
        flowResult(
          this.supervisionStore.hydrateOfficersForSupervisor(
            this.supervisorPseudoId
          )
        ),
        flowResult(
          this.supervisionStore.hydrateSupervisionOfficerSupervisors()
        ),
      ]);

      const { supervisionOfficerSupervisors, officersBySupervisorPseudoId } =
        this.supervisionStore;
      if (
        supervisionOfficerSupervisors &&
        !supervisionOfficerSupervisors.find(
          (s) => s.pseudonymizedId === this.supervisorPseudoId
        )
      ) {
        throw new Error(
          `Data for supervisor ${this.supervisorPseudoId} is not available.`
        );
      }

      const officers = officersBySupervisorPseudoId.get(
        this.supervisorPseudoId
      );
      if (!officers || officers.length === 0) {
        throw new Error(
          `Supervisor ${this.supervisorPseudoId} does not have any assigned officers`
        );
      }
      this.setIsLoading(false);
    } catch (e) {
      this.setError(castToError(e));
      this.setIsLoading(false);
    }
  }

  setError(error: Error | undefined) {
    this.error = error;
  }

  setIsLoading(loadingValue: boolean) {
    this.isLoading = loadingValue;
  }

  get areCaseloadTypeBreakdownsEnabled() {
    return this.supervisionStore.areCaseloadTypeBreakdownsEnabled;
  }

  /**
   * Augments officer data with all necessary relationships fully hydrated.
   * It triggers an error state rather than returning a partial result, so that none of the UI
   * components that consume this data have to worry about parts of it being missing
   */
  get outlierOfficersData(): OutlierOfficerData[] | undefined {
    if (!this.areMetricsHydrated || !this.areOfficersHydrated) return;

    try {
      const outlierOfficers = this.supervisionStore.officersBySupervisorPseudoId
        .get(this.supervisorPseudoId)
        ?.filter((o) => o.outlierMetrics.length > 0)
        .map((o): OutlierOfficerData => {
          return getOutlierOfficerData(o, this.supervisionStore);
        });
      return outlierOfficers;
    } catch (e) {
      this.setError(castToError(e));
    }
  }

  /**
   * Provides information about the currently selected supervisor
   */
  get supervisorInfo(): SupervisionOfficerSupervisor | undefined {
    return this.supervisionStore.supervisionOfficerSupervisorByPseudoId(
      this.supervisorPseudoId
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
      this.supervisorPseudoId
    );
  }

  get supervisorIsCurrentUser() {
    return (
      !!this.supervisorPseudoId &&
      this.supervisorPseudoId ===
        this.supervisionStore.currentSupervisorUser?.pseudonymizedId
    );
  }

  get labels(): ConfigLabels {
    return this.supervisionStore.labels;
  }

  trackViewed(): void {
    const { userPseudoId } =
      this.supervisionStore.outliersStore.rootStore.userStore;
    this.supervisionStore.outliersStore.rootStore.analyticsStore.trackOutliersSupervisorPageViewed(
      {
        supervisorPseudonymizedId: this.supervisorPseudoId,
        viewedBy: userPseudoId,
      }
    );
  }
}
