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
  compareSeverityRanks,
  getChargeSeverityRank,
  getMostSevereCharges,
  MostSevereCharge,
} from "~@sentencing/trpc-types";
import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import { SAR, SARInsight } from "../api";
import { GenderToDisplayName } from "../components/CaseDetails/constants";
import { MutableSARAttributes } from "../components/CaseDetails/types";
import {
  EditableChargeField,
  REQUIRED_FIELD_IDS,
} from "../components/CaseInformation/constants";
import { JudgeOption } from "../components/CaseInformation/JudgeSelector";
import {
  NeedsToBeAddressed,
  OTHER_OPTION,
  ProtectiveFactors,
} from "../components/constants";
import { KEY_CONSIDERATIONS_REQUIRED_FIELDS } from "../components/KeyConsiderations/constants";
import { mapEnumKeysToDisplay } from "../components/KeyConsiderations/utils";
import {
  AssessmentTypeKey,
  getAssessmentScoreBucket,
} from "../components/OffenderAssessment/assessmentTypeUtils";
import { RiskLevelKey } from "../components/OffenderAssessment/constants";
import { getDomainsForAssessmentType } from "../components/OffenderAssessment/utils";
import {
  SAR_REPORT_SECTIONS,
  SARSection,
  type SARSectionName,
} from "../components/SARDetails/constants";
import { SectionStatus } from "../components/SARDetails/StatusIndicator";
import { InsightDescriptionContext } from "../components/Summary/insightsUtils";
import { RiskProfileCardData } from "../components/Summary/ReportRiskProfileSummaryCard";
import { SentencingStore } from "../datastores/SentencingStore";
import { FormCharge } from "../datastores/types";
import {
  formatDisplayDate,
  formatJudgeName,
  formatLongDate,
  formatPersonName,
  titleCase,
} from "../utils/utils";
import { CRIMINAL_HISTORY_DEFAULT, DOMAIN_TO_SUMMARY_FIELD } from "./constants";
import { OffenderAssessmentPresenter } from "./OffenderAssessmentPresenter";
import { PriorTreatmentHistoryPresenter } from "./PriorTreatmentHistoryPresenter";

const DISPOSITION_TYPE_ORDER: Record<string, number> = {
  Probation: 0,
  Treatment_in_prison: 1,
  SUSPENDED: 2,
};

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
  priorTreatmentHistory?: {
    edited?: boolean;
  };
};

type SARMetadata = {
  sections: SARMetadataSections;
  version?: "1.0";
};

const RECOMMENDATION_FIELDS = [
  "communityStrategyRecommendation",
  "homePlan",
  "institutionalStrategyRecommendation",
] as const;

const EMPTY_SECTION = { completed: 0, total: 0 };

// All SAR sections that contribute to progress (excludes read-only Summary)
type ProgressSection = Exclude<SARSectionName, SARSection.SUMMARY>;

export class SARDetailsPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  SARData?: SAR;

  insight?: SARInsight | null;

  offenderAssessment: OffenderAssessmentPresenter;

  priorTreatmentHistory: PriorTreatmentHistoryPresenter;

  constructor(
    public readonly sentencingStore: SentencingStore,
    public sarId: string,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.offenderAssessment = new OffenderAssessmentPresenter(
      this,
      this.sentencingStore.apiClient,
    );
    this.priorTreatmentHistory = new PriorTreatmentHistoryPresenter(
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
        await flowResult(this.loadInsight());
      },
    });
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  *loadInsight() {
    const sarData = this.SARData;
    if (!sarData) return;

    if (!this.hasOrasAssessment) {
      this.insight = null;
      return;
    }

    // Uses the most severe charge (highest classificationType + lowest subtype letter).
    const offense = this.charges[0]?.offense;
    const gender = sarData.client?.gender;
    const score = sarData.assessmentScore;
    const assessmentType = sarData.assessmentType;

    if (!offense || !gender || score == null || assessmentType == null) {
      let missingField = "assessment score";
      if (!offense) missingField = "offense";
      else if (!gender) missingField = "gender";
      else if (assessmentType == null) missingField = "assessment type";
      console.warn(
        `[SARDetailsPresenter] Cannot load insight: missing ${missingField}`,
      );
      this.insight = null;
      return;
    }

    const scoreBucket = getAssessmentScoreBucket(assessmentType, score);
    if (scoreBucket == null) {
      console.warn(
        `[SARDetailsPresenter] Cannot load insight: could not determine score bucket for assessmentType=${assessmentType}, score=${score}`,
      );
      this.insight = null;
      return;
    }

    try {
      this.insight = yield this.sentencingStore.apiClient.getSARInsight(
        offense,
        gender,
        scoreBucket,
      );
      if (!this.insight) {
        console.warn(
          `[SARDetailsPresenter] No insight found for offense="${offense}", gender=${gender}, scoreBucket=${scoreBucket}`,
        );
      }
    } catch (e) {
      console.warn(`[SARDetailsPresenter] Failed to load insight: ${e}`);
      this.insight = null;
    }
  }

  get insightData() {
    return this.insight ?? undefined;
  }

  get emptyStateDescriptionContext(): InsightDescriptionContext | null {
    if (this.insight) {
      const { gender, assessmentScoreBucketStart, offense, offenseCategory } =
        this.insight;
      return { gender, assessmentScoreBucketStart, offense, offenseCategory };
    }
    // Fallback: build context from sarData when no matching insight exists.
    const sarData = this.SARData;
    const gender = sarData?.client?.gender;
    const offense = this.charges[0]?.offense;
    if (!gender || !offense) return null;
    return {
      gender,
      assessmentScoreBucketStart:
        sarData?.assessmentScore != null
          ? getAssessmentScoreBucket(
              sarData.assessmentType ?? null,
              sarData.assessmentScore,
            )
          : null,
      offense,
      offenseCategory: null,
    };
  }

  get sortedDispositionData() {
    if (!this.insight?.dispositionData) return [];
    return [...this.insight.dispositionData].sort(
      (a, b) =>
        (DISPOSITION_TYPE_ORDER[a.recommendationType ?? ""] ?? 3) -
        (DISPOSITION_TYPE_ORDER[b.recommendationType ?? ""] ?? 3),
    );
  }

  get staffPseudoId(): string | undefined {
    return this.sentencingStore.staffPseudoId;
  }

  get SARAttributes() {
    if (!this.SARData) return {};

    const formattedClient = this.SARData.client
      ? {
          ...this.SARData.client,
          fullName: formatPersonName(this.SARData.client.fullName),
        }
      : this.SARData.client;

    return {
      client: formattedClient,
      externalId: this.SARData.client?.externalId,
      age: this.SARData.age,
      charges: this.SARData.charges,
      dueDate: this.SARData.dueDate,
    };
  }

  get SARSections(): SARSectionName[] {
    const result =
      this.defendantDeclinedToParticipate === false
        ? (SAR_REPORT_SECTIONS as unknown as SARSectionName[])
        : ([
            SARSection.CASE_INFORMATION,
            SARSection.DEFENDANTS_VERSION,
            SARSection.VICTIM_IMPACT,
            SARSection.SUMMARY,
          ] as SARSectionName[]);
    return result;
  }

  get formattedClientName(): string {
    return this.SARAttributes.client?.fullName || "Unknown";
  }

  /** Formatted birth date for display */
  get formattedBirthDate(): string {
    return formatDisplayDate(this.SARData?.client?.birthDate);
  }

  /** Formatted date requested for display */
  get formattedDateRequested(): string {
    return formatDisplayDate(this.SARData?.dateRequested);
  }

  /** Formatted gender for display */
  get formattedGender(): string | undefined {
    const gender = this.SARData?.client?.gender;
    return gender ? GenderToDisplayName[gender] : undefined;
  }

  /** Formatted race/ethnicity for display */
  get formattedRaceOrEthnicity(): string {
    const raceArray = this.SARData?.client?.raceOrEthnicity;
    if (!raceArray || raceArray.length === 0) return "Unknown";

    const formattedRaces = raceArray.map((race) =>
      race
        .trim()
        .replace(/_/g, " ")
        .toLowerCase()
        .split(" ")
        .map((word) => titleCase(word))
        .join(" "),
    );

    return formattedRaces.join(", ");
  }

  /** Extract offense names from charges */
  get offenseNames(): string[] {
    if (!this.SARData?.charges || !Array.isArray(this.SARData.charges)) {
      return [];
    }
    return this.SARData.charges.map((charge) => charge.offense).filter(Boolean);
  }

  /** Get charges array sorted by severity (FELONY A first, null classification last) */
  get charges(): FormCharge[] {
    if (!this.SARData?.charges) return [];
    return [...this.SARData.charges].sort((a, b) =>
      compareSeverityRanks(getChargeSeverityRank(a), getChargeSeverityRank(b)),
    );
  }

  /** Most severe charge(s). Length > 1 means a tie requiring user input. */
  get mostSevereCharges(): MostSevereCharge[] {
    return getMostSevereCharges(this.SARData?.charges ?? []);
  }

  /** Get officer (staff) info */
  get officerInfo() {
    const staff = this.SARData?.staff;
    return {
      name: staff?.fullName ? formatPersonName(staff.fullName) : undefined,
      district: staff?.district?.name,
      address: staff?.officeAddress,
      phoneNumber: staff?.officePhoneNumber,
    };
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
   * True when a full ORAS assessment was performed and the defendant participated.
   * False when assessmentDate is absent or the defendant declined to participate.
   */
  get hasOrasAssessment(): boolean {
    return (
      !!this.SARData?.assessmentDate && !this.defendantDeclinedToParticipate
    );
  }

  /** Extract unique judge name/division pairs from all imported charges */
  get judgeOptions(): JudgeOption[] {
    const judgeMap = new Map<string, string | null>();
    this.SARData?.charges?.forEach((charge) => {
      (charge.judgeNames ?? []).forEach((name) => {
        if (!judgeMap.has(name)) judgeMap.set(name, charge.division ?? null);
      });
    });
    return Array.from(judgeMap.entries()).map(([name, division]) => ({
      label: formatJudgeName(name),
      value: name,
      division,
    }));
  }

  /**
   * Calculate overall SAR progress at the field level.
   * Each per-section getter counts its own {completed, total} so the
   * progress bar advances as individual fields are filled in.
   * Totals are derived from source arrays (REQUIRED_FIELD_IDS,
   * KEY_CONSIDERATIONS_REQUIRED_FIELDS, RECOMMENDATION_FIELDS, etc.)
   * so adding fields to those arrays automatically updates progress.
   *
   * Returns percentage: 0-100
   */
  get overallProgress(): number {
    const counts = this.sectionFieldCounts;
    if (counts.total === 0) return 0;
    return (counts.completed / counts.total) * 100;
  }

  private get sectionFieldCounts(): { completed: number; total: number } {
    const counts: Record<
      ProgressSection,
      { completed: number; total: number }
    > = {
      [SARSection.CASE_INFORMATION]: this.caseInfoFieldCounts,
      [SARSection.KEY_CONSIDERATIONS]: this.keyConsiderationsFieldCounts,
      [SARSection.DEFENDANTS_VERSION]: this.defendantVersionFieldCounts,
      [SARSection.VICTIM_IMPACT]: this.victimImpactFieldCounts,
      [SARSection.OFFENDER_ASSESSMENT]: this.offenderAssessmentFieldCounts,
      [SARSection.PRIOR_TREATMENT_HISTORY]:
        this.priorTreatmentHistoryFieldCounts,
      [SARSection.RECOMMENDATION]: this.recommendationFieldCounts,
    };
    return Object.values(counts).reduce(
      (acc, c) => ({
        completed: acc.completed + c.completed,
        total: acc.total + c.total,
      }),
      EMPTY_SECTION,
    );
  }

  private get caseInfoFieldCounts(): { completed: number; total: number } {
    let completed = 0;
    let total = 0;

    // Judge name is required at the SAR level
    total++;
    if (this.SARData?.requestingJudgeName) completed++;

    this.charges.forEach((charge) => {
      REQUIRED_FIELD_IDS.forEach((fieldId) => {
        total++;
        const value = charge[fieldId as keyof typeof charge];
        if (value !== null && value !== undefined && value !== "") {
          completed++;
        }
      });
    });
    return { completed, total };
  }

  private get keyConsiderationsFieldCounts(): {
    completed: number;
    total: number;
  } {
    if (this.defendantDeclinedToParticipate === true) {
      return EMPTY_SECTION;
    }

    let completed = 0;
    const total = KEY_CONSIDERATIONS_REQUIRED_FIELDS.length;

    const hasNeeds =
      this.SARData?.needsToBeAddressed &&
      this.SARData.needsToBeAddressed.length > 0;
    if (hasNeeds || this.needsSkipped) completed++;

    const hasFactors =
      this.SARData?.mitigatingFactors &&
      this.SARData.mitigatingFactors.length > 0;
    if (hasFactors || this.factorsSkipped) completed++;

    return { completed, total };
  }

  private get defendantVersionFieldCounts(): {
    completed: number;
    total: number;
  } {
    const hasContent =
      !!this.SARData?.defendantStatement &&
      this.SARData.defendantStatement.trim() !== "";
    const completed = hasContent || this.defendantStatementSkipped ? 1 : 0;
    return { completed, total: 1 };
  }

  private get victimImpactFieldCounts(): {
    completed: number;
    total: number;
  } {
    const hasContent =
      !!this.SARData?.victimImpactStatement &&
      this.SARData.victimImpactStatement.trim() !== "";
    const completed = hasContent || this.victimImpactStatementSkipped ? 1 : 0;
    return { completed, total: 1 };
  }

  private get recommendationFieldCounts(): {
    completed: number;
    total: number;
  } {
    if (this.defendantDeclinedToParticipate === true) {
      return EMPTY_SECTION;
    }

    if (this.recommendationSkipped) {
      return {
        completed: RECOMMENDATION_FIELDS.length,
        total: RECOMMENDATION_FIELDS.length,
      };
    }
    let completed = 0;
    RECOMMENDATION_FIELDS.forEach((fieldName) => {
      const value = this.SARData?.[fieldName];
      if (value && value.trim() !== "") completed++;
    });
    return { completed, total: RECOMMENDATION_FIELDS.length };
  }

  private get offenderAssessmentFieldCounts(): {
    completed: number;
    total: number;
  } {
    if (this.defendantDeclinedToParticipate === true) {
      return EMPTY_SECTION;
    }

    const { summaries, formFields } = this.offenderAssessmentFields;
    let completed = 0;
    summaries.forEach((s) => {
      if (s && s.trim() !== "") completed++;
    });
    formFields.forEach((f) => {
      if (f !== null && f !== undefined && f.toString().trim() !== "")
        completed++;
    });
    return { completed, total: summaries.length + formFields.length };
  }

  private get priorTreatmentHistoryFieldCounts(): {
    completed: number;
    total: number;
  } {
    if (this.defendantDeclinedToParticipate === true) {
      return EMPTY_SECTION;
    }

    const summary = this.SARData?.priorTreatmentHistorySummary;
    const hasContent = !!summary && summary.trim() !== "";
    return { completed: hasContent ? 1 : 0, total: 1 };
  }

  /**
   * Status to persist on any update. Complete when all required fields are
   * filled, InProgress otherwise (we never send NotYetStarted — once any
   * edit is made the SAR is always at least InProgress).
   */
  private get statusForUpdate(): "Complete" | "InProgress" {
    return this.overallProgress === 100 ? "Complete" : "InProgress";
  }

  /**
   * Updates the SAR status in both the detail record and the dashboard list.
   * Must be called inside a runInAction block.
   */
  private updateLocalStatus(
    status: "Complete" | "InProgress" | "NotYetStarted",
  ): void {
    if (this.SARData) {
      this.SARData.status = status;
    }
    // Keep the dashboard list in sync so it reflects immediately without a refresh
    const sarList =
      this.sentencingStore.staffStore.staffInfo?.sentencingAssessmentReports;
    if (sarList) {
      const sarInList = sarList.find((sar) => sar.id === this.sarId);
      if (sarInList) {
        sarInList.status = status;
      }
    }
  }

  /** Check if a specific charge has all required fields filled */
  isChargeComplete(charge: FormCharge): boolean {
    return REQUIRED_FIELD_IDS.every((fieldId) => {
      const value = charge[fieldId as keyof typeof charge];
      return value !== null && value !== undefined && value !== "";
    });
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
      status: this.statusForUpdate,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      this.updateLocalStatus(this.statusForUpdate);
    });
  }

  /** Update requesting judge name and optionally division */
  async updateJudgeSelection(
    name: string | null,
    division?: string | null,
  ): Promise<void> {
    if (!this.SARData) return;

    runInAction(() => {
      if (this.SARData) {
        this.SARData.requestingJudgeName = name;
        if (division !== undefined) this.SARData.division = division;
      }
    });

    const updates: Partial<MutableSARAttributes> = {
      requestingJudgeName: name,
      ...(division !== undefined ? { division } : {}),
      status: this.statusForUpdate,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    runInAction(() => {
      this.updateLocalStatus(this.statusForUpdate);
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
          pleaDate: c.pleaDate ? moment.utc(c.pleaDate).toDate() : null,
          sentencingDate: c.sentencingDate
            ? moment.utc(c.sentencingDate).toDate()
            : null,
        })),
        status: this.statusForUpdate,
      };
      await this.sentencingStore.apiClient.updateSARDetails(
        this.SARData.id,
        updates,
      );

      // Update local status after successful save
      runInAction(() => {
        this.updateLocalStatus(this.statusForUpdate);
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
      status: this.statusForUpdate,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      this.updateLocalStatus(this.statusForUpdate);
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
      status: this.statusForUpdate,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      this.updateLocalStatus(this.statusForUpdate);
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
      status: this.statusForUpdate,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      this.updateLocalStatus(this.statusForUpdate);
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
      status: this.statusForUpdate,
    };
    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    // Update local status after successful save
    runInAction(() => {
      this.updateLocalStatus(this.statusForUpdate);
    });
  }

  /**
   * Generic helper to update a string field in SAR data.
   * Handles local state update, API call, and status recalculation.
   */
  async updateStringField(
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
      | "responsivityAndBarriersSummary"
      | "priorTreatmentHistorySummary",
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
      status: this.statusForUpdate,
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
      this.updateLocalStatus(this.statusForUpdate);
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
      status: this.statusForUpdate,
    };

    // Only include metadata if it exists to avoid validation errors
    if (this.metadata) {
      updates.metadata = this.metadata as SARMetadata;
    }

    await this.sentencingStore.apiClient.updateSARDetails(sarId, updates);

    // Update local status after successful save
    runInAction(() => {
      this.updateLocalStatus(this.statusForUpdate);
    });
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
      status: this.statusForUpdate,
    };

    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    runInAction(() => {
      this.updateLocalStatus(this.statusForUpdate);
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
      status: this.statusForUpdate,
    };

    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    runInAction(() => {
      this.updateLocalStatus(this.statusForUpdate);
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
      status: this.statusForUpdate,
    };

    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    runInAction(() => {
      this.updateLocalStatus(this.statusForUpdate);
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
      status: this.statusForUpdate,
    };

    await this.sentencingStore.apiClient.updateSARDetails(
      this.SARData.id,
      updates,
    );

    runInAction(() => {
      this.updateLocalStatus(this.statusForUpdate);
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
        priorTreatmentHistory:
          section === "priorTreatmentHistory"
            ? { edited: true }
            : currentSections?.priorTreatmentHistory,
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
        priorTreatmentHistory: currentSections?.priorTreatmentHistory,
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
      status: this.statusForUpdate,
    } as Partial<MutableSARAttributes>);

    // Update local status after successful save
    runInAction(() => {
      this.updateLocalStatus(this.statusForUpdate);
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

  /** Display labels for areas of need, replacing the "Other" placeholder with
   * the free-text value. Returns [] if the section was skipped. */
  get needsDisplayItems(): string[] {
    if (this.needsSkipped) return [];
    const items = mapEnumKeysToDisplay(
      NeedsToBeAddressed,
      this.SARData?.needsToBeAddressed,
    ).filter((item) => item !== OTHER_OPTION);
    if (this.SARData?.otherNeedToBeAddressed) {
      items.push(this.SARData.otherNeedToBeAddressed);
    }
    return items;
  }

  /** Display labels for mitigating factors, replacing the "Other" placeholder
   * with the free-text value. Returns [] if the section was skipped. */
  get factorsDisplayItems(): string[] {
    if (this.factorsSkipped) return [];
    const items = mapEnumKeysToDisplay(
      ProtectiveFactors,
      this.SARData?.mitigatingFactors,
    ).filter((item) => item !== OTHER_OPTION);
    if (this.SARData?.otherMitigatingFactor) {
      items.push(this.SARData.otherMitigatingFactor);
    }
    return items;
  }

  /**
   * Data for the Risk Profile Summary card in the SAR report.
   * Groups domains by risk level (HIGH/MODERATE/LOW) for display.
   * Returns null when assessmentType is missing, no ORAS was administered,
   * or the defendant declined to participate.
   */
  get riskProfileCardData(): RiskProfileCardData | null {
    const sarData = this.SARData;
    if (!sarData?.assessmentType || !this.hasOrasAssessment) return null;

    const domains = getDomainsForAssessmentType(sarData.assessmentType);
    const grouped: Record<RiskLevelKey, string[]> = {
      HIGH: [],
      MODERATE: [],
      LOW: [],
    };

    for (const domain of domains) {
      if (!domain.riskLevelField) continue;
      // Dynamic field access is necessary here: domain configs store risk-level
      // field names as strings, so keyof-narrowing is the best available approach.
      const level = sarData[
        domain.riskLevelField as keyof typeof sarData
      ] as RiskLevelKey | null;
      if (level && level in grouped) {
        grouped[level].push(domain.title);
      }
    }

    return {
      assessmentType: sarData.assessmentType as AssessmentTypeKey,
      administeredBy: sarData.assessmentAdministeredBy ?? null,
      assessmentDate: sarData.assessmentDate
        ? formatLongDate(sarData.assessmentDate)
        : null,
      groupedDomains: grouped,
    };
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
  get sectionStatuses(): Record<ProgressSection, SectionStatus> {
    // These sections are removed from the UI when the defendant declines, so
    // they should not block download readiness.
    const declined = this.defendantDeclinedToParticipate;
    return {
      [SARSection.CASE_INFORMATION]: this.getCaseInfoStatus(),
      [SARSection.KEY_CONSIDERATIONS]: declined
        ? "complete"
        : this.getKeyConsiderationsStatus(),
      [SARSection.DEFENDANTS_VERSION]:
        this.getTextFieldStatus("defendantStatement"),
      [SARSection.VICTIM_IMPACT]: this.getTextFieldStatus(
        "victimImpactStatement",
      ),
      [SARSection.OFFENDER_ASSESSMENT]: declined
        ? "complete"
        : this.getOffenderAssessmentStatus(),
      [SARSection.PRIOR_TREATMENT_HISTORY]: declined
        ? "complete"
        : this.getPriorTreatmentHistoryStatus(),
      [SARSection.RECOMMENDATION]: declined
        ? "complete"
        : this.getRecommendationStatus(),
    };
  }

  /**
   * Collects the offender assessment field values based on visible ORAS domains.
   * Shared by overallProgress and getOffenderAssessmentStatus so the field
   * lists are defined in one place.
   */
  private get offenderAssessmentFields(): {
    summaries: (string | null | undefined)[];
    formFields: (string | null | undefined)[];
  } {
    const domains = getDomainsForAssessmentType(this.SARData?.assessmentType);

    const summaries = domains
      .map((d) => DOMAIN_TO_SUMMARY_FIELD[d.key])
      .filter(Boolean)
      .map((field) => this.SARData?.[field]);

    const formFields: (string | null | undefined)[] = [];
    if (domains.some((d) => d.key === "educationEmployment")) {
      formFields.push(this.SARData?.levelOfEducation);
    }
    if (domains.some((d) => d.key === "familySocialSupport")) {
      formFields.push(
        this.SARData?.client?.fatherName,
        this.SARData?.client?.motherName,
        this.SARData?.client?.guardianName,
      );
    }

    return { summaries, formFields };
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

  private getPriorTreatmentHistoryStatus(): SectionStatus {
    const summary = this.SARData?.priorTreatmentHistorySummary;
    const hasContent = !!summary && summary.trim() !== "";
    const isEdited =
      this.metadata?.sections?.priorTreatmentHistory?.edited === true;

    if (hasContent) return "complete";
    if (isEdited) return "incomplete";
    return "empty";
  }

  /** Get Case Information section status */
  private getCaseInfoStatus(): SectionStatus {
    if (this.charges.length === 0) return "empty";

    const hasJudgeName = !!this.SARData?.requestingJudgeName;
    let hasAnyValue = hasJudgeName;
    let allFieldsComplete = hasJudgeName;

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
    const { summaries, formFields } = this.offenderAssessmentFields;

    const summaryFilledCount = summaries.filter(
      (s) => s && s.trim() !== "",
    ).length;
    const formFilledCount = formFields.filter(
      (f) => f !== null && f !== undefined && f.toString().trim() !== "",
    ).length;

    const totalFields = summaries.length + formFields.length;
    const totalFilledCount = summaryFilledCount + formFilledCount;

    // Check if only the criminal history default is filled (nothing else touched)
    const criminalHistoryValue = this.SARData?.criminalHistorySummary?.trim();
    const onlyDefaultCriminalHistory =
      criminalHistoryValue === CRIMINAL_HISTORY_DEFAULT &&
      totalFilledCount === 1 &&
      formFilledCount === 0;

    if (totalFilledCount === totalFields) return "complete";
    if (totalFilledCount > 0 && !onlyDefaultCriminalHistory)
      return "incomplete";
    return "empty";
  }
}
