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

import { ResidentsStore, UiStore } from "~@jii/data";
import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

type SelectOption = { label: string; value: string };

export class ResidentsSearchPresenter implements Hydratable {
  private hydrationSource: HydratesFromSource;

  constructor(
    private residentsStore: ResidentsStore,
    private uiStore: UiStore,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrationSource = new HydratesFromSource({
      populate: async () => {
        await flowResult(this.residentsStore.populateLocations());
      },
      expectPopulated: [this.expectLocationsPopulated],
    });
  }

  private expectLocationsPopulated() {
    if (!this.residentsStore.locations.length) {
      throw new Error("Locations data is not populated");
    }
  }

  get hydrationState(): HydrationState {
    return this.hydrationSource.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrationSource.hydrate();
  }

  private get facilities() {
    return this.residentsStore.locations.filter(
      (l) => l.system === "INCARCERATION" && l.idType === "facilityId",
    );
  }

  get residentFilterOptions(): Array<SelectOption> {
    return this.facilities.map((facility) => ({
      value: facility.id,
      label: facility.name,
    }));
  }

  /**
   * The filter select component is uncontrolled, but this can be used preserve state when navigating
   * away from the page (passing a default only affects which option is selected when the component mounts)
   */
  get residentFilterDefaultOption() {
    const {
      selectedFacilityIdFilterOptionValue: selectedResidentsFilterOptionValue,
    } = this.uiStore;
    if (selectedResidentsFilterOptionValue) {
      return this.residentFilterOptions.find(
        (o) => o.value === selectedResidentsFilterOptionValue,
      );
    }

    return;
  }

  setResidentsFilter(value: string) {
    if (value !== this.uiStore.selectedFacilityIdFilterOptionValue) {
      this.uiStore.selectedFacilityIdFilterOptionValue = value;
    }
  }
}
