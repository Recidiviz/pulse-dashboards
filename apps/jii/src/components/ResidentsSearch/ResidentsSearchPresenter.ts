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

import { ascending } from "d3-array";
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

const ALL_RESIDENTS_VALUE = "__ALL__";
const PILOT_RESIDENTS_VALUE = "MVCF PILOT";
const PILOT_FACILITY_ID = "MOUNTAIN VIEW CORRECTIONAL FACILITY";
const PILOT_CUSTODY_LEVELS = ["MINIMUM", "COMMUNITY"];

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

  private get residents(): Array<ResidentRecord> {
    const { selectedResidentsFilterOptionValue } = this.uiStore;

    return Array.from(this.residentsStore.residentsByExternalId.values())
      .filter(
        (r) =>
          !selectedResidentsFilterOptionValue ||
          selectedResidentsFilterOptionValue === ALL_RESIDENTS_VALUE ||
          (r.facilityId === PILOT_FACILITY_ID &&
            PILOT_CUSTODY_LEVELS.includes(r.custodyLevel as string)),
      )
      .sort((a, b) => ascending(a.personName.surname, b.personName.surname));
  }

  get selectOptions() {
    return this.residents.map((r) => ({
      value: r,
      label: `${r.personName.givenNames} ${r.personName.surname} (${r.personExternalId})`,
    }));
  }

  get residentFilterOptions(): [SelectOption, ...Array<SelectOption>] {
    const options: [SelectOption, ...Array<SelectOption>] = [
      { label: "All", value: ALL_RESIDENTS_VALUE },
    ];

    // for convenience this is just hardcoded for the pilot
    if (!isOfflineMode() && !isDemoMode()) {
      options.push({
        label: "Mountain View Correctional Facility Pilot",
        value: PILOT_RESIDENTS_VALUE,
      });
    }

    return options;
  }

  /**
   * The filter select component is uncontrolled, but this can be used preserve state when navigating
   * away from the page (passing a default only affects which option is selected when the component mounts)
   */
  get residentFilterDefaultOption() {
    const { selectedResidentsFilterOptionValue } = this.uiStore;
    if (selectedResidentsFilterOptionValue) {
      return this.residentFilterOptions.find(
        (o) => o.value === selectedResidentsFilterOptionValue,
      );
    }

    return this.residentFilterOptions.at(-1);
  }

  private get residentsFilterParams(): Array<FilterParams> | undefined {
    const { residentFilterDefaultOption: residentsFilterDefaultOption } = this;
    if (!residentsFilterDefaultOption) return;

    if (residentsFilterDefaultOption.value === PILOT_RESIDENTS_VALUE) {
      return [
        ["facilityId", "==", PILOT_FACILITY_ID],
        ["custodyLevel", "in", PILOT_CUSTODY_LEVELS],
      ];
    }

    return;
  }

  setResidentsFilter(value: string) {
    if (value !== this.uiStore.selectedResidentsFilterOptionValue) {
      this.uiStore.selectedResidentsFilterOptionValue = value;
      this.residentsStore.populateResidents(this.residentsFilterParams, true);
    }
  }
}
