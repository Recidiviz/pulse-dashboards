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

import { addDays, addMonths, addYears, isBefore, min } from "date-fns";
import { makeAutoObservable } from "mobx";
import { z } from "zod";

import { UserStore } from "~@jii/data";
import { dateStringSchema, ResidentRecord } from "~datatypes";

import { UsNeCopy } from "../../configs/copy";

export type ChecklistState = Record<string, boolean>;

const savedChecklistDataSchema = z.object({
  state: z.record(z.boolean()),
  timestamp: dateStringSchema,
  residentId: z.string(),
});

export type SavedChecklistData = z.infer<typeof savedChecklistDataSchema>;

export class UsNeReentryChecklistPresenter {
  private savedState: ChecklistState = {};
  private liveState: ChecklistState = {};
  lastSaved?: Date;

  constructor(
    private readonly resident: ResidentRecord,
    private readonly userStore: UserStore,
    private readonly copy: UsNeCopy["reentryChecklist"],
  ) {
    makeAutoObservable(this);
    // Load saved data once during initialization
    this.loadSavedData();
  }

  /**
   * In case we ever remove a question, this lets us filter what's saved
   */
  get displayedItemKeys(): string[] {
    return this.copy.sections.flatMap((section) =>
      section.items.map((item) => item.id),
    );
  }

  get isDirty(): boolean {
    // Compare live state to saved state for displayed items only
    for (const key of this.displayedItemKeys) {
      if ((this.liveState[key] ?? false) !== (this.savedState[key] ?? false)) {
        return true;
      }
    }
    return false;
  }

  get residentId() {
    return this.resident.pseudonymizedId;
  }

  /**
   * Helper to get the closest date between PED and TRD
   */
  private getClosestPedOrTrd(): Date | null {
    const metadata = this.resident.metadata;
    if (metadata.stateCode !== "US_NE") return null;

    const ped = metadata.paroleEligibilityDate;
    const trd = metadata.tentativeReleaseDate;

    if (!ped && !trd) return null;
    if (!ped) return trd;
    if (!trd) return ped;

    // Return whichever date is sooner
    return min([ped, trd]);
  }

  /**
   * Gets the current live state of the checklist
   */
  get checklistState(): ChecklistState {
    return this.liveState;
  }

  /**
   * Toggles a checkbox item in the live state
   */
  toggleCheckbox(itemId: string): void {
    this.liveState = {
      ...this.liveState,
      [itemId]: !this.liveState[itemId],
    };
  }

  /**
   * Determines if a section is enabled based on release date proximity
   */
  isSectionEnabled(sectionId: string): boolean {
    const closestDate = this.getClosestPedOrTrd();
    const now = new Date();

    switch (sectionId) {
      case "early":
        return true; // Always enabled
      case "3-years":
        return !!closestDate && isBefore(closestDate, addYears(now, 3));
      case "6-months":
        return !!closestDate && isBefore(closestDate, addMonths(now, 6));
      case "120-days":
        return !!closestDate && isBefore(closestDate, addDays(now, 120));
      default:
        return true;
    }
  }

  /**
   * Calculates progress metrics for the checklist
   */
  get progressMetrics() {
    const totalItems = this.copy.sections.reduce(
      (acc, section) => acc + section.items.length,
      0,
    );
    const completedItems = Object.entries(this.liveState).filter(
      ([key, value]) => value && this.displayedItemKeys.includes(key),
    ).length;
    const completedSections = this.copy.sections.filter((section) =>
      section.items.every((item) => this.liveState[item.id]),
    ).length;

    return {
      totalItems,
      completedItems,
      completedSections,
      totalSections: this.copy.sections.length,
    };
  }

  private get storageKey() {
    return "usNeReentryChecklistState" as const;
  }

  /**
   * Loads saved data from localStorage once
   */
  private loadSavedData(): void {
    const saved = this.userStore.getUserProperty(this.storageKey);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      const validated = savedChecklistDataSchema.parse(parsed);

      // Only use data if it matches the current resident
      if (validated.residentId === this.residentId) {
        this.savedState = validated.state;
        this.liveState = validated.state;
        this.lastSaved = validated.timestamp;
      }
    } catch {
      // JSON parse error or Zod validation failed - ignore and start fresh
    }
  }

  /**
   * Saves the current live state of the checklist to localStorage
   */
  async saveState(): Promise<void> {
    const timestamp = new Date();
    const dataToSave: z.input<typeof savedChecklistDataSchema> = {
      state: this.liveState,
      timestamp: timestamp.toISOString(),
      residentId: this.residentId,
    };

    this.userStore.setUserProperty(this.storageKey, JSON.stringify(dataToSave));
    this.loadSavedData();
  }
}
