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

import { captureException } from "@sentry/react";
import { parseISO } from "date-fns";
import omit from "lodash/omit";
import { makeAutoObservable, runInAction } from "mobx";

import { ResidentsConfig, StateCode } from "~@jii/configs";
import type {
  JiiResidentAppRouterInputs,
  JiiResidentAppRouterOutputs,
} from "~@jii/trpc-types";
import { FlowMethod } from "~hydration-utils";

import type { RootStore } from "./RootStore";

export type StateUserProperties = Partial<
  JiiResidentAppRouterOutputs["user"]["getProperties"]
>;

type StateUserPropertiesInput = Partial<
  JiiResidentAppRouterInputs["user"]["setProperties"]
>;

// these are legacy keys from when properties were kept in local storage.
// we still support them but only to incrementally migrate them to the backend
type UserPropertyKey = "egtOnboardingSeen" | "azOnboardingSeen";

export type ResidentFlags = JiiResidentAppRouterOutputs["resident"]["getFlags"];
export type UserFlags = JiiResidentAppRouterOutputs["user"]["getFlags"];

export class ResidentsStore {
  residentFlagsByPseudoId: Map<string, ResidentFlags> = new Map();

  userProperties?: StateUserProperties;

  userFlags?: UserFlags;

  /**
   * Used to filter results on the search page, for users with access to it.
   * Storing it here will allow it to persist when navigating away from the page
   */
  selectedFacilityIdFilterOptionValue?: string;

  constructor(
    private readonly rootStore: RootStore,
    public readonly stateCode: StateCode,
    public readonly config: ResidentsConfig,
  ) {
    makeAutoObservable(this);
  }

  private get apiClient() {
    return this.rootStore.apiClient;
  }

  get userStore() {
    return this.rootStore.userStore;
  }

  *populateResidentFlags(
    pseudoId: string,
  ): FlowMethod<typeof this.apiClient.trpc.resident.getFlags.query, void> {
    if (this.residentFlagsByPseudoId.has(pseudoId)) return;

    const flags = yield this.apiClient.trpc.resident.getFlags.query({
      pseudonymizedId: pseudoId,
    });

    this.residentFlagsByPseudoId.set(pseudoId, flags);
  }

  async populateUserProperties() {
    if (this.userProperties !== undefined) return;

    // state code is implicit in every query, so we don't need to specify it here
    let properties: StateUserProperties | undefined =
      await this.apiClient.trpc.user.getProperties.query();
    if (!properties?.hasSeenOnboarding) {
      const localStorageProperties =
        this.getAndMigrateOldLocalStorageProperties();
      if (localStorageProperties) {
        properties = { ...properties, ...localStorageProperties };
      }
    }

    runInAction(() => {
      this.userProperties = properties;
    });
  }

  *populateUserFlags(): FlowMethod<
    typeof this.apiClient.trpc.user.getFlags.query,
    void
  > {
    if (this.userFlags) return;

    this.userFlags = yield this.apiClient.trpc.user.getFlags.query();
  }

  // incrementally migrating old data from local storage as we encounter it
  private getAndMigrateOldLocalStorageProperties() {
    let onboardingFlag: string | null = null;
    let localProperty: UserPropertyKey | undefined;

    if (this.stateCode === "US_AZ") {
      localProperty = "azOnboardingSeen";
    } else if (this.stateCode === "US_MA") {
      localProperty = "egtOnboardingSeen";
    }

    if (localProperty) {
      onboardingFlag = localStorage.getItem(localProperty);

      if (onboardingFlag) {
        const hasSeenOnboarding = parseISO(onboardingFlag);

        // we're not awaiting this because it doesn't need to block UI
        this.apiClient.trpc.user.setProperties
          .mutate({ hasSeenOnboarding })
          .then(() => {
            localStorage.removeItem(localProperty);
          })
          .catch((e) => {
            captureException(e);
          });

        return { hasSeenOnboarding };
      }
    }
    return;
  }

  /**
   * Try to update the current user properties with some subset of new properties.
   * Optimistically updates the local state then waits for database response.
   * If a property is undefined in newProperties, the user property won't be updated.
   *
   * If there's an error, onError is called; otherwise, the method fails silently.
   */
  private async setUserProperties(
    newProperties: StateUserPropertiesInput,
    onError?: () => void,
  ) {
    // set optimistically
    if (this.userProperties) {
      this.userProperties = { ...this.userProperties, ...newProperties };
    } else {
      this.userProperties = newProperties;
    }

    try {
      const updatedProperties =
        await this.apiClient.trpc.user.setProperties.mutate(newProperties);
      // refresh properties again after server response
      runInAction(() => {
        this.userProperties = omit(updatedProperties, "id");
      });
    } catch {
      if (onError) onError();
    }
  }

  async setUserOnboardingSeen() {
    const seenTime = new Date();
    // it's OK for this to fail silently, it should be logged elsewhere.
    // only effect to user is that they'll see onboarding again next time
    await this.setUserProperties({ hasSeenOnboarding: seenTime });
  }

  async hideAboutVideoFromHomePage() {
    const hiddenTime = new Date();
    // it's OK for this to fail silently, it should be logged elsewhere.
    // only effect to user is that the video will pop up again on the home page for them
    await this.setUserProperties({ hideAboutVideoFromHomePage: hiddenTime });
  }

  async setUserResourcesOnboardingSeen() {
    await this.setUserProperties({ hasSeenResourcesOnboarding: new Date() });
  }

  async setUserReentryOnboardingSeen() {
    await this.setUserProperties({ hasSeenReentryOnboarding: new Date() });
  }

  async setHideSentenceDates(hidden: boolean) {
    // it's OK for this to fail silently, it should be logged elsewhere.
    // only effect to user is that their dates will be visible again
    await this.setUserProperties({ hideSentenceDates: hidden });
  }
}
