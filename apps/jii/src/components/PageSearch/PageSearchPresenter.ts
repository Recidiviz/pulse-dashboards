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

import { ResidentRecord } from "~datatypes";
import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import { RootStore } from "../../datastores/RootStore";

export class PageSearchPresenter implements Hydratable {
  private hydrationSource: HydratesFromSource;

  constructor(private rootStore: RootStore) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrationSource = new HydratesFromSource({
      populate: async () => {
        await flowResult(this.rootStore.residentsStore.populateAllResidents());
      },
      expectPopulated: [this.expectResidentsPopulated],
    });
  }

  private expectResidentsPopulated() {
    // if we started the session on a single resident's page, we might have had one
    // populated already. Seems a safe assumption that the total will always be > 1
    if (this.rootStore.residentsStore.residentsByExternalId.size < 2) {
      throw new Error("Residents data is not populated");
    }
  }

  get hydrationState(): HydrationState {
    return this.hydrationSource.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrationSource.hydrate();
  }

  private get residents(): Array<ResidentRecord["output"]> {
    return Array.from(
      this.rootStore.residentsStore.residentsByExternalId.values(),
    );
  }

  /**
   * Setting a resident "active" allows the user to simulate that resident's view of the app
   */
  setActiveResident(externalId: string | undefined): void {
    this.rootStore.userStore.overrideExternalId(externalId);
  }

  get selectOptions() {
    return this.residents.map((r) => ({
      value: r.personExternalId,
      label: `${r.personName.givenNames} ${r.personName.surname} (${r.personExternalId})`,
    }));
  }

  get defaultOption() {
    return this.selectOptions.find(
      (o) => o.value === this.rootStore.userStore.externalId,
    );
  }
}