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

import { flowResult, makeAutoObservable, runInAction } from "mobx";
import moment from "moment";

import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import { SAR } from "../api";
import { GenderToDisplayName } from "../components/CaseDetails/constants";
import { MutableSARAttributes } from "../components/CaseDetails/types";
import {
  EditableChargeField,
  REQUIRED_FIELD_IDS,
} from "../components/CaseInformation/constants";
import { SentencingStore } from "../datastores/SentencingStore";
import { FormCharge } from "../datastores/types";

export class SARDetailsPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  sarData?: SAR;

  constructor(
    public readonly sentencingStore: SentencingStore,
    public sarId: string,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.sentencingStore.staffStore.staffInfo === undefined)
            throw new Error("Failed to load staff details");
        },
        () => {
          if (this.sarData === undefined)
            throw new Error("Failed to load SAR details");
        },
      ],
      populate: async () => {
        if (!this.sentencingStore.staffStore.staffInfo) {
          await flowResult(this.sentencingStore.staffStore.loadStaffInfo());
        }
        const data = await flowResult(
          this.sentencingStore.apiClient.getSARDetails(this.sarId),
        );
        this.sarData = data;
      },
    });
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get staffPseudoId(): string | undefined {
    return this.sentencingStore.staffPseudoId;
  }

  get SARAttributes() {
    if (!this.sarData) return {};

    return {
      client: this.sarData.client,
      externalId: this.sarData.client?.externalId,
      age: this.sarData.age,
      charges: this.sarData.charges,
      dueDate: this.sarData.dueDate,
    };
  }

  /** Formatted gender for display */
  get formattedGender(): string | undefined {
    const gender = this.sarData?.client?.gender;
    return gender ? GenderToDisplayName[gender] : undefined;
  }

  /** Extract offense names from charges */
  get offenseNames(): string[] {
    if (!this.sarData?.charges || !Array.isArray(this.sarData.charges)) {
      return [];
    }
    return this.sarData.charges.map((charge) => charge.offense).filter(Boolean);
  }

  /** Get charges array - sorted by ID for consistent ordering */
  get charges(): FormCharge[] {
    if (!this.sarData?.charges) return [];
    return [...this.sarData.charges].sort((a, b) => a.id.localeCompare(b.id));
  }

  /** Get client attributes for Case Information section */
  get clientAttributes() {
    return this.sarData?.client;
  }

  /** Check if defendant declined to participate */
  get defendantDeclinedToParticipate(): boolean {
    return this.sarData?.defendantDeclinedToParticipate ?? false;
  }

  /**
   * Calculate overall SAR progress
   * For now: only tracks Case Information (5 required fields per charge)
   * TODO(#11083): Add other sections to progress tracking
   *
   * Returns percentage: 0-100
   */
  get overallProgress(): number {
    if (this.charges.length === 0) return 0;

    const totalRequiredFields = this.charges.length * REQUIRED_FIELD_IDS.length;
    let completedFields = 0;

    this.charges.forEach((charge) => {
      REQUIRED_FIELD_IDS.forEach((fieldId) => {
        const value = charge[fieldId as keyof typeof charge];
        if (value !== null && value !== undefined && value !== "") {
          completedFields++;
        }
      });
    });

    return (completedFields / totalRequiredFields) * 100;
  }

  /** Update defendant declined to participate */
  async updateDefendantDeclined(value: boolean): Promise<void> {
    if (!this.sarData) return;

    // Update local state immediately
    this.sarData.defendantDeclinedToParticipate = value;

    // Persist to backend
    const updates: Partial<MutableSARAttributes> = {
      defendantDeclinedToParticipate: value,
    };
    await this.sentencingStore.apiClient.updateSARDetails(this.sarData.id, updates);
  }

  /** Update a charge field */
  async updateChargeField<K extends EditableChargeField>(
    chargeId: string,
    fieldId: K,
    value: string,
  ): Promise<void> {
    if (!this.sarData?.charges) return;

    // Find the charge in the source data (not the getter)
    const charge = this.sarData.charges.find((c) => c.id === chargeId) as FormCharge | undefined;
    if (!charge) return;

    // Store original value for potential rollback
    const originalValue = charge[fieldId];

    // Update local state immediately for instant UI feedback
    runInAction(() => {
      charge[fieldId] = value;
    });

    // Persist to backend
    try {
      const updates: Partial<MutableSARAttributes> = {
        charges: this.sarData.charges.map((c) => ({
          id: c.id,
          prosecutingAttorney: c.prosecutingAttorney ?? null,
          defenseAttorney: c.defenseAttorney ?? null,
          pleaAgreement: c.pleaAgreement ?? null,
          pleaDate: c.pleaDate ? moment(c.pleaDate).toDate() : null,
          sentencingDate: c.sentencingDate ? moment(c.sentencingDate).toDate() : null,
        })),
      };
      await this.sentencingStore.apiClient.updateSARDetails(this.sarData.id, updates);
    } catch (error) {
      // Revert local change on error
      runInAction(() => {
        charge[fieldId] = originalValue;
      });
      // Re-throw to allow UI to handle (e.g., show error toast)
      throw error;
    }
  }
}
