// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { InsightsStore } from "../InsightsStore";

/**
 * Sits above all of the Insights supervision pages and ensures the supervisionStore is hydrated
 */
export class SupervisionPresenter implements Hydratable {
  constructor(private insightsStore: InsightsStore) {
    makeAutoObservable(this);

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.insightsStore.supervisionStore?.userInfo === undefined)
            throw new Error("failed to populate userInfo");
        },
      ],
      populate: async () => {
        await flowResult(this.insightsStore.populateSupervisionStore());
        await flowResult(
          this.insightsStore.supervisionStore?.populateUserInfo(),
        );
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
}
