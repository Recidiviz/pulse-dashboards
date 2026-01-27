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

import { UsNcRNAForm } from "../../models/UsNcRNAForm";

export class UsNcRNAFormContextPresenter implements Hydratable {
  form: UsNcRNAForm | undefined;
  hydrationError: Error | undefined;

  constructor(
    private readonly apiClient: DataAPI,
    private readonly pseudonymizedId: string,
  ) {
    makeAutoObservable(this);
  }

  async hydrate() {
    try {
      // TODO: integrate this with case manager enabling forms for residents/users.
      // In particular, we need to handle the case where the form isn't enabled for
      // the user: hydration should be marked as complete but we won't have a form object.

      let queryResult = await this.apiClient.trpc.state.usNc.getRNA.query({
        pseudonymizedId: this.pseudonymizedId,
      });

      if (!queryResult) {
        queryResult = await this.apiClient.trpc.state.usNc.createRNA.mutate({
          pseudonymizedId: this.pseudonymizedId,
        });
      }

      runInAction(() => {
        this.form = new UsNcRNAForm(
          this.apiClient,
          queryResult.id,
          queryResult.textAnswers,
          queryResult.checkboxAnswers,
          queryResult.lifeAreaAnswers,
        );
      });
    } catch (e) {
      this.hydrationError = castToError(e);
    }
  }

  get hydrationState(): HydrationState {
    if (this.form) {
      return { status: "hydrated" };
    } else if (this.hydrationError) {
      return { status: "failed", error: this.hydrationError };
    } else {
      return { status: "needs hydration" };
    }
  }
}
