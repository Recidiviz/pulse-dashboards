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

import { TenantId } from "../../RootStore/types";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";

export class UserOnboardingPresenter implements Hydratable {
  constructor(private supervisionStore: InsightsSupervisionStore) {
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

  get eventLabels() {
    return this.supervisionStore.eventLabels;
  }

  get userInfo() {
    return this.supervisionStore.userInfo;
  }

  get userName(): string | undefined {
    return (
      this.userInfo?.entity?.fullName.givenNames ??
      this.supervisionStore.insightsStore.rootStore.user?.given_name
    );
  }

  get userPseudoId(): string | undefined {
    return this.userInfo?.entity?.pseudonymizedId;
  }

  get userHasSeenOnboarding(): boolean {
    return this.userInfo?.metadata.hasSeenOnboarding ?? false;
  }

  get isRecidivizUser(): boolean {
    return this.supervisionStore.insightsStore.rootStore.userStore
      .isRecidivizUser;
  }

  get isWorkflowsHomepageEnabled(): boolean {
    return !!this.supervisionStore.insightsStore.rootStore.userStore
      .activeFeatureVariants.supervisorHomepageWorkflows;
  }

  get isInsightsLanternState(): boolean {
    return this.supervisionStore.isInsightsLanternState;
  }

  get tenantId(): TenantId | undefined {
    return this.supervisionStore.insightsStore.rootStore.currentTenantId;
  }

  async setUserHasSeenOnboarding(hasSeenOnboarding: boolean) {
    // Recidiviz + CSG users have always seen onboarding and don't have UserInfo stored in the backend
    const { isRecidivizUser, isCSGUser } =
      this.supervisionStore.insightsStore.rootStore.userStore;
    if (isRecidivizUser || isCSGUser) return;

    return flowResult(
      this.supervisionStore.patchUserInfoForCurrentUser({ hasSeenOnboarding }),
    );
  }
}
