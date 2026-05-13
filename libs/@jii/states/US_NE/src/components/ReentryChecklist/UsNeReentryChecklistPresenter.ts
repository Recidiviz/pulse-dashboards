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

import { captureException } from "@sentry/react";
import { addDays, addMonths, addYears, isBefore, min } from "date-fns";
import { flowResult, makeAutoObservable } from "mobx";

import { DataAPI, ResidentFlags } from "~@jii/data";
import type { JiiResidentAppRouterOutputs } from "~@jii/trpc-types";
import { ResidentRecord } from "~datatypes";
import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import {
  UsNeReentryChecklistItemId,
  UsNeReentryChecklistSectionId,
  usNeReentryChecklistSpec,
} from "./usNeReentryChecklistSpec";

type ReentryChecklistData =
  JiiResidentAppRouterOutputs["state"]["usNe"]["getReentryChecklist"];
type ChecklistState = ReentryChecklistData["questions"];

export type UsNeReentryChecklistItemState = {
  id: UsNeReentryChecklistItemId;
  isChecked: boolean;
  isVerifiable: boolean;
};

export type UsNeReentryChecklistSectionState = {
  id: UsNeReentryChecklistSectionId;
  isEnabled: boolean;
  items: UsNeReentryChecklistItemState[];
};

export class UsNeReentryChecklistPresenter implements Hydratable {
  private savedState?: ChecklistState;
  private liveState: ChecklistState = {};
  lastSaved?: Date;
  isSaving = false;
  private hydrator: HydratesFromSource;
  writeError?: string;

  constructor(
    private readonly resident: ResidentRecord,
    private readonly apiClient: DataAPI,
    private readonly residentFlags: ResidentFlags,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });

    this.hydrator = new HydratesFromSource({
      expectPopulated: [this.expectChecklistDataPopulated],
      populate: flowResult(this.loadSavedData),
    });
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  /**
   * In case we ever remove a question, this lets us filter what's saved
   */
  get displayedItemKeys(): string[] {
    return usNeReentryChecklistSpec.sections.flatMap((section) =>
      section.items.map((item) => item.id),
    );
  }

  get isDirty(): boolean {
    // Compare live state to saved state for displayed items only
    for (const key of this.displayedItemKeys) {
      if (
        (this.liveState[key] ?? false) !== (this.savedState?.[key] ?? false)
      ) {
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
   * Set of documentType strings present in the resident's criticalDocuments metadata
   */
  private get residentDocuments(): Set<string> {
    const metadata = this.resident.metadata;
    if (metadata.stateCode !== "US_NE") return new Set();
    return new Set(
      metadata.criticalDocuments
        .map((d) => d.documentType)
        .filter((t): t is string => t !== null),
    );
  }

  /**
   * Returns sections with their enabled state and per-item checked/verifiable state
   */
  get sections(): UsNeReentryChecklistSectionState[] {
    const { residentDocuments } = this;

    return usNeReentryChecklistSpec.sections.map((section) => ({
      id: section.id,
      isEnabled: this.isSectionEnabled(section.id),
      items: section.items.map((item) => {
        const docExists = !!item.documentTypes?.some((dt) =>
          residentDocuments.has(dt),
        );
        const isVerifiable =
          !!item.documentTypes && (!item.onlyVerifiableIfTrue || docExists);
        const isChecked = isVerifiable
          ? docExists
          : this.liveState[item.id] ?? false;
        return {
          id: item.id,
          isChecked,
          isVerifiable,
        };
      }),
    }));
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
  private isSectionEnabled(sectionId: string): boolean {
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
    const allItems = this.sections.flatMap((s) => s.items);

    return {
      totalItems: allItems.length,
      completedItems: allItems.filter((i) => i.isChecked).length,
      completedSections: this.sections.filter((s) =>
        s.items.every((i) => i.isChecked),
      ).length,
      totalSections: this.sections.length,
    };
  }

  /**
   * Loads saved data from the database once
   */
  private *loadSavedData() {
    const data: ReentryChecklistData =
      yield this.apiClient.trpc.state.usNe.getReentryChecklist.query({
        pseudonymizedId: this.residentId,
      });

    this.savedState = data.questions;
    this.liveState = data.questions;
    this.lastSaved = data.lastUpdated;
  }

  /**
   * Validates that checklist data has been populated
   */
  private expectChecklistDataPopulated() {
    if (this.savedState === undefined) {
      throw new Error("Failed to populate checklist data");
    }
  }

  /**
   * Saves the current live state of the checklist to the database
   */
  *saveState() {
    this.isSaving = true;
    this.writeError = undefined;

    try {
      const data: ReentryChecklistData =
        yield this.apiClient.trpc.state.usNe.updateReentryChecklist.mutate({
          pseudonymizedId: this.residentId,
          questions: this.liveState,
        });

      this.savedState = data.questions;
      this.liveState = data.questions;
      this.lastSaved = data.lastUpdated;
      this.isSaving = false;
    } catch (e) {
      captureException(e);
      this.writeError =
        e instanceof Error ? e.message : "An unknown error occurred";
      this.isSaving = false;
    }
  }
}
