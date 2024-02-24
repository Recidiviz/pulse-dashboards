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

import { HydratesFromSource } from "../../core/models/HydratesFromSource";
import { Hydratable, HydrationState } from "../../core/models/types";
import { OutliersSupervisionStore } from "../stores/OutliersSupervisionStore";

export class UserOnboardingPresenter implements Hydratable {
  constructor(private supervisionStore: OutliersSupervisionStore) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrator = new HydratesFromSource({
      populate: async () => {
        await flowResult(supervisionStore.populateUserInfo());
      },
      expectPopulated: [this.expectUserInfoPopulated],
    });
  }

  private hydrator: HydratesFromSource;

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  /**
   * Initiates hydration for all data needed within this presenter class
   */
  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  private expectUserInfoPopulated() {
    if (!this.supervisionStore.userInfo)
      throw new Error("failed to populate userInfo");
  }

  get labels() {
    return this.supervisionStore.labels;
  }

  get userInfo() {
    return this.supervisionStore.userInfo;
  }

  get userHasSeenOnboarding(): boolean {
    return this.userInfo?.metadata.hasSeenOnboarding ?? false;
  }

  async setUserHasSeenOnboarding(hasSeenOnboarding: boolean) {
    // Recidiviz + CSG users have always seen onboarding and don't have UserInfo stored in the backend
    const { isRecidivizUser, isCSGUser } =
      this.supervisionStore.outliersStore.rootStore.userStore;
    if (isRecidivizUser || isCSGUser) return;

    return flowResult(
      this.supervisionStore.patchUserInfoForCurrentUser({ hasSeenOnboarding })
    );
  }
}
