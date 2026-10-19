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

import { makeAutoObservable } from "mobx";

import { ParoleFacility, ParoleResident } from "~datatypes";
import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { ParoleStore } from "../ParoleStore";

const ALL_RESIDENTS_HEADER_TEXT = "All Residents";

/** A residents list row, with its facility's display name. */
export type ParoleResidentRow = ParoleResident & { facility: string };

/**
 * Drives the Parole residents list. The page hydrates only the facility
 * list; residents are fetched once the user selects one or more facilities.
 */
export class ParoleResidentsPresenter implements Hydratable {
  searchQuery = "";

  /**
   * Hydrates the residents of the current selection. Replaced on every
   * selection change, since a HydratesFromSource stays hydrated after its
   * first hydration.
   */
  residentsHydrator: Hydratable;

  private hydrator: HydratesFromSource;

  constructor(private paroleStore: ParoleStore) {
    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.paroleStore.facilities === undefined)
            throw new Error("Failed to populate Parole facilities");
        },
      ],
      populate: () => this.paroleStore.populateFacilities(),
    });
    this.residentsHydrator = this.buildResidentsHydrator(
      paroleStore.selectedFacilityIds,
    );

    makeAutoObservable(this);
  }

  get hydrationState() {
    return this.hydrator.hydrationState;
  }

  hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  private buildResidentsHydrator(facilityIds: Array<string>): Hydratable {
    return new HydratesFromSource({
      expectPopulated: [
        () => {
          if (
            facilityIds.some(
              (facilityId) =>
                !this.paroleStore.residentsByFacilityId.has(facilityId),
            )
          )
            throw new Error("Failed to populate Parole residents");
        },
      ],
      populate: () =>
        this.paroleStore.populateResidentsForFacilities(facilityIds),
    });
  }

  get facilities(): Array<ParoleFacility> {
    return this.paroleStore.facilities ?? [];
  }

  get selectedFacilityIds(): Array<string> {
    return this.paroleStore.selectedFacilityIds;
  }

  get hasSelectedFacilities(): boolean {
    return this.selectedFacilityIds.length > 0;
  }

  setSelectedFacilityIds(facilityIds: Array<string>): void {
    this.paroleStore.setSelectedFacilityIds(facilityIds);
    this.residentsHydrator = this.buildResidentsHydrator(facilityIds);
  }

  setSearchQuery(query: string): void {
    this.searchQuery = query;
  }

  private get facilityNamesById(): Map<string, string> {
    return new Map(
      this.facilities.map((facility) => [facility.facilityId, facility.name]),
    );
  }

  /** Every resident of the selected facilities that has been fetched. */
  private get residents(): Array<ParoleResidentRow> {
    const { facilityNamesById } = this;
    return this.selectedFacilityIds.flatMap((facilityId) =>
      (this.paroleStore.residentsByFacilityId.get(facilityId) ?? []).map(
        (resident) => ({
          ...resident,
          facility: facilityNamesById.get(facilityId) ?? facilityId,
        }),
      ),
    );
  }

  /** The residents that match the search, by name or DOC ID. */
  get filteredResidents(): Array<ParoleResidentRow> {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.residents;

    return this.residents.filter(
      (resident) =>
        resident.individualName.toLowerCase().includes(query) ||
        resident.displayId.toLowerCase().includes(query),
    );
  }

  get totalResidentsCount(): number {
    return this.residents.length;
  }

  /** The page header, with the resident count once facilities are selected. */
  get headerText(): string {
    return this.hasSelectedFacilities
      ? `${ALL_RESIDENTS_HEADER_TEXT} (${this.totalResidentsCount})`
      : ALL_RESIDENTS_HEADER_TEXT;
  }
}
