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
import { KEY_CONSIDERATIONS_REQUIRED_FIELDS } from "../components/KeyConsiderations/constants";
import { SARSection } from "../components/SARDetails";
import { SectionStatus } from "../components/SARDetails/StatusIndicator";
import { SentencingStore } from "../datastores/SentencingStore";
import { FormCharge } from "../datastores/types";

// Type for SAR metadata structure
type SARMetadataSections = {
  keyConsiderations: {
    areasOfNeed: { skipped: boolean };
    mitigatingFactors: { skipped: boolean };
  };
  defendantVersion: {
    skipped: boolean;
  };
  victimImpactStatement: {
    skipped: boolean;
  };
  recommendation: {
    skipped: boolean;
  };
};

type SARMetadata = {
  sections: SARMetadataSections;
  version?: "1.0";
};

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

    // Case Information section
    const caseInfoTotalFields = this.charges.length * REQUIRED_FIELD_IDS.length;
    let caseInfoCompletedFields = 0;

    this.charges.forEach((charge) => {
      REQUIRED_FIELD_IDS.forEach((fieldId) => {
        const value = charge[fieldId as keyof typeof charge];
        if (value !== null && value !== undefined && value !== "") {
          caseInfoCompletedFields++;
        }
      });
    });

    // Key Considerations section
    const keyConsiderationsTotalFields =
      KEY_CONSIDERATIONS_REQUIRED_FIELDS.length;
    let keyConsiderationsCompletedFields = 0;

    KEY_CONSIDERATIONS_REQUIRED_FIELDS.forEach((fieldId) => {
      if (fieldId === "needsToBeAddressed") {
        // Count as complete if field has values OR is skipped
        const hasValues =
          this.sarData?.needsToBeAddressed &&
          this.sarData.needsToBeAddressed.length > 0;
        if (hasValues || this.needsSkipped) {
          keyConsiderationsCompletedFields++;
        }
      } else if (fieldId === "mitigatingFactors") {
        // Count as complete if field has values OR is skipped
        const hasValues =
          this.sarData?.mitigatingFactors &&
          this.sarData.mitigatingFactors.length > 0;
        if (hasValues || this.factorsSkipped) {
          keyConsiderationsCompletedFields++;
        }
      }
    });

    // Total progress across both sections
    const totalFields = caseInfoTotalFields + keyConsiderationsTotalFields;
    const completedFields =
      caseInfoCompletedFields + keyConsiderationsCompletedFields;

    return (completedFields / totalFields) * 100;
  }

  /**
   * Calculate SAR status based on completion of required fields
   * Returns: "Complete" | "InProgress" | "NotYetStarted"
   */
  get calculatedStatus(): "Complete" | "InProgress" | "NotYetStarted" {
    const progress = this.overallProgress;
    if (progress === 100) return "Complete";
    if (progress > 0) return "InProgress";
    return "NotYetStarted";
  }

  /** Update defendant declined to participate */
  async updateDefendantDeclined(value: boolean): Promise<void> {
    if (!this.sarData) return;

    // Update local state immediately
    runInAction(() => {
      if (this.sarData) {
        this.sarData.defendantDeclinedToParticipate = value;
      }
    });

    // Persist to backend with updated status
    const updates: Partial<MutableSARAttributes> = {
      defendantDeclinedToParticipate: value,
      status: this.calculatedStatus,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.sarData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      if (this.sarData) {
        this.sarData.status = this.calculatedStatus;
      }
    });
  }

  /** Update a charge field */
  async updateChargeField<K extends EditableChargeField>(
    chargeId: string,
    fieldId: K,
    value: string,
  ): Promise<void> {
    if (!this.sarData?.charges) return;

    // Find the charge in the source data (not the getter)
    const charge = this.sarData.charges.find((c) => c.id === chargeId) as
      | FormCharge
      | undefined;
    if (!charge) return;

    // Store original value for potential rollback
    const originalValue = charge[fieldId];

    // Update local state immediately for instant UI feedback
    runInAction(() => {
      charge[fieldId] = value;
    });

    // Persist to backend with updated status
    try {
      const updates: Partial<MutableSARAttributes> = {
        charges: this.sarData.charges.map((c) => ({
          id: c.id,
          prosecutingAttorney: c.prosecutingAttorney ?? null,
          defenseAttorney: c.defenseAttorney ?? null,
          pleaAgreement: c.pleaAgreement ?? null,
          pleaDate: c.pleaDate ? moment(c.pleaDate).toDate() : null,
          sentencingDate: c.sentencingDate
            ? moment(c.sentencingDate).toDate()
            : null,
        })),
        status: this.calculatedStatus,
      };
      await this.sentencingStore.apiClient.updateSARDetails(
        this.sarData.id,
        updates,
      );

      // Update local status after successful save
      runInAction(() => {
        if (this.sarData) {
          this.sarData.status = this.calculatedStatus;
        }
      });
    } catch (error) {
      // Revert local change on error
      runInAction(() => {
        charge[fieldId] = originalValue;
      });
      // Re-throw to allow UI to handle (e.g., show error toast)
      throw error;
    }
  }

  /** Update needs to be addressed */
  async updateNeedsToBeAddressed(values: string[]): Promise<void> {
    if (!this.sarData) return;

    // Update local state immediately
    runInAction(() => {
      if (this.sarData) {
        this.sarData.needsToBeAddressed = values as SAR["needsToBeAddressed"];
      }
    });

    // Persist to backend with updated status
    const updates: Partial<MutableSARAttributes> = {
      needsToBeAddressed: values as SAR["needsToBeAddressed"],
      status: this.calculatedStatus,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.sarData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      if (this.sarData) {
        this.sarData.status = this.calculatedStatus;
      }
    });
  }

  /** Update other need to be addressed */
  async updateOtherNeedToBeAddressed(value: string): Promise<void> {
    if (!this.sarData) return;

    runInAction(() => {
      if (this.sarData) {
        this.sarData.otherNeedToBeAddressed = value;
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      otherNeedToBeAddressed: value,
      status: this.calculatedStatus,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.sarData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      if (this.sarData) {
        this.sarData.status = this.calculatedStatus;
      }
    });
  }

  /** Update mitigating factors */
  async updateMitigatingFactors(values: string[]): Promise<void> {
    if (!this.sarData) return;

    runInAction(() => {
      if (this.sarData) {
        this.sarData.mitigatingFactors = values as SAR["mitigatingFactors"];
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      mitigatingFactors: values as SAR["mitigatingFactors"],
      status: this.calculatedStatus,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.sarData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      if (this.sarData) {
        this.sarData.status = this.calculatedStatus;
      }
    });
  }

  /** Update other mitigating factor */
  async updateOtherMitigatingFactor(value: string): Promise<void> {
    if (!this.sarData) return;

    runInAction(() => {
      if (this.sarData) {
        this.sarData.otherMitigatingFactor = value;
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      otherMitigatingFactor: value,
      status: this.calculatedStatus,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.sarData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      if (this.sarData) {
        this.sarData.status = this.calculatedStatus;
      }
    });
  }

  /** Update field skip state - generalized for any section/field (future-proof) */
  async updateFieldSkipped(
    section: string,
    skipped: boolean,
    subSection?: string | undefined,
  ): Promise<void> {
    if (!this.sarData) return;

    // Update metadata with proper structure
    const currentMetadata =
      (this.sarData.metadata as Partial<SARMetadata> | null) ?? {};
    const currentSections = currentMetadata.sections;

    const updatedMetadata: SARMetadata = {
      ...currentMetadata,
      version: "1.0",
      sections: {
        // Preserve all existing sections to satisfy backend validation
        keyConsiderations: {
          areasOfNeed:
            subSection === "areasOfNeed"
              ? { skipped }
              : currentSections?.keyConsiderations?.areasOfNeed ?? {
                  skipped: false,
                },
          mitigatingFactors:
            subSection === "mitigatingFactors"
              ? { skipped }
              : currentSections?.keyConsiderations?.mitigatingFactors ?? {
                  skipped: false,
                },
        },
        defendantVersion: currentSections?.defendantVersion ?? {
          skipped: false,
        },
        victimImpactStatement: currentSections?.victimImpactStatement ?? {
          skipped: false,
        },
        recommendation: currentSections?.recommendation ?? {
          skipped: false,
        },
      },
    };

    // Update local state immediately for instant UI feedback
    runInAction(() => {
      if (this.sarData) {
        this.sarData.metadata = updatedMetadata;
      }
    });

    // Persist to backend with updated status
    await this.sentencingStore.apiClient.updateSARDetails(this.sarData.id, {
      metadata: updatedMetadata,
      status: this.calculatedStatus,
    } as Partial<MutableSARAttributes>);

    // Update local status after successful save
    runInAction(() => {
      if (this.sarData) {
        this.sarData.status = this.calculatedStatus;
      }
    });
  }

  // Computed properties for skip state
  get needsSkipped(): boolean {
    const metadata = this.sarData?.metadata as
      | Partial<SARMetadata>
      | null
      | undefined;
    return (
      metadata?.["sections"]?.["keyConsiderations"]?.["areasOfNeed"]?.[
        "skipped"
      ] === true
    );
  }

  get factorsSkipped(): boolean {
    const metadata = this.sarData?.metadata as
      | Partial<SARMetadata>
      | null
      | undefined;
    return (
      metadata?.["sections"]?.["keyConsiderations"]?.["mitigatingFactors"]?.[
        "skipped"
      ] === true
    );
  }

  /** Get section statuses for navigation indicators */
  get sectionStatuses(): Record<string, SectionStatus> {
    return {
      [SARSection.CASE_INFORMATION]: this.getCaseInfoStatus(),
      [SARSection.KEY_CONSIDERATIONS]: this.getKeyConsiderationsStatus(),
      // Future sections will be added here
    };
  }

  /** Get Case Information section status */
  private getCaseInfoStatus(): SectionStatus {
    if (this.charges.length === 0) return "empty";

    let hasAnyValue = false;
    let allFieldsComplete = true;

    this.charges.forEach((charge) => {
      REQUIRED_FIELD_IDS.forEach((fieldId) => {
        const value = charge[fieldId as keyof typeof charge];
        if (value !== null && value !== undefined && value !== "") {
          hasAnyValue = true;
        } else {
          allFieldsComplete = false;
        }
      });
    });

    if (!hasAnyValue) return "empty";
    if (allFieldsComplete) return "complete";
    return "incomplete";
  }

  /** Get Key Considerations section status */
  private getKeyConsiderationsStatus(): SectionStatus {
    const needsValues = this.sarData?.needsToBeAddressed;
    const mitigatingValues = this.sarData?.mitigatingFactors;

    const hasNeeds = needsValues && needsValues.length > 0;
    const hasFactors = mitigatingValues && mitigatingValues.length > 0;

    // If both fields are empty and not skipped, show nothing (empty)
    if (
      !hasNeeds &&
      !hasFactors &&
      !this.needsSkipped &&
      !this.factorsSkipped
    ) {
      return "empty";
    }

    // If both fields are filled OR both are skipped, complete (no icon)
    const needsComplete = hasNeeds || this.needsSkipped;
    const factorsComplete = hasFactors || this.factorsSkipped;

    if (needsComplete && factorsComplete) {
      return "complete";
    }

    // If only one field is filled/skipped, incomplete (show warning)
    return "incomplete";
  }
}
