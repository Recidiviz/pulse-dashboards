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
import { flowResult, makeAutoObservable } from "mobx";

import { ResidentsStore } from "~@jii/data";
import { ResidentRecord } from "~datatypes";
import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

export class ResidentSelectorPresenter implements Hydratable {
  private hydrationSource: HydratesFromSource;

  constructor(
    private residentsStore: ResidentsStore,
    private facilityId: string,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrationSource = new HydratesFromSource({
      populate: async () => {
        await flowResult(
          this.residentsStore.populateResidents(
            [["facilityId", "==", facilityId]],
            // force because store doesn't expect partial hydrations
            true,
          ),
        );
      },
      expectPopulated: [this.expectResidentsPopulated],
    });
  }

  private expectResidentsPopulated() {
    if (!this.allResidents.some((r) => r.facilityId === this.facilityId)) {
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
      label: `${r.personName.givenNames} ${r.personName.surname} (${r.personExternalId})`,
    }));
  }
}
