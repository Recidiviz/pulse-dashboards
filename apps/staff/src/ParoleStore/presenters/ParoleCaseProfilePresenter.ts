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

import { ParoleCase } from "~datatypes";
import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { ParoleConfig } from "../../core/models/types";
import { ParoleStore } from "../ParoleStore";

/**
 * Drives the Parole case profile (detail) page: hydrates a single case's
 * data by DOC ID from the Parole API/fixture layer.
 */
export class ParoleCaseProfilePresenter implements Hydratable {
  private caseDetailValue?: ParoleCase;

  constructor(
    private paroleStore: ParoleStore,
    private docId: string,
  ) {
    makeAutoObservable(this);

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.caseDetailValue === undefined)
            throw new Error(`Failed to populate Parole case [${this.docId}]`);
        },
      ],
      populate: async () => {
        const caseDetail = await this.paroleStore.apiClient.caseDetail(
          this.docId,
        );
        runInAction(() => {
          this.caseDetailValue = caseDetail;
        });
      },
    });
  }

  private hydrator: HydratesFromSource;

  get hydrationState() {
    return this.hydrator.hydrationState;
  }

  hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get caseDetail(): ParoleCase {
    if (!this.caseDetailValue) {
      throw new Error(
        "caseDetail accessed before hydration completed successfully",
      );
    }
    return this.caseDetailValue;
  }

  get config(): ParoleConfig {
    return this.paroleStore.config;
  }
}
