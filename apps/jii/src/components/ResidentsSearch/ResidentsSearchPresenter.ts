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

import { isDemoMode, isOfflineMode } from "~client-env-utils";
import { ResidentRecord } from "~datatypes";
import { FilterParams } from "~firestore-api";
import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import { ResidentsStore } from "../../datastores/ResidentsStore";
import { UiStore } from "../../datastores/UiStore";

const ALL_FACILITIES_VALUE = "__ALL__";

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
        await flowResult(
          this.residentsStore.populateResidents(this.residentsFilterParams),
        );
      },
      expectPopulated: [this.expectResidentsPopulated],
    });
  }

  private expectResidentsPopulated() {
    if (!this.residentsStore.areAllResidentsPopulated()) {
      throw new Error("Residents data is not populated");
    }
  }

  get hydrationState(): HydrationState {
    return this.hydrationSource.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrationSource.hydrate();
  }

  private get residents(): Array<ResidentRecord["output"]> {
    const { selectedFacilityFilterOptionValue } = this.uiStore;

    return Array.from(
      this.residentsStore.residentsByExternalId.values(),
    ).filter(
      (r) =>
        !selectedFacilityFilterOptionValue ||
        selectedFacilityFilterOptionValue === ALL_FACILITIES_VALUE ||
        r.facilityId === selectedFacilityFilterOptionValue,
    );
  }

  get selectOptions() {
    return this.residents.map((r) => ({
      value: r,
      label: `${r.personName.givenNames} ${r.personName.surname} (${r.personExternalId})`,
    }));
  }

  get facilityFilterOptions(): [SelectOption, ...Array<SelectOption>] {
    const options: [SelectOption, ...Array<SelectOption>] = [
      { label: "All", value: ALL_FACILITIES_VALUE },
    ];

    // for convenience this is just hardcoded for the pilot
    if (!isOfflineMode() && !isDemoMode()) {
      options.push({
        label: "Mountain View Correctional Facility",
        value: "MOUNTAIN VIEW CORRECTIONAL FACILITY",
      });
    }

    return options;
  }

  /**
   * The facility select component is uncontrolled, but this can be used preserve state when navigating
   * away from the page (passing a default only affects which option is selected when the component mounts)
   */
  get facilityFilterDefaultOption() {
    const { selectedFacilityFilterOptionValue } = this.uiStore;
    if (selectedFacilityFilterOptionValue) {
      return this.facilityFilterOptions.find(
        (o) => o.value === selectedFacilityFilterOptionValue,
      );
    }

    return this.facilityFilterOptions.at(-1);
  }

  private get residentsFilterParams(): Array<FilterParams> | undefined {
    const { facilityFilterDefaultOption } = this;
    if (!facilityFilterDefaultOption) return;

    if (facilityFilterDefaultOption.value === ALL_FACILITIES_VALUE) return;

    return [["facilityId", "==", facilityFilterDefaultOption.value]];
  }

  setFacilityFilter(value: string) {
    if (value !== this.uiStore.selectedFacilityFilterOptionValue) {
      this.uiStore.selectedFacilityFilterOptionValue = value;
      this.residentsStore.populateResidents(this.residentsFilterParams, true);
    }
  }
}
