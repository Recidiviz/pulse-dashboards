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

import { CaseStore } from "../datastores/CaseStore";

export class CaseDetailsPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  constructor(
    public readonly psiCaseStore: CaseStore,
    public caseId: string,
  ) {
    makeAutoObservable(this);
    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.psiCaseStore.caseDetailsById[this.caseId] === undefined)
            throw new Error("Failed to load case details");
        },
      ],
      populate: async () => {
        await flowResult(this.psiCaseStore.loadCaseDetails(this.caseId));
      },
    });
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  get caseAttributes() {
    return this.psiCaseStore.caseDetailsById[this.caseId];
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }
}