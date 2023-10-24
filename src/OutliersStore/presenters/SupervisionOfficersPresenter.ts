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
import { getOutlierOfficerData } from "./getOutlierOfficerData";
import { OutlierOfficerData } from "./types";

export class SupervisionOfficersPresenter implements Hydratable {
  error?: Error | undefined;

  isLoading = false;

  constructor(
    private supervisionStore: OutliersSupervisionStore,
    public supervisorId: string
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
    return this.supervisionStore.officersBySupervisor.has(this.supervisorId);
  }

  private get isSupervisorHydrated() {
    return (
      this.supervisionStore.supervisionOfficerSupervisors?.find(
        (s) => s.externalId === this.supervisorId
      ) !== undefined
    );
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
          this.supervisionStore.hydrateOfficersForSupervisor(this.supervisorId)
        ),
        flowResult(
          this.supervisionStore.hydrateSupervisionOfficerSupervisors()
        ),
      ]);

      const { supervisionOfficerSupervisors, officersBySupervisor } =
        this.supervisionStore;
      if (
        supervisionOfficerSupervisors &&
        !supervisionOfficerSupervisors.find(
          (s) => s.externalId === this.supervisorId
        )
      ) {
        throw new Error(
          `Data for supervisor ${this.supervisorId} is not available.`
        );
      }

      const officers = officersBySupervisor.get(this.supervisorId);
      if (!officers || officers.length === 0) {
        throw new Error(
          `Supervisor ${this.supervisorId} does not have any assigned officers`
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

  /**
   * Augments officer data with all necessary relationships fully hydrated.
   * It triggers an error state rather than returning a partial result, so that none of the UI
   * components that consume this data have to worry about parts of it being missing
   */
  get outlierOfficersData(): OutlierOfficerData[] | undefined {
    if (!this.areMetricsHydrated || !this.areOfficersHydrated) return;

    try {
      const outlierOfficers = this.supervisionStore.officersBySupervisor
        .get(this.supervisorId)
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
    return this.supervisionStore.supervisionOfficerSupervisor(
      this.supervisorId
    );
  }

  /**
   * Provides a list of all officers that are in this supervisor's unit
   */
  get allOfficers(): SupervisionOfficer[] | undefined {
    return this.supervisionStore?.officersBySupervisor.get(this.supervisorId);
  }

  get supervisorIsCurrentUser() {
    return (
      !!this.supervisorId &&
      this.supervisorId ===
        this.supervisionStore.currentSupervisorUser?.externalId
    );
  }
}
