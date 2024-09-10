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

import { flowResult, makeAutoObservable, values } from "mobx";
import { ValuesType } from "utility-types";

import { AuthClient } from "~auth";
import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { stateConfigsByUrlSlug } from "../../configs/stateConstants";
import { StateLandingPageConfig } from "../../configs/types";
import { LoginConfigStore } from "../../datastores/LoginConfigStore";
import { State } from "../../routes/routes";

export class LandingStateSpecificPresenter implements Hydratable {
  private hydrationSource: HydratesFromSource;

  selectedConnectionName?: string;

  constructor(
    private configStore: LoginConfigStore,
    private authClient: AuthClient,
    public stateUrlSlug: string,
    public returnToPath?: string,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrationSource = new HydratesFromSource({
      populate: () =>
        flowResult(
          this.configStore.populateStateLandingPageConfig(this.stateCode()),
        ),
      expectPopulated: [
        () => {
          if (!this.configStore.stateLandingPageConfigs.get(this.stateCode())) {
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

  private stateCode() {
    const configMatchingUrl = stateConfigsByUrlSlug[this.stateUrlSlug];
    if (!configMatchingUrl) {
      throw new Error("Unknown state URL");
    }
    return configMatchingUrl.stateCode;
  }

  private get stateLandingPageConfigOrError() {
    const config = this.configStore.stateLandingPageConfigs.get(
      this.stateCode(),
    );
    if (!config) {
      throw new Error(
        "Presenter must be hydrated before accessing this property",
      );
    }
    return config;
  }

  get copy() {
    return this.stateLandingPageConfigOrError.copy;
  }

  get selectorOptions() {
    return values(this.stateLandingPageConfigOrError.connections).map((c) => ({
      label: c.displayName,
      value: c,
    }));
  }

  setSelectedConnection(
    connection: ValuesType<StateLandingPageConfig["connections"]>,
  ) {
    this.selectedConnectionName = connection.connectionName;
  }

  goToLogin() {
    this.authClient.logIn({
      targetPath:
        this.returnToPath ?? State.buildPath({ stateSlug: this.stateUrlSlug }),
      connection: this.selectedConnectionName,
    });
  }
}
