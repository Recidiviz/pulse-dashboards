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

import { ParoleHearing } from "~datatypes";
import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { FilterField, FilterOption, FilterType } from "../../core/models/types";
import { FilterPresenter } from "../../FilterStore/FilterPresenter";
import { ParoleFilterStore } from "../ParoleFilterStore";
import { ParoleStore } from "../ParoleStore";

type ParoleHearingFilterField = "facility" | "hearingType";

/**
 * Drives the Parole docket (upcoming hearings) list page: hydrates the
 * hearings fixture/API data and holds the filter UI state (via a
 * WorkflowsFilterDropdown-compatible FilterPresenter/FilterStoreBase pair).
 * Column sorting itself is delegated to CaseloadTable's built-in client-side
 * sorting.
 */
export class ParoleDocketPresenter
  implements Hydratable, FilterPresenter<ParoleFilterStore>
{
  private hearings?: Array<ParoleHearing>;

  searchQuery = "";

  readonly filterStore: ParoleFilterStore;

  constructor(private paroleStore: ParoleStore) {
    this.filterStore = new ParoleFilterStore(() => ({
      facility: this.uniqueValues("facility"),
      hearingType: this.uniqueValues("hearingType"),
    }));

    makeAutoObservable(this);

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.hearings === undefined)
            throw new Error("Failed to populate Parole hearings");
        },
      ],
      populate: async () => {
        const hearings = await this.paroleStore.apiClient.hearings();
        runInAction(() => {
          this.hearings = hearings;
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

  private uniqueValues(field: ParoleHearingFilterField): Array<string> {
    return Array.from(new Set((this.hearings ?? []).map((h) => h[field])));
  }

  setSearchQuery(query: string): void {
    this.searchQuery = query;
  }

  get docketSubheading(): string | undefined {
    return this.paroleStore.config.docketSubheading;
  }

  get docketSearchEnabled(): boolean {
    return Boolean(this.paroleStore.config.docketSearchEnabled);
  }

  trackFilterDropdownOpened(): void {
    // No analytics tracking for the Parole docket yet.
  }

  numItems(type: FilterType, field: FilterField, option: FilterOption): number {
    if (type !== "parole") return 0;

    return (this.hearings ?? []).filter(
      (h) => h[field as ParoleHearingFilterField] === option.value,
    ).length;
  }

  get filteredHearings(): Array<ParoleHearing> {
    const selected = this.filterStore.selectedFilters;
    const query = this.searchQuery.trim().toLowerCase();
    return (this.hearings ?? []).filter((hearing) => {
      if (
        query &&
        !hearing.individualName.toLowerCase().includes(query) &&
        !hearing.docId.toLowerCase().includes(query)
      )
        return false;

      return Object.entries(selected).every(([field, values]) => {
        if (!values || values.length === 0) return true;
        return values.includes(hearing[field as ParoleHearingFilterField]);
      });
    });
  }

  get totalHearingsCount(): number {
    return this.hearings?.length ?? 0;
  }
}
