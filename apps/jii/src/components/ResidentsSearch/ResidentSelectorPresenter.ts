// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { ascending } from "d3-array";
import { flowResult, makeAutoObservable, runInAction } from "mobx";

import { ResidentsStore } from "~@jii/data";
import { ResidentRecord } from "~datatypes";
import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

export class ResidentSelectorPresenter implements Hydratable {
  private hydrationSource: HydratesFromSource;

  // if by some chance we encounter a facility that contains exactly one resident,
  // we can flip this to avoid an infinite loading loop
  private isHydratedWithOneResident = false;

  constructor(
    private residentsStore: ResidentsStore,
    private facilityId: string,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrationSource = new HydratesFromSource({
      populate: async () => {
        const numFetched = await flowResult(
          this.residentsStore.populateResidents(
            [["facilityId", "==", facilityId]],
            // force because store doesn't expect partial hydrations
            true,
          ),
        );
        runInAction(() => {
          // if we fetched exactly one resident we have to tell the
          // hydration status check that it should accept this. normally it won't
          if (numFetched === 1) {
            this.isHydratedWithOneResident = true;
          }
        });
      },
      expectPopulated: [this.expectResidentsPopulated],
    });
  }

  private expectResidentsPopulated() {
    // one item is a special case that arises from starting your session
    // on a resident's page. we ignore it here unless it's explicitly overridden
    const hydrationThreshold = this.isHydratedWithOneResident ? 1 : 2;

    if (this.filteredResidents.length < hydrationThreshold) {
      throw new Error(`Residents data for ${this.facilityId} is not populated`);
    }
  }

  get hydrationState(): HydrationState {
    return this.hydrationSource.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrationSource.hydrate();
  }

  private get allResidents(): Array<ResidentRecord> {
    return Array.from(this.residentsStore.residentsByExternalId.values());
  }

  private get filteredResidents(): Array<ResidentRecord> {
    return this.allResidents
      .filter((r) => r.facilityId === this.facilityId)
      .sort((a, b) => ascending(a.personName.surname, b.personName.surname));
  }

  get selectOptions() {
    return this.filteredResidents.map((r) => ({
      value: r,
      label: `${r.personName.givenNames} ${r.personName.surname} (${r.displayId})`,
    }));
  }
}
