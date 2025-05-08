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

import { StateCode } from "../../configs/types";
import { RootStore } from "../../datastores/RootStore";

export class ResidentsHydratorPresenter implements Hydratable {
  constructor(
    private rootStore: RootStore,
    private stateCode: StateCode,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });

    this.hydrator = new HydratesFromSource({
      expectPopulated: [this.expectStorePopulated],
      populate: this.populateStore,
    });
  }

  private hydrator: HydratesFromSource;

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  private async populateStore() {
    await flowResult(this.rootStore.populateResidentsStore(this.stateCode));
  }

  private expectStorePopulated() {
    if (this.rootStore.residentsStore === undefined)
      throw new Error("failed to create residentsStore");
    if (this.rootStore.residentsStore.stateCode !== this.stateCode) {
      throw new Error("failed to replace previous residentsStore");
    }
  }

  get residentsStore() {
    const { residentsStore } = this.rootStore;
    // in practice we generally expect hydration to succeed before getting here
    if (residentsStore === undefined) {
      throw new Error("missing expected residentsStore");
    }
    return residentsStore;
  }
}
