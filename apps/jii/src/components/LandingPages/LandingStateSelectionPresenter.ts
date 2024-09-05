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

import { StateLoginConfig } from "../../configs/types";
import type { LoginConfigStore } from "../../datastores/LoginConfigStore";

export class LandingStateSelectionPresenter implements Hydratable {
  private selectedStateConfig?: StateLoginConfig;

  private hydrationSource: HydratesFromSource;

  constructor(private configStore: LoginConfigStore) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrationSource = new HydratesFromSource({
      populate: () => flowResult(this.configStore.populateLandingPageConfig()),
      expectPopulated: [
        () => {
          if (!this.configStore.landingPageConfig) {
            throw new Error("Missing page configuration");
          }
        },
      ],
    });
  }

  hydrate() {
    return this.hydrationSource.hydrate();
  }

  get hydrationState() {
    return this.hydrationSource.hydrationState;
  }

  private get landingPageConfigOrError() {
    if (!this.configStore.landingPageConfig) {
      throw new Error(
        "Presenter must be hydrated before accessing this property",
      );
    }
    return this.configStore.landingPageConfig;
  }

  get copy() {
    return this.landingPageConfigOrError.copy;
  }

  get selectOptions() {
    return this.landingPageConfigOrError.states.map((stateConfig) => ({
      label: stateConfig.displayName,
      value: stateConfig,
    }));
  }

  setSelectedOption(config: StateLoginConfig) {
    this.selectedStateConfig = config;
  }

  get stateLandingPageUrl() {
    return this.selectedStateConfig?.urlSlug
      ? `/${this.selectedStateConfig.urlSlug}`
      : undefined;
  }
}
