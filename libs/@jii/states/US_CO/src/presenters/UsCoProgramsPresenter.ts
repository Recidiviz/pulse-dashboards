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

import * as Sentry from "@sentry/react";
import { TRPCClientError } from "@trpc/client";
import { group, rollup } from "d3-array";
import { max, parseISO } from "date-fns";
import { makeAutoObservable, runInAction } from "mobx";

import { DataAPI } from "~@jii/data";
import type { JiiResidentAppRouterOutputs } from "~@jii/trpc-types";
import { ResidentRecord } from "~datatypes";
import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

export type UsCoProgram =
  JiiResidentAppRouterOutputs["state"]["usCo"]["getPrograms"][number];

export class UsCoProgramsPresenter implements Hydratable {
  programs?: UsCoProgram[];

  // Filter state (observable)
  selectedCategory?: string;
  selectedFacility?: string;
  showOnlyEarnCredits = false;
  showOnlyStarred = false;

  constructor(
    private readonly resident: ResidentRecord,
    private readonly apiClient: DataAPI,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });

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
    this.programs = await this.apiClient.trpc.state.usCo.getPrograms.query({
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

    return max([
      parseISO("2026-02-02"), // Initial data load date
      ...this.programs
        .map((p) => p.dateAddedOrUpdated)
        .filter((d) => d !== undefined && d instanceof Date),
    ]);
  }

  get categories(): string[] {
    if (!this.programs) return [];
    const categories = new Set(this.programs.map((p) => p.category));
    return Array.from(categories).sort();
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

  get filteredPrograms(): UsCoProgram[] {
    if (!this.programs) return [];

    return this.programs.filter((program) => {
      // Filter broken programs
      if (program.title === "" || isNaN(program.numberOfDaysThatCanBeEarned)) {
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

  get programsByCategory(): Map<string, UsCoProgram[]> {
    return group(this.filteredPrograms, (p) => p.category);
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

  async toggleStarred(program: UsCoProgram): Promise<void> {
    if (!this.programs) return;

    const isCurrentlyStarred = program.isStarred;

    // Optimistic update - update the program directly
    program.isStarred = !isCurrentlyStarred;

    try {
      // Persist to backend
      await this.apiClient.trpc.state.usCo.setStarredProgram.mutate({
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
      if (
        !(error instanceof TRPCClientError) ||
        error.data.code !== "FORBIDDEN"
      ) {
        Sentry.captureException(error);
      }
    }
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
