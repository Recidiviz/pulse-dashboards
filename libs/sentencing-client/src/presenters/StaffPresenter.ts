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

import { Case, Client } from "../api";
import { StaffStore } from "../datastores/StaffStore";

export class StaffPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  constructor(public readonly staffStore: StaffStore) {
    makeAutoObservable(this);
    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.staffStore.staffInfo === undefined)
            throw new Error("Failed to load staff info");
        },
      ],
      populate: async () => {
        await flowResult(this.staffStore.loadStaffInfo());
      },
    });
  }

  get staffPseudoId() {
    return this.staffStore.psiStore.staffPseudoId;
  }

  get staffInfo() {
    return this.staffStore.staffInfo;
  }

  get listOfCaseBriefs(): (Case & { Client: Client })[] | undefined {
    return this.staffInfo?.Cases;
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }
}
