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

import { RootStore } from "../../datastores/RootStore";

export class ResidentsLayoutPresenter implements Hydratable {
  constructor(private rootStore: RootStore) {
    makeAutoObservable(this);

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.rootStore.residentsStore === undefined)
            throw new Error("missing expected residentsStore");
        },
      ],
      populate: async () => {
        await flowResult(this.rootStore.populateResidentsStore());
      },
    });
  }

  private hydrator: HydratesFromSource;

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get residentsStore() {
    const { residentsStore } = this.rootStore;
    if (residentsStore === undefined) {
      throw new Error("missing expected residentsStore");
    }
    return residentsStore;
  }
}
