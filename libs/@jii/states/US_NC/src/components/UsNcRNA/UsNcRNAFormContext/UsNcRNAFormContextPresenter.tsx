// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { makeAutoObservable, runInAction } from "mobx";

import { DataAPI } from "~@jii/data";
import { castToError, Hydratable, HydrationState } from "~hydration-utils";

import { UsNcRNAForm } from "../../../models/UsNcRNAForm";

export class UsNcRNAFormContextPresenter implements Hydratable {
  form: UsNcRNAForm | undefined;
  hydrationSucceeded = false;
  hydrationError: Error | undefined;

  constructor(
    private readonly apiClient: DataAPI,
    private readonly pseudonymizedId: string,
    private readonly usNcRNAAutoEnablement: boolean,
  ) {
    makeAutoObservable(this);
  }

  async hydrate() {
    try {
      let queryResult;
      if (this.usNcRNAAutoEnablement) {
        // For auto-enabled RNAs, the user's action of viewing the form page might
        // create a new RNA object for them; otherwise determine state based on their
        // existing RNA's status.
        queryResult =
          await this.apiClient.trpc.state.usNc.getOrCreateRNA.mutate({
            pseudonymizedId: this.pseudonymizedId,
          });
      } else {
        // For non-auto-enabled RNAs, the RNA is always created by staff action, so
        // status is determined by the existing RNA in the db.
        queryResult = await this.apiClient.trpc.state.usNc.getRNA.query({
          pseudonymizedId: this.pseudonymizedId,
        });
      }

      runInAction(() => {
        this.hydrationSucceeded = true;
        if (queryResult) {
          this.form = new UsNcRNAForm(
            this.apiClient,
            this.pseudonymizedId,
            queryResult.id,
            queryResult.completedAt,
            queryResult.updatedAt,
            queryResult.enabledAt,
            queryResult.textAnswers,
            queryResult.checkboxAnswers,
            queryResult.lifeAreaAnswers,
          );
        }
      });
    } catch (e) {
      this.hydrationError = castToError(e);
    }
  }

  get hydrationState(): HydrationState {
    if (this.hydrationSucceeded) {
      return { status: "hydrated" };
    } else if (this.hydrationError) {
      return { status: "failed", error: this.hydrationError };
    } else {
      return { status: "needs hydration" };
    }
  }
}
