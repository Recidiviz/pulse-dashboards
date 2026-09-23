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

import { addDays, startOfToday, subDays } from "date-fns";
import { makeAutoObservable } from "mobx";

import { ParoleHearing } from "~datatypes";
import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { FilterField, FilterOption, FilterType } from "../../core/models/types";
import { FilterPresenter } from "../../FilterStore/FilterPresenter";
import { formatDateToISO } from "../../utils";
import { ParoleFilterStore } from "../ParoleFilterStore";
import { ParoleStore } from "../ParoleStore";
import { formatDocId } from "../utils";

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
          if (this.paroleStore.hearings === undefined)
            throw new Error("Failed to populate Parole hearings");
        },
      ],
      populate: () => this.paroleStore.populateHearings(),
    });
  }

  private hydrator: HydratesFromSource;

  get hydrationState() {
    return this.hydrator.hydrationState;
  }

  hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  /**
   * The hearings this docket shows: the store's cached set, narrowed to the
   * tenant's `docketWindowDaysBefore`/`docketWindowDaysAfter`. Everything
   * else on this presenter derives from here, so the filter options,
   * counts, and rows describe the same hearings.
   */
  private get hearingsInWindow(): Array<ParoleHearing> {
    const hearings = this.paroleStore.hearings ?? [];
    const { docketWindowDaysAfter, docketWindowDaysBefore } =
      this.paroleStore.config;
    if (docketWindowDaysAfter === undefined) return hearings;

    // hearingDate is an ISO YYYY-MM-DD string, which orders correctly as a
    // plain string compare -- no Date parsing, no timezone questions.
    const firstDay = formatDateToISO(
      subDays(startOfToday(), docketWindowDaysBefore ?? 0),
    );
    const lastDay = formatDateToISO(
      addDays(startOfToday(), docketWindowDaysAfter),
    );
    return hearings.filter(
      (hearing) =>
        hearing.hearingDate >= firstDay && hearing.hearingDate <= lastDay,
    );
  }

  private uniqueValues(field: ParoleHearingFilterField): Array<string> {
    return Array.from(new Set(this.hearingsInWindow.map((h) => h[field])));
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

    return this.hearingsInWindow.filter(
      (h) => h[field as ParoleHearingFilterField] === option.value,
    ).length;
  }

  get filteredHearings(): Array<ParoleHearing> {
    const selected = this.filterStore.selectedFilters;
    const query = this.searchQuery.trim().toLowerCase();
    return this.hearingsInWindow.filter((hearing) => {
      if (
        query &&
        !hearing.individualName.toLowerCase().includes(query) &&
        // Matched against the "DOC-"-prefixed display form of the id that's
        // actually on screen (displayId, not the routing docId) so typing what
        // the user sees still matches.
        !formatDocId(hearing.displayId).toLowerCase().includes(query)
      )
        return false;

      return Object.entries(selected).every(([field, values]) => {
        if (!values || values.length === 0) return true;
        return values.includes(hearing[field as ParoleHearingFilterField]);
      });
    });
  }

  get totalHearingsCount(): number {
    return this.hearingsInWindow.length;
  }
}
