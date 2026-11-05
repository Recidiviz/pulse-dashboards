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
import { ParoleCaseNotFoundError } from "../api/ParoleCaseNotFoundError";
import { ParoleStore } from "../ParoleStore";

/**
 * Drives the Parole case profile (detail) page: hydrates a single case's
 * data by pseudonymized id through ParoleStore, which caches it for the session.
 * An id with no resident still hydrates successfully, with isNotFound set.
 */
export class ParoleCaseProfilePresenter implements Hydratable {
  constructor(
    private paroleStore: ParoleStore,
    private pseudonymizedId: string,
  ) {
    makeAutoObservable(this);

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (
            !this.isNotFound &&
            !this.paroleStore.caseDetailsByPseudonymizedId.has(
              this.pseudonymizedId,
            )
          )
            throw new Error("Failed to populate Parole case");
        },
      ],
      populate: async () => {
        try {
          await this.paroleStore.populateCaseDetail(this.pseudonymizedId);
        } catch (e) {
          if (!(e instanceof ParoleCaseNotFoundError)) throw e;
          runInAction(() => {
            this.isNotFound = true;
          });
        }
      },
    });
  }

  /** True once hydration found no resident for the pseudonymized id. */
  isNotFound = false;

  private hydrator: HydratesFromSource;

  get hydrationState() {
    return this.hydrator.hydrationState;
  }

  hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get caseDetail(): ParoleCase {
    const caseDetail = this.paroleStore.caseDetailsByPseudonymizedId.get(
      this.pseudonymizedId,
    );
    if (!caseDetail) {
      throw new Error(
        "caseDetail accessed before hydration completed successfully",
      );
    }
    return caseDetail;
  }

  get config(): ParoleConfig {
    return this.paroleStore.config;
  }
}
