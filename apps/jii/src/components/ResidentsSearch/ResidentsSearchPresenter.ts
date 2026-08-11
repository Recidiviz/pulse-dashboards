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

import { ResidentsStore, UiStore, UserStore } from "~@jii/data";
import { JiiResidentAppRouterOutputs } from "~@jii/trpc-types";

type SelectOption = { label: string; value: string };

export class ResidentsSearchPresenter {
  constructor(
    private facilities: JiiResidentAppRouterOutputs["resident"]["getFacilities"],
    private residentsStore: ResidentsStore,
    private uiStore: UiStore,
    private userStore: UserStore,
  ) {}

  get residentFilterOptions(): Array<SelectOption> {
    // broadens the type back to an array so we can filter it
    let facilities = [...this.facilities];
    const { district } = this.userStore;
    const { limitDistrictSearchOptions } = this.residentsStore.config;

    if (limitDistrictSearchOptions && district) {
      facilities = facilities.filter((f) => f.id === district);
    }

    // this should only happen as a result of the preceding filter step,
    // since the input data is guaranteed nonempty
    if (facilities.length === 0)
      throw new Error(
        "You don't have permission to search any known facilities.",
      );

    return facilities.map((facility) => ({
      value: facility.id,
      label: facility.name,
    }));
  }

  /**
   * The filter select component is uncontrolled, but this can be used preserve state when navigating
   * away from the page (passing a default only affects which option is selected when the component mounts)
   */
  get residentFilterDefaultOption() {
    if (this.residentFilterOptions.length === 1) {
      return this.residentFilterOptions[0];
    }

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
