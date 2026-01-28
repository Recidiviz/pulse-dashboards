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
import { OffenderAssessmentPresenter } from "./OffenderAssessmentPresenter";

// Type for SAR metadata structure
type SARMetadataSections = {
  keyConsiderations: {
    areasOfNeed: { skipped: boolean };
    mitigatingFactors: { skipped: boolean };
  };
  defendantStatement: {
    skipped: boolean;
    edited?: boolean;
  };
  victimImpactStatement: {
    skipped: boolean;
    edited?: boolean;
  };
  recommendation: {
    skipped: boolean;
    edited?: boolean;
  };
};

type SARMetadata = {
  sections: SARMetadataSections;
  version?: "1.0";
};

// Field counts for progress tracking
// These must stay in sync with the arrays used in overallProgress calculation
const PROGRESS_FIELD_COUNTS = {
  DEFENDANT_VERSION: 1, // defendantStatement
  VICTIM_IMPACT: 1, // victimImpactStatement
  RECOMMENDATION: 3, // communityStrategyRecommendation + homePlan + institutionalStrategyRecommendation
  OFFENDER_ASSESSMENT_SUMMARIES: 8, // 8 summary text fields
  OFFENDER_ASSESSMENT_FORM: 4, // levelOfEducation, fatherName, motherName, guardianName (excludes employedAtOffense - see note in overallProgress)
} as const;

const OFFENDER_ASSESSMENT_TOTAL =
  PROGRESS_FIELD_COUNTS.OFFENDER_ASSESSMENT_SUMMARIES +
  PROGRESS_FIELD_COUNTS.OFFENDER_ASSESSMENT_FORM; // 12

export class SARDetailsPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  SARData?: SAR;

  offenderAssessment: OffenderAssessmentPresenter;

  constructor(
    public readonly sentencingStore: SentencingStore,
    public sarId: string,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.offenderAssessment = new OffenderAssessmentPresenter(
      this,
      this.sentencingStore.apiClient,
    );
    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.sentencingStore.staffStore.staffInfo === undefined)
            throw new Error("Failed to load staff details");
        },
        () => {
          if (this.SARData === undefined)
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
        this.SARData = data;
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
    if (!this.SARData) return {};

    return {
      client: this.SARData.client,
      externalId: this.SARData.client?.externalId,
      age: this.SARData.age,
      charges: this.SARData.charges,
      dueDate: this.SARData.dueDate,
    };
  }

  /** Formatted gender for display */
  get formattedGender(): string | undefined {
    const gender = this.SARData?.client?.gender;
    return gender ? GenderToDisplayName[gender] : undefined;
  }

  /** Extract offense names from charges */
  get offenseNames(): string[] {
    if (!this.SARData?.charges || !Array.isArray(this.SARData.charges)) {
      return [];
    }
    return this.SARData.charges.map((charge) => charge.offense).filter(Boolean);
  }

  /** Get charges array - sorted by ID for consistent ordering */
  get charges(): FormCharge[] {
    if (!this.SARData?.charges) return [];
    return [...this.SARData.charges].sort((a, b) => a.id.localeCompare(b.id));
  }

  /** Get client attributes for Case Information section */
  get clientAttributes() {
    return this.SARData?.client;
  }

  /** Check if defendant declined to participate */
  get defendantDeclinedToParticipate(): boolean {
    return this.SARData?.defendantDeclinedToParticipate ?? false;
  }

  /**
   * Helper method to check if a text field is complete
   * A field is complete if it has content OR the section is skipped
   */
  private isTextFieldComplete(
    fieldValue: string | null | undefined,
    isSkipped: boolean,
  ): number {
    const hasContent = fieldValue && fieldValue.trim() !== "";
    return hasContent || isSkipped ? 1 : 0;
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
          this.SARData?.needsToBeAddressed &&
          this.SARData.needsToBeAddressed.length > 0;
        if (hasValues || this.needsSkipped) {
          keyConsiderationsCompletedFields++;
        }
      } else if (fieldId === "mitigatingFactors") {
        // Count as complete if field has values OR is skipped
        const hasValues =
          this.SARData?.mitigatingFactors &&
          this.SARData.mitigatingFactors.length > 0;
        if (hasValues || this.factorsSkipped) {
          keyConsiderationsCompletedFields++;
        }
      }
    });

    // Defendant's Version section
    const defendantVersionCompleted = this.isTextFieldComplete(
      this.SARData?.defendantStatement,
      this.defendantStatementSkipped,
    );

    // Victim Impact section
    const victimImpactCompleted = this.isTextFieldComplete(
      this.SARData?.victimImpactStatement,
      this.victimImpactStatementSkipped,
    );

    // Recommendation section (3 fields: community, home plan, and institutional)
    // Count all fields OR if section is skipped, count all as complete
    const recommendationCompleted = this.recommendationSkipped
      ? 3
      : this.isTextFieldComplete(
          this.SARData?.communityStrategyRecommendation,
          false,
        ) +
        this.isTextFieldComplete(this.SARData?.homePlan, false) +
        this.isTextFieldComplete(
          this.SARData?.institutionalStrategyRecommendation,
          false,
        );

    // Offender Assessment section (8 summary fields + 5 form fields)
    const offenderAssessmentSummaries = [
      this.SARData?.criminalHistorySummary,
      this.SARData?.employmentSummary,
      this.SARData?.familyAndSocialSupportSummary,
      this.SARData?.housingSummary,
      this.SARData?.drugHistorySummary,
      this.SARData?.peerAssociatesSummary,
      this.SARData?.criminalAttitudesSummary,
      this.SARData?.responsivityAndBarriersSummary,
    ];
    const offenderAssessmentSummariesCompleted =
      offenderAssessmentSummaries.filter(
        (summary) => summary && summary.trim() !== "",
      ).length;

    // Offender Assessment form fields (4 fields)
    // Note: employedAtOffense excluded because "Unknown" stores as null,
    // which is indistinguishable from "not yet answered"
    const offenderAssessmentFormFields = [
      this.SARData?.levelOfEducation,
      this.SARData?.client?.fatherName,
      this.SARData?.client?.motherName,
      this.SARData?.client?.guardianName,
    ];
    const offenderAssessmentFormCompleted = offenderAssessmentFormFields.filter(
      (field) =>
        field !== null && field !== undefined && field.toString().trim() !== "",
    ).length;

    const offenderAssessmentCompleted =
      offenderAssessmentSummariesCompleted + offenderAssessmentFormCompleted;

    // Total progress across all sections
    const totalFields =
      caseInfoTotalFields +
      keyConsiderationsTotalFields +
      PROGRESS_FIELD_COUNTS.DEFENDANT_VERSION +
      PROGRESS_FIELD_COUNTS.VICTIM_IMPACT +
      PROGRESS_FIELD_COUNTS.RECOMMENDATION +
      OFFENDER_ASSESSMENT_TOTAL;
    const completedFields =
      caseInfoCompletedFields +
      keyConsiderationsCompletedFields +
      defendantVersionCompleted +
      victimImpactCompleted +
      recommendationCompleted +
      offenderAssessmentCompleted;

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
    if (!this.SARData) return;

    // Update local state immediately
    runInAction(() => {
      if (this.SARData) {
        this.SARData.defendantDeclinedToParticipate = value;
      }
    });

    // Persist to backend with updated status
    const updates: Partial<MutableSARAttributes> = {
      defendantDeclinedToParticipate: value,
      status: this.calculatedStatus,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      if (this.SARData) {
        this.SARData.status = this.calculatedStatus;
      }
    });
  }

  /** Update a charge field */
  async updateChargeField<K extends EditableChargeField>(
    chargeId: string,
    fieldId: K,
    value: string,
  ): Promise<void> {
    if (!this.SARData?.charges) return;

    // Find the charge in the source data (not the getter)
    const charge = this.SARData.charges.find((c) => c.id === chargeId) as
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
        charges: this.SARData.charges.map((c) => ({
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
        this.SARData.id,
        updates,
      );

      // Update local status after successful save
      runInAction(() => {
        if (this.SARData) {
          this.SARData.status = this.calculatedStatus;
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
    if (!this.SARData) return;

    // Update local state immediately
    runInAction(() => {
      if (this.SARData) {
        this.SARData.needsToBeAddressed = values as SAR["needsToBeAddressed"];
      }
    });

    // Persist to backend with updated status
    const updates: Partial<MutableSARAttributes> = {
      needsToBeAddressed: values as SAR["needsToBeAddressed"],
      status: this.calculatedStatus,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      if (this.SARData) {
        this.SARData.status = this.calculatedStatus;
      }
    });
  }

  /** Update other need to be addressed */
  async updateOtherNeedToBeAddressed(value: string): Promise<void> {
    if (!this.SARData) return;

    runInAction(() => {
      if (this.SARData) {
        this.SARData.otherNeedToBeAddressed = value;
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      otherNeedToBeAddressed: value,
      status: this.calculatedStatus,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      if (this.SARData) {
        this.SARData.status = this.calculatedStatus;
      }
    });
  }

  /** Update mitigating factors */
  async updateMitigatingFactors(values: string[]): Promise<void> {
    if (!this.SARData) return;

    runInAction(() => {
      if (this.SARData) {
        this.SARData.mitigatingFactors = values as SAR["mitigatingFactors"];
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      mitigatingFactors: values as SAR["mitigatingFactors"],
      status: this.calculatedStatus,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      if (this.SARData) {
        this.SARData.status = this.calculatedStatus;
      }
    });
  }

  /** Update other mitigating factor */
  async updateOtherMitigatingFactor(value: string): Promise<void> {
    if (!this.SARData) return;

    runInAction(() => {
      if (this.SARData) {
        this.SARData.otherMitigatingFactor = value;
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      otherMitigatingFactor: value,
      status: this.calculatedStatus,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      if (this.SARData) {
        this.SARData.status = this.calculatedStatus;
      }
    });
  }

  /**
   * Generic helper to update a string field in SAR data
   * Handles local state update, API call, and status recalculation
   */
  private async updateStringField(
    fieldName:
      | "victimImpactStatement"
      | "defendantStatement"
      | "communityStrategyRecommendation"
      | "institutionalStrategyRecommendation"
      | "criminalHistorySummary"
      | "employmentSummary"
      | "familyAndSocialSupportSummary"
      | "housingSummary"
      | "homePlan"
      | "drugHistorySummary"
      | "peerAssociatesSummary"
      | "criminalAttitudesSummary"
      | "responsivityAndBarriersSummary",
    value: string,
  ): Promise<void> {
    if (!this.SARData) return;

    runInAction(() => {
      if (this.SARData) {
        this.SARData[fieldName] = value;
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      [fieldName]: value,
      status: this.calculatedStatus,
    };

    // Only include metadata if it exists to avoid validation errors
    if (this.metadata) {
      updates.metadata = this.metadata as SARMetadata;
    }

    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    runInAction(() => {
      if (this.SARData) {
        this.SARData.status = this.calculatedStatus;
      }
    });
  }

  /** Update victim impact statement */
  async updateVictimImpactStatement(value: string): Promise<void> {
    return this.updateStringField("victimImpactStatement", value);
  }

  /** Update defendant statement */
  async updateDefendantStatement(value: string): Promise<void> {
    return this.updateStringField("defendantStatement", value);
  }

  /** Update community strategy recommendation */
  async updateCommunityStrategyRecommendation(value: string): Promise<void> {
    return this.updateStringField("communityStrategyRecommendation", value);
  }

  /** Update institutional strategy recommendation */
  async updateInstitutionalStrategyRecommendation(
    value: string,
  ): Promise<void> {
    return this.updateStringField("institutionalStrategyRecommendation", value);
  }

  /** Update criminal history summary */
  async updateCriminalHistorySummary(value: string): Promise<void> {
    return this.updateStringField("criminalHistorySummary", value);
  }

  /** Update employment summary */
  async updateEmploymentSummary(value: string): Promise<void> {
    return this.updateStringField("employmentSummary", value);
  }

  /** Update family and social support summary */
  async updateFamilyAndSocialSupportSummary(value: string): Promise<void> {
    return this.updateStringField("familyAndSocialSupportSummary", value);
  }

  /** Update housing summary */
  async updateHousingSummary(value: string): Promise<void> {
    return this.updateStringField("housingSummary", value);
  }

  /** Update home plan */
  async updateHomePlan(value: string): Promise<void> {
    return this.updateStringField("homePlan", value);
  }

  /** Update peer associates summary */
  async updatePeerAssociatesSummary(value: string): Promise<void> {
    return this.updateStringField("peerAssociatesSummary", value);
  }

  /** Update criminal attitudes summary */
  async updateCriminalAttitudesSummary(value: string): Promise<void> {
    return this.updateStringField("criminalAttitudesSummary", value);
  }

  /** Update responsivity and barriers summary */
  async updateResponsivityAndBarriersSummary(value: string): Promise<void> {
    return this.updateStringField("responsivityAndBarriersSummary", value);
  }

  /** Update drug history summary */
  async updateDrugHistorySummary(value: string): Promise<void> {
    return this.updateStringField("drugHistorySummary", value);
  }

  /** Get drug history records array */
  get drugHistories(): NonNullable<SAR["drugHistories"]> {
    return this.SARData?.drugHistories ?? [];
  }

  /** Add new drug history record */
  async addDrugHistory(
    history: NonNullable<SAR["drugHistories"]>[number],
  ): Promise<void> {
    if (!this.SARData) return;

    const updated = [...this.drugHistories, history];
    await this.saveDrugHistories(updated);
  }

  /** Update drug history record at specific index */
  async updateDrugHistoryAtIndex(
    index: number,
    history: NonNullable<SAR["drugHistories"]>[number],
  ): Promise<void> {
    if (!this.SARData) return;
    if (index < 0 || index >= this.drugHistories.length) {
      return;
    }

    const updated = [...this.drugHistories];
    updated[index] = history;
    await this.saveDrugHistories(updated);
  }

  /** Delete drug history record at specific index */
  async deleteDrugHistory(index: number): Promise<void> {
    if (!this.SARData) return;

    if (index < 0 || index >= this.drugHistories.length) {
      return;
    }

    const updated = this.drugHistories.filter((_, i) => i !== index);
    await this.saveDrugHistories(updated);
  }

  /** Save entire drug history records array to backend */
  private async saveDrugHistories(
    histories: NonNullable<SAR["drugHistories"]>,
  ): Promise<void> {
    if (!this.SARData) return;

    runInAction(() => {
      if (this.SARData) {
        this.SARData.drugHistories = histories;
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      drugHistories: histories.map((h) => ({
        substance: h.substance ?? undefined,
        ageOfRegularUse: h.ageOfRegularUse ?? undefined,
        lastUse: h.lastUse ?? undefined,
        heaviestUse: h.heaviestUse ?? undefined,
        method: h.method ?? undefined,
      })),
    };

    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );
  }

  /** Update employed at offense */
  async updateEmployedAtOffense(value: boolean | null): Promise<void> {
    if (!this.SARData) return;

    const sarId = this.SARData.id;

    runInAction(() => {
      if (this.SARData) {
        this.SARData.employedAtOffense = value;
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      employedAtOffense: value,
    };

    // Only include metadata if it exists to avoid validation errors
    if (this.metadata) {
      updates.metadata = this.metadata as SARMetadata;
    }

    await this.sentencingStore.apiClient.updateSARDetails(sarId, updates);
  }

  /** Update level of education */
  async updateLevelOfEducation(value: SAR["levelOfEducation"]): Promise<void> {
    if (!this.SARData) return;

    runInAction(() => {
      if (this.SARData) {
        this.SARData.levelOfEducation = value;
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      levelOfEducation: value ?? undefined,
      status: this.calculatedStatus,
    };

    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    runInAction(() => {
      if (this.SARData) {
        this.SARData.status = this.calculatedStatus;
      }
    });
  }

  /** Update father name */
  async updateFatherName(value: string): Promise<void> {
    if (!this.SARData) return;

    runInAction(() => {
      if (this.SARData?.client) {
        this.SARData.client.fatherName = value;
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      fatherName: value,
      status: this.calculatedStatus,
    };

    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    runInAction(() => {
      if (this.SARData) {
        this.SARData.status = this.calculatedStatus;
      }
    });
  }

  /** Update mother name */
  async updateMotherName(value: string): Promise<void> {
    if (!this.SARData) return;

    runInAction(() => {
      if (this.SARData?.client) {
        this.SARData.client.motherName = value;
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      motherName: value,
      status: this.calculatedStatus,
    };

    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    runInAction(() => {
      if (this.SARData) {
        this.SARData.status = this.calculatedStatus;
      }
    });
  }

  /** Update guardian name */
  async updateGuardianName(value: string): Promise<void> {
    if (!this.SARData) return;

    runInAction(() => {
      if (this.SARData?.client) {
        this.SARData.client.guardianName = value;
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      guardianName: value,
      status: this.calculatedStatus,
    };

    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    runInAction(() => {
      if (this.SARData) {
        this.SARData.status = this.calculatedStatus;
      }
    });
  }

  /**
   * Mark a field as edited in local state immediately (synchronous)
   * This updates the UI instantly when user is typing
   * Called by SkippableTextArea on every keystroke (before debounce)
   * Guards against duplicate work - returns early if already marked
   */
  markFieldAsEditedLocally(section: string): void {
    if (!this.SARData) return;

    const currentMetadata = this.metadata ?? {};
    const currentSections = currentMetadata.sections;

    // Only update if not already marked as edited (guard against duplicate work)
    const sectionData = currentSections?.[section as keyof SARMetadataSections];
    if (
      sectionData &&
      typeof sectionData === "object" &&
      "edited" in sectionData &&
      sectionData.edited
    ) {
      return; // Already marked as edited - no work needed
    }

    const updatedMetadata: SARMetadata = {
      ...currentMetadata,
      version: "1.0",
      sections: {
        keyConsiderations: currentSections?.keyConsiderations ?? {
          areasOfNeed: { skipped: false },
          mitigatingFactors: { skipped: false },
        },
        defendantStatement:
          section === "defendantStatement"
            ? {
                skipped: currentSections?.defendantStatement?.skipped ?? false,
                edited: true,
              }
            : currentSections?.defendantStatement ?? {
                skipped: false,
              },
        victimImpactStatement:
          section === "victimImpactStatement"
            ? {
                skipped:
                  currentSections?.victimImpactStatement?.skipped ?? false,
                edited: true,
              }
            : currentSections?.victimImpactStatement ?? {
                skipped: false,
              },
        recommendation:
          section === "recommendation"
            ? {
                skipped: currentSections?.recommendation?.skipped ?? false,
                edited: true,
              }
            : currentSections?.recommendation ?? {
                skipped: false,
              },
      },
    };

    // Update local state immediately (synchronous for instant UI feedback)
    runInAction(() => {
      if (this.SARData) {
        this.SARData.metadata = updatedMetadata;
      }
    });
  }

  /** Update field skip state - generalized for any section/field (future-proof) */
  async updateFieldSkipped(
    section: string,
    skipped: boolean,
    subSection?: string | undefined,
  ): Promise<void> {
    if (!this.SARData) return;

    // Update metadata with proper structure
    const currentMetadata = this.metadata ?? {};
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
        defendantStatement:
          section === "defendantStatement"
            ? {
                skipped,
                edited: currentSections?.defendantStatement?.edited,
              }
            : currentSections?.defendantStatement ?? {
                skipped: false,
              },
        victimImpactStatement:
          section === "victimImpactStatement"
            ? {
                skipped,
                edited: currentSections?.victimImpactStatement?.edited,
              }
            : currentSections?.victimImpactStatement ?? {
                skipped: false,
              },
        recommendation:
          section === "recommendation"
            ? {
                skipped,
                edited: currentSections?.recommendation?.edited,
              }
            : currentSections?.recommendation ?? {
                skipped: false,
              },
      },
    };

    // Update local state immediately for instant UI feedback
    runInAction(() => {
      if (this.SARData) {
        this.SARData.metadata = updatedMetadata;
      }
    });

    // Persist to backend with updated status
    await this.sentencingStore.apiClient.updateSARDetails(this.SARData.id, {
      metadata: updatedMetadata,
      status: this.calculatedStatus,
    } as Partial<MutableSARAttributes>);

    // Update local status after successful save
    runInAction(() => {
      if (this.SARData) {
        this.SARData.status = this.calculatedStatus;
      }
    });
  }

  // Computed properties for skip state
  get needsSkipped(): boolean {
    return (
      this.metadata?.["sections"]?.["keyConsiderations"]?.["areasOfNeed"]?.[
        "skipped"
      ] === true
    );
  }

  get factorsSkipped(): boolean {
    return (
      this.metadata?.["sections"]?.["keyConsiderations"]?.[
        "mitigatingFactors"
      ]?.["skipped"] === true
    );
  }

  get victimImpactStatementSkipped(): boolean {
    return this.isSectionSkipped("victimImpactStatement");
  }

  get defendantStatementSkipped(): boolean {
    return this.isSectionSkipped("defendantStatement");
  }

  get recommendationSkipped(): boolean {
    return this.isSectionSkipped("recommendation");
  }

  /** Get section statuses for navigation indicators */
  get sectionStatuses(): Record<string, SectionStatus> {
    return {
      [SARSection.CASE_INFORMATION]: this.getCaseInfoStatus(),
      [SARSection.KEY_CONSIDERATIONS]: this.getKeyConsiderationsStatus(),
      [SARSection.DEFENDANTS_VERSION]:
        this.getTextFieldStatus("defendantStatement"),
      [SARSection.VICTIM_IMPACT]: this.getTextFieldStatus(
        "victimImpactStatement",
      ),
      [SARSection.OFFENDER_ASSESSMENT]: this.getOffenderAssessmentStatus(),
      [SARSection.RECOMMENDATION]: this.getRecommendationStatus(),
      // Future sections will be added here
    };
  }

  /** Private getter for metadata with proper typing */
  private get metadata(): Partial<SARMetadata> | null | undefined {
    return this.SARData?.metadata as Partial<SARMetadata> | null | undefined;
  }

  /** Helper: Check if a section/subsection is skipped */
  private isSectionSkipped(section: string, subSection?: string): boolean {
    const metadata = this.metadata;

    if (!metadata?.sections) return false;

    // Handle keyConsiderations specially since it has a nested structure
    if (section === "keyConsiderations" && subSection) {
      const keyConsiderations = metadata.sections.keyConsiderations;
      if (subSection === "areasOfNeed") {
        return keyConsiderations?.areasOfNeed?.skipped === true;
      }
      if (subSection === "mitigatingFactors") {
        return keyConsiderations?.mitigatingFactors?.skipped === true;
      }
      return false;
    }

    // For top-level sections (defendantStatement, victimImpactStatement, recommendation)
    const sectionData = metadata.sections[section as keyof SARMetadataSections];
    if (
      sectionData &&
      typeof sectionData === "object" &&
      "skipped" in sectionData
    ) {
      return sectionData.skipped === true;
    }

    return false;
  }

  /** Helper: Get status for a simple text field section */
  private getTextFieldStatus(
    fieldName: "victimImpactStatement" | "defendantStatement",
  ): SectionStatus {
    const fieldValue = this.SARData?.[fieldName];
    const hasContent = fieldValue ? fieldValue.trim() !== "" : false;
    const isSkipped = this.isSectionSkipped(fieldName);
    const isEdited =
      this.metadata?.["sections"]?.[fieldName]?.["edited"] === true;

    // If has content OR is skipped, complete
    if (hasContent || isSkipped) {
      return "complete";
    }

    // If empty but has been edited (user visited and left empty), show incomplete
    if (!hasContent && !isSkipped && isEdited) {
      return "incomplete";
    }

    // If never visited (empty, not skipped, not edited), show nothing
    return "empty";
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
    const needsValues = this.SARData?.needsToBeAddressed;
    const mitigatingValues = this.SARData?.mitigatingFactors;

    const hasNeeds = needsValues && needsValues.length > 0;
    const hasFactors = mitigatingValues && mitigatingValues.length > 0;

    const needsSkipped = this.isSectionSkipped(
      "keyConsiderations",
      "areasOfNeed",
    );
    const factorsSkipped = this.isSectionSkipped(
      "keyConsiderations",
      "mitigatingFactors",
    );

    // If both fields are empty and not skipped, show nothing (empty)
    if (!hasNeeds && !hasFactors && !needsSkipped && !factorsSkipped) {
      return "empty";
    }

    // If both fields are filled OR both are skipped, complete (no icon)
    const needsComplete = hasNeeds || needsSkipped;
    const factorsComplete = hasFactors || factorsSkipped;

    if (needsComplete && factorsComplete) {
      return "complete";
    }

    // If only one field is filled/skipped, incomplete (show warning)
    return "incomplete";
  }

  /** Get Recommendation section status */
  private getRecommendationStatus(): SectionStatus {
    const hasCommunity =
      this.SARData?.communityStrategyRecommendation &&
      this.SARData.communityStrategyRecommendation.trim() !== "";
    const hasHomePlan =
      this.SARData?.homePlan && this.SARData.homePlan.trim() !== "";
    const hasInstitutional =
      this.SARData?.institutionalStrategyRecommendation &&
      this.SARData.institutionalStrategyRecommendation.trim() !== "";

    const isSkipped = this.isSectionSkipped("recommendation");
    const isEdited =
      this.metadata?.["sections"]?.["recommendation"]?.["edited"] === true;

    // If all fields are filled OR is skipped, complete
    if ((hasCommunity && hasHomePlan && hasInstitutional) || isSkipped) {
      return "complete";
    }

    // If all fields are empty and not skipped but has been edited, show incomplete
    if (
      !hasCommunity &&
      !hasHomePlan &&
      !hasInstitutional &&
      !isSkipped &&
      isEdited
    ) {
      return "incomplete";
    }

    // If all fields are empty and never visited, show nothing
    if (
      !hasCommunity &&
      !hasHomePlan &&
      !hasInstitutional &&
      !isSkipped &&
      !isEdited
    ) {
      return "empty";
    }

    // If any field is missing, incomplete (show warning)
    return "incomplete";
  }

  /** Get Offender Assessment section status */
  private getOffenderAssessmentStatus(): SectionStatus {
    // 8 summary text fields
    const summaries = [
      this.SARData?.criminalHistorySummary,
      this.SARData?.employmentSummary,
      this.SARData?.familyAndSocialSupportSummary,
      this.SARData?.housingSummary,
      this.SARData?.drugHistorySummary,
      this.SARData?.peerAssociatesSummary,
      this.SARData?.criminalAttitudesSummary,
      this.SARData?.responsivityAndBarriersSummary,
    ];

    // 4 form fields (must match overallProgress calculation)
    // Note: employedAtOffense excluded because "Unknown" stores as null,
    // which is indistinguishable from "not yet answered"
    const formFields = [
      this.SARData?.levelOfEducation,
      this.SARData?.client?.fatherName,
      this.SARData?.client?.motherName,
      this.SARData?.client?.guardianName,
    ];

    const summaryFilledCount = summaries.filter(
      (s) => s && s.trim() !== "",
    ).length;
    const formFilledCount = formFields.filter(
      (f) => f !== null && f !== undefined && f.toString().trim() !== "",
    ).length;

    const totalFields = summaries.length + formFields.length; // 12 total
    const totalFilledCount = summaryFilledCount + formFilledCount;

    if (totalFilledCount === totalFields) return "complete";
    if (totalFilledCount > 0) return "incomplete";
    return "empty";
  }
}
