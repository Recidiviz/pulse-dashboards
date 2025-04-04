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
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import { SupervisorStore } from "../datastores/SupervisorStore";

export class SupervisorPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  constructor(public readonly supervisorStore: SupervisorStore) {
    makeAutoObservable(this, undefined, { autoBind: true });
    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.supervisorStore.supervisorInfo === undefined) {
            throw new Error("Failed to load supervisor info");
          }
        },
      ],
      populate: async () => {
        await flowResult(this.supervisorStore.loadSupervisorInfo());
      },
    });
  }

  get stateCode() {
    return this.supervisorStore.psiStore.stateCode;
  }

  get staffPseudoId() {
    return this.supervisorStore.psiStore.staffPseudoId;
  }

  get supervisorInfo() {
    return this.supervisorStore.supervisorInfo;
  }

  get supervisorStats() {
    return this.supervisorInfo?.supervisorDashboardStats;
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  trackDashboardPageViewed(): void {
    this.supervisorStore.psiStore.analyticsStore.trackDashboardPageViewed({
      viewedBy: this.staffPseudoId,
    });
  }
}
