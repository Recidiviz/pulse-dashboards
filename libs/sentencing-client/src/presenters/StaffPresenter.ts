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

import { StaffStore } from "../datastores/StaffStore";

export class PSIStaffPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  constructor(public readonly psiStaffStore: StaffStore) {
    makeAutoObservable(this);
    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.psiStaffStore.staffInfo === undefined)
            throw new Error("Failed to load staff info");
        },
      ],
      populate: async () => {
        await flowResult(this.psiStaffStore.loadStaffInfo());
      },
    });
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  get staffInfo() {
    return this.psiStaffStore.staffInfo;
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }
}