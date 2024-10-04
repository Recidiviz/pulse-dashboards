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

export class ResidentsHydratorPresenter implements Hydratable {
  constructor(
    private rootStore: RootStore,
    private residentPseudoId?: string,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        this.expectStorePopulated,
        this.expectOptionalResidentPopulated,
      ],
      populate: this.populateStoreAndOptionalResident,
    });
  }

  private hydrator: HydratesFromSource;

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  private get userExternalId() {
    return this.rootStore.userStore.externalId;
  }

  private async populateStoreAndOptionalResident() {
    const residentsStore = await flowResult(
      this.rootStore.populateResidentsStore(),
    );
    if (this.residentPseudoId) {
      await flowResult(
        residentsStore.populateResidentByPseudoId(this.residentPseudoId),
      );
    } else if (this.userExternalId) {
      await flowResult(
        residentsStore.populateResidentById(this.userExternalId),
      );
    }
  }

  private expectStorePopulated() {
    if (this.rootStore.residentsStore === undefined)
      throw new Error("missing expected residentsStore");
  }

  private expectOptionalResidentPopulated() {
    if (this.residentPseudoId) {
      if (
        !this.rootStore.residentsStore?.isResidentWithPseudoIdPopulated(
          this.residentPseudoId,
        )
      ) {
        throw new Error(
          `missing expected resident data for ${this.residentPseudoId}`,
        );
      }
    } else if (
      this.userExternalId &&
      !this.rootStore.residentsStore?.isResidentPopulated(this.userExternalId)
    ) {
      throw new Error(`missing expected resident data for current user`);
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

  get activeResident() {
    // in practice we generally expect hydration to succeed before getting here,
    // or to throw an error if the expected is missing. We don't have to do an extra check here
    // to satisfy type safety since is valid to be here without an active resident

    if (this.residentPseudoId) {
      return this.residentsStore.residentsByPseudoId.get(this.residentPseudoId);
    }

    if (this.userExternalId) {
      return this.residentsStore.residentsByExternalId.get(this.userExternalId);
    }

    return undefined;
  }
}
