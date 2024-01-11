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

import { HydratesFromSource } from "../../core/models/HydratesFromSource";
import { HydrationState, HydrationStateMachine } from "../../core/models/types";
import { castToError } from "../../utils/castToError";
import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { OutliersSupervisionStore } from "../stores/OutliersSupervisionStore";
import { ConfigLabels, OutlierOfficerData } from "./types";
import { getOutlierOfficerData } from "./utils";

export class SupervisionOfficersPresenter implements HydrationStateMachine {
  constructor(
    private supervisionStore: OutliersSupervisionStore,
    public supervisorPseudoId: string
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrator = new HydratesFromSource({
      populate: async () => {
        await Promise.all([
          flowResult(this.supervisionStore.populateMetricConfigs()),
          flowResult(
            this.supervisionStore.populateOfficersForSupervisor(
              this.supervisorPseudoId
            )
          ),
          flowResult(
            this.supervisionStore.populateSupervisionOfficerSupervisors()
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

  private hydrator: HydratesFromSource;

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  private expectMetricsPopulated() {
    if (this.supervisionStore.metricConfigsById === undefined)
      throw new Error("Failed to populate metrics");
  }

  private expectOfficersPopulated() {
    if (
      !this.supervisionStore.officersBySupervisorPseudoId.has(
        this.supervisorPseudoId
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

  get areCaseloadTypeBreakdownsEnabled() {
    return this.supervisionStore.areCaseloadTypeBreakdownsEnabled;
  }

  /**
   * Augments officer data with all necessary relationships fully hydrated.
   * If this fails for any reason the value will instead be the error that was encountered,
   * useful mainly for debugging.
   */
  private get outlierDataOrError(): OutlierOfficerData[] | Error {
    try {
      const officersData =
        this.supervisionStore.officersBySupervisorPseudoId.get(
          this.supervisorPseudoId
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
   * Augments officer data with all necessary relationships fully hydrated.
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

  get userCanAccessAllSupervisors() {
    return this.supervisionStore.userCanAccessAllSupervisors;
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
