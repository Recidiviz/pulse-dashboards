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

import { WorkflowsRootStore } from "../../WorkflowsStore/WorkflowsRootStore";
import { InsightsStore } from "../InsightsStore";

/**
 * Sits above all of the Insights supervision pages and ensures the supervisionStore is hydrated
 */
export class SupervisionPresenter implements Hydratable {
  constructor(
    private insightsStore: InsightsStore,
    private workflowsRootStore: WorkflowsRootStore,
  ) {
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
        this.workflowsRootStore.populateJusticeInvolvedPersonsStore();
        // maybe move this to workflows presenters once they exist
        this.workflowsRootStore.opportunityConfigurationStore?.hydrate();
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
