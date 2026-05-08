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

import { captureException } from "@sentry/react";
import { groups, rollup } from "d3-array";
import { max } from "date-fns";
import { sortBy } from "lodash";
import { makeAutoObservable, runInAction } from "mobx";

import { DataAPI } from "~@jii/data";
import { ResidentRecord } from "~datatypes";
import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import type { Program, ProgramCatalogProps } from "../types";

export class ProgramCatalogPresenter implements Hydratable {
  programs?: Program[];

  // Filter state (observable)
  selectedCategory?: string;
  selectedFacility?: string;
  showOnlyEarnCredits = false;
  showOnlyStarred = false;

  selectedProgram?: Program;

  constructor(
    private readonly resident: ResidentRecord,
    private readonly apiClient: DataAPI,
    readonly config: ProgramCatalogProps,
  ) {
    makeAutoObservable(this, { config: false }, { autoBind: true });

    this.hydrator = new HydratesFromSource({
      expectPopulated: [this.expectProgramsPopulated],
      populate: async () => {
        await this.populatePrograms();
      },
    });
  }

  get residentId() {
    return this.resident.pseudonymizedId;
  }

  private hydrator: HydratesFromSource;

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  private async populatePrograms() {
    this.programs = await this.apiClient.trpc.resident.getPrograms.query({
      pseudonymizedId: this.residentId,
    });
  }

  private expectProgramsPopulated() {
    if (this.programs === undefined) {
      throw new Error("Failed to populate programs");
    }
  }

  // Computed properties

  get lastUpdatedDate(): Date | null {
    if (!this.programs || this.programs.length === 0) return null;

    const dates: Date[] = this.programs
      .map((p) => p.dateAddedOrUpdated)
      .filter((d): d is Date => d instanceof Date);

    if (this.config.dataLoadBaselineDate) {
      dates.push(this.config.dataLoadBaselineDate);
    }

    return dates.length ? max(dates) : null;
  }

  get categories(): {
    name: string;
    programs: Program[];
  }[] {
    if (!this.programs) return [];
    const unsortedCategories = groups(
      this.filteredPrograms,
      (p) => p.category,
    ).map(([name, programs]) => ({ name, programs }));
    return sortBy(unsortedCategories, "name");
  }

  get facilities(): string[] {
    if (!this.programs) return [];
    const facilities = new Set(
      this.programs.flatMap((p) => p.facilitiesOffered),
    );
    // Remove "All facilities" from dropdown options - it's a special value meaning
    // "available at all facilities", not a real facility to filter by
    facilities.delete("All facilities");
    return Array.from(facilities).sort();
  }

  get filteredPrograms(): Program[] {
    if (!this.programs) return [];

    return this.programs.filter((program) => {
      // Filter broken programs
      if (
        program.title === "" ||
        (this.config.showCredits && isNaN(program.numberOfDaysThatCanBeEarned))
      ) {
        return false;
      }

      // Category filter
      if (this.selectedCategory && program.category !== this.selectedCategory) {
        return false;
      }

      // Facility filter
      // When a specific facility is selected, also show programs available at "All facilities"
      if (
        this.selectedFacility &&
        !program.facilitiesOffered.includes(this.selectedFacility) &&
        !program.facilitiesOffered.includes("All facilities")
      ) {
        return false;
      }

      // Earn credits filter
      if (
        this.showOnlyEarnCredits &&
        program.numberOfDaysThatCanBeEarned <= 0
      ) {
        return false;
      }

      // Starred filter
      if (this.showOnlyStarred && !program.isStarred) {
        return false;
      }

      return true;
    });
  }

  get totalProgramsByCategory(): Map<string, number> {
    return rollup(
      this.programs ?? [],
      (v) => v.length,
      (d) => d.category,
    );
  }

  get filteredProgramCount(): number {
    return this.filteredPrograms.length;
  }

  // Actions

  setSelectedCategory(category?: string): void {
    this.selectedCategory = category;
  }

  setSelectedFacility(facility?: string): void {
    this.selectedFacility = facility;
  }

  setShowOnlyEarnCredits(value: boolean): void {
    this.showOnlyEarnCredits = value;
  }

  setShowOnlyStarred(value: boolean): void {
    this.showOnlyStarred = value;
  }

  async toggleStarred(program: Program): Promise<void> {
    if (!this.programs) return;

    const isCurrentlyStarred = program.isStarred;

    // Optimistic update - update the program directly
    program.isStarred = !isCurrentlyStarred;

    try {
      // Persist to backend
      await this.apiClient.trpc.resident.setStarredProgram.mutate({
        pseudonymizedId: this.residentId,
        programId: program.programId,
        title: program.title,
        isStarred: !isCurrentlyStarred,
      });
    } catch (error) {
      // Revert optimistic update on error
      runInAction(() => {
        program.isStarred = isCurrentlyStarred;
      });
      captureException(error);
    }
  }

  setSelectedProgram(program?: Program): void {
    this.selectedProgram = program;
  }

  clearAllFilters(): void {
    this.selectedCategory = undefined;
    this.selectedFacility = undefined;
    this.showOnlyEarnCredits = false;
    this.showOnlyStarred = false;
  }

  get hasActiveFilters(): boolean {
    return (
      !!this.selectedCategory ||
      !!this.selectedFacility ||
      this.showOnlyEarnCredits ||
      this.showOnlyStarred
    );
  }
}
