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

import { HydrationState, HydrationStateMachine } from "../../core/models/types";
import { isHydrationStarted } from "../../core/models/utils";
import { castToError } from "../../utils/castToError";
import { OutliersStore } from "../OutliersStore";

/**
 * Sits above all of the Outliers supervision pages and ensures the supervisionStore is hydrated
 */
export class SupervisionPresenter implements HydrationStateMachine {
  constructor(private outliersStore: OutliersStore) {
    makeAutoObservable(this);
  }

  hydrationState: HydrationState = { status: "needs hydration" };

  private setHydrationState(newValue: HydrationState) {
    this.hydrationState = newValue;
  }

  async hydrate(): Promise<void> {
    if (isHydrationStarted(this)) return;

    this.setHydrationState({ status: "loading" });

    try {
      await flowResult(this.outliersStore.hydrateSupervisionStore());
      await flowResult(this.outliersStore.supervisionStore?.hydrateUserInfo());

      // we expect this to be true after the preceding hydration promises resolve,
      // but we guard against the possibility that something went wrong
      if (this.outliersStore.supervisionStore?.userInfo !== undefined) {
        this.setHydrationState({ status: "hydrated" });
      } else {
        throw new Error("Expected data is missing after hydration");
      }
    } catch (e) {
      this.setHydrationState({ status: "failed", error: castToError(e) });
    }
  }
}
