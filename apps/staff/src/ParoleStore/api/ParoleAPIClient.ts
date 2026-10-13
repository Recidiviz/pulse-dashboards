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

import {
  addDisplayName,
  PAROLE_PROGRAM_STATUS,
  PAROLE_RECOMMENDED_STATUS,
  PAROLE_RISK_TOOL,
  PAROLE_UNKNOWN_DATE,
  PAROLE_UNKNOWN_TEXT,
  ParoleAttachment,
  ParoleBoardClientProfileHearing,
  ParoleBoardClientProfileLatestRiskNeedSummary,
  ParoleBoardClientProfileRecord,
  ParoleBoardClientProfileRiskAssessment,
  ParoleBoardClientProfileSentence,
  ParoleCase,
  ParoleCaseNote,
  ParoleCommunitySupervisionPlanEntry,
  ParoleConductRecord,
  ParoleConviction,
  ParoleDocProgram,
  ParoleEdovoProgram,
  ParoleHearing,
  ParoleHearingHistoryEntry,
  ParoleLifeSentence,
  ParoleOffense,
  ParoleOffenseHistory,
  ParolePlan,
  ParoleProgramStatus,
  ParoleRecommendedStatus,
  ParoleRiskAssessment,
  ParoleRiskNeedFactor,
  ParoleRiskTool,
  ParoleSubcategoryScore,
  WorkflowsResidentRecord,
} from "~datatypes";

import { FirestoreDateRangeFilter } from "../../FirestoreStore/FirestoreStore";
import { formatDateToISO, formatNameLastFirstMiddle } from "../../utils";
import { ParoleStore } from "../ParoleStore";
import { ParoleAPI } from "./interface";

export const SUPPORTED_TENANT_IDS = ["US_ID", "US_CO"] as const;
export type SupportedTenantId = (typeof SUPPORTED_TENANT_IDS)[number];

/**
 * Whether this tenant has a real data source behind the parole board. Any
 * other tenant falls back to ParoleOfflineAPIClient.
 */
export function isSupportedTenantId(
  tenantId: string | undefined,
): tenantId is SupportedTenantId {
  return SUPPORTED_TENANT_IDS.includes(tenantId as SupportedTenantId);
}

type SupportedTenantMetadata = Extract<
  WorkflowsResidentRecord["metadata"],
  { stateCode: SupportedTenantId }
>;

/**
 * Narrows a resident's metadata to a supported tenant's, exposing its
 * tenant-specific fields. `isSupportedTenantId` alone can't do this: it
 * narrows the stateCode string, not the union that holds it.
 */
function isSupportedTenantMetadata(
  metadata: WorkflowsResidentRecord["metadata"],
): metadata is SupportedTenantMetadata {
  return isSupportedTenantId(metadata.stateCode);
}

const UNKNOWN_TEXT = PAROLE_UNKNOWN_TEXT;
const UNKNOWN_DATE = PAROLE_UNKNOWN_DATE;

const HEARING_STATUS_PREVIOUS = "PREVIOUS";
const HEARING_STATUS_SCHEDULED = "SCHEDULED";

/** The fields the mappers below read off a resident's scheduled hearing. */
type ScheduledHearing = Pick<
  ParoleBoardClientProfileHearing,
  "hearingDate" | "hearingType" | "hearingDateIsPlaceholder"
>;

const UNKNOWN_OFFENSE: ParoleOffense = {
  county: UNKNOWN_TEXT,
  docket: UNKNOWN_TEXT,
  conviction: UNKNOWN_TEXT,
  classFelony: UNKNOWN_TEXT,
  sentence: UNKNOWN_TEXT,
  dateOfOffense: UNKNOWN_DATE,
  convictionDate: UNKNOWN_DATE,
  offenseNarrative: UNKNOWN_TEXT,
};

// Source systems write years such as 2999 and 9999 to mean "no defined date".
const FIRST_PLACEHOLDER_YEAR = 2999;

/**
 * Returns the date, or undefined when a source system wrote a placeholder
 * year (e.g. "2999-01-20" or "9999-01-20") to mean "no defined date".
 *
 * @param date - A sentence-level ISO date, as the source system wrote it.
 */
function realSentenceDate(date: string | undefined): string | undefined {
  return date && Number(date.slice(0, 4)) < FIRST_PLACEHOLDER_YEAR
    ? date
    : undefined;
}

type UsCoCohortLabel = Extract<
  WorkflowsResidentRecord["metadata"],
  { stateCode: "US_CO" }
>["cohortLabel"];

// The life cohorts show a life-sentence status in place of the PED, whether or
// not a hearing is scheduled. This is a product decision to match the JII
// tablet's PED card, so the board sees the same status as the resident; a
// life-with-parole resident's real PED is hidden on purpose.
const LIFE_SENTENCE_BY_US_CO_COHORT = {
  STANDARD: undefined,
  INTERSTATE_COMPACT: undefined,
  LIFE_WITHOUT_PAROLE: "WITHOUT_PAROLE",
  LIFE_WITH_PAROLE: "WITH_PAROLE",
  INDETERMINATE_LIFE_WITH_PAROLE: "WITH_PAROLE",
} as const satisfies Record<UsCoCohortLabel, ParoleLifeSentence | undefined>;

const RISK_TOOL_OPTIONS: ReadonlySet<string> = new Set(
  PAROLE_RISK_TOOL.options,
);

// US_CO's raw risk-tool labels (e.g. "RT Scoring Tool") don't match
// PAROLE_RISK_TOOL's values; US_ID's already do (LSIR, STABLE, STATIC_99,
// VRAG), so those pass straight through via the RISK_TOOL_OPTIONS check in
// riskToolForRawLabel() below, without needing an entry here.
const RISK_TOOL_BY_RAW_LABEL: Record<string, ParoleRiskTool> = {
  "RT Scoring Tool": "RT",
  "PIT Scoring Tool": "PIT",
  "CST Scoring Tool": "CST",
  "SRT Scoring Tool": "SRT",
};

/**
 * Returns the matching risk tool, or undefined when the raw label is one this
 * client has no mapping for.
 */
function riskToolForRawLabel(raw: string): ParoleRiskTool | undefined {
  if (RISK_TOOL_OPTIONS.has(raw)) return raw as ParoleRiskTool;
  return RISK_TOOL_BY_RAW_LABEL[raw];
}

/**
 * Builds one assessment's subcategory breakdown. A category missing its name,
 * score, or maximum is dropped.
 *
 * Returns `{}` rather than `{ subcategories: [] }` when no category remains, so
 * SubcategoryBreakdownChart renders nothing instead of an empty chart.
 */
function subcategoriesForAssessment(
  assessment: ParoleBoardClientProfileRiskAssessment,
): Pick<ParoleRiskAssessment, "subcategories"> {
  const subcategories: Array<ParoleSubcategoryScore> =
    assessment.assessmentCategories.flatMap((category) =>
      category.assessmentCategoryName &&
      category.assessmentCategoryScore !== undefined &&
      category.assessmentCategoryMaxScore !== undefined
        ? [
            {
              name: category.assessmentCategoryName,
              score: category.assessmentCategoryScore,
              maxScore: category.assessmentCategoryMaxScore,
            },
          ]
        : [],
    );
  return subcategories.length > 0 ? { subcategories } : {};
}

// One entry per LATEST_RISK_NEED_SUMMARY domain, in display order.
const RISK_NEED_FACTOR_FIELDS: ReadonlyArray<{
  field: keyof ParoleBoardClientProfileLatestRiskNeedSummary;
  factor: string;
}> = [
  { field: "assessmentLatestMedical", factor: "Medical" },
  { field: "assessmentLatestDental", factor: "Dental" },
  { field: "assessmentLatestMentalHealth", factor: "Mental Health" },
  { field: "assessmentLatestId", factor: "ID" },
  { field: "assessmentLatestSexOffender", factor: "Sex Offender" },
  { field: "assessmentLatestSar", factor: "Substance Abuse Rating" },
  { field: "assessmentLatestSoar", factor: "SOA-R Level" },
];

const PROGRAM_STATUS_OPTIONS: ReadonlySet<string> = new Set(
  PAROLE_PROGRAM_STATUS.options,
);

// US_ID's programStatus is already the normalized
// StateProgramAssignmentParticipationStatus enum PAROLE_PROGRAM_STATUS
// mirrors, so it passes straight through via the PROGRAM_STATUS_OPTIONS
// check in programStatusForRawLabel() below. US_CO's is its own free-form
// program-tracking status; this maps the values observed in practice. A
// status this table doesn't recognize is dropped rather than shown under a
// guessed one.
const PROGRAM_STATUS_BY_RAW_LABEL: Record<string, ParoleProgramStatus> = {
  Assigned: "IN_PROGRESS",
  "Re-Assigned": "IN_PROGRESS",
  "Transferred to another Facility": "IN_PROGRESS",
  "Transferred within Pgm.": "IN_PROGRESS",
  Completed: "DISCHARGED_SUCCESSFUL",
  Dropped: "DISCHARGED_UNSUCCESSFUL",
  Removed: "DISCHARGED_UNSUCCESSFUL",
  Terminated: "DISCHARGED_UNSUCCESSFUL",
  Released: "DISCHARGED_OTHER",
};

/**
 * Returns the matching program status, or undefined when the raw status is
 * one this client has no mapping for.
 */
function programStatusForRawLabel(
  raw: string,
): ParoleProgramStatus | undefined {
  if (PROGRAM_STATUS_OPTIONS.has(raw)) return raw as ParoleProgramStatus;
  return PROGRAM_STATUS_BY_RAW_LABEL[raw];
}

// Edovo's raw status has a third value ("WITHDRAWN") that PAROLE_EDOVO_STATUS
// has no bucket for -- mapping it onto "in-progress" would misstate a
// discontinued program as still active, so a program with an unrecognized
// status is dropped rather than shown under the wrong one.
const EDOVO_STATUS_BY_RAW_LABEL: Record<string, ParoleEdovoProgram["status"]> =
  {
    COMPLETED: "completed",
    "IN PROGRESS": "in-progress",
  };

const EDOVO_RESULT_BY_RAW_LABEL: Record<
  string,
  NonNullable<ParoleEdovoProgram["result"]>
> = {
  PASSED: "passed",
};

// US_CO's raw attachment categories (VICTIM_STATEMENT, PSI, etc.) are more
// specific than PAROLE_ATTACHMENT_TYPE's three values; anything without a
// clear match falls back to "Other" rather than being dropped, since the
// attachment link is still useful under a generic label.
const ATTACHMENT_TYPE_BY_RAW_LABEL: Record<string, ParoleAttachment["type"]> = {
  VICTIM_STATEMENT: "Victim Impact Letter",
};

/**
 * Returns the matching attachment type, falling back to "Other" so an
 * unrecognized attachment is still linked under a generic label.
 */
function attachmentTypeForRawLabel(
  raw: string | undefined,
): ParoleAttachment["type"] {
  return (raw && ATTACHMENT_TYPE_BY_RAW_LABEL[raw]) || "Other";
}

const RECOMMENDED_STATUS_OPTIONS: ReadonlySet<string> = new Set(
  PAROLE_RECOMMENDED_STATUS.options,
);

export class ParoleAPIClient implements ParoleAPI {
  constructor(public readonly paroleStore: ParoleStore) {}

  /**
   * One docket row per resident whose docket hearing date falls in the
   * tenant's docket window. A resident with no docket hearing date is left
   * out.
   */
  async hearings(): Promise<Array<ParoleHearing>> {
    // Checked before hearingDateRangeFilter, which reads the tenant's
    // paroleConfig and would otherwise mask this error with a config one.
    this.requireSupportedTenant("hearings");
    const dateRange = this.hearingDateRangeFilter();
    const residents = await this.getResidentsForState("hearings", dateRange);
    const profiles = await this.profilesByPseudonymizedId(residents, dateRange);

    return residents.flatMap(
      (resident) =>
        this.hearingForResident(
          resident,
          profiles.get(resident.pseudonymizedId),
        ) ?? [],
    );
  }

  /**
   * The full case profile for one resident. Throws when the current tenant
   * has no resident under that id.
   *
   * @param pseudonymizedId - The resident's pseudonymized id, as the docket
   *   links to it.
   */
  async caseDetail(pseudonymizedId: string): Promise<ParoleCase> {
    const currentTenantId = this.requireSupportedTenant("caseDetail");

    const { firestoreStore } = this.paroleStore.rootStore;
    const [resident, profile] = await Promise.all([
      firestoreStore.getResident(pseudonymizedId, currentTenantId),
      firestoreStore.getParoleBoardClientProfile(
        pseudonymizedId,
        currentTenantId,
      ),
    ]);
    if (!resident) {
      throw new Error(
        `No ${currentTenantId} resident found for pseudonymizedId [${pseudonymizedId}].`,
      );
    }

    return this.caseDetailForResident(resident, profile);
  }

  /**
   * The current tenant. Throws when that tenant has no real data source, so
   * a caller never silently reads an empty profile.
   *
   * @param methodName - The calling method, named in the error.
   */
  private requireSupportedTenant(methodName: string): SupportedTenantId {
    const { currentTenantId } = this.paroleStore.rootStore.tenantStore;
    if (!isSupportedTenantId(currentTenantId)) {
      throw new Error(
        `ParoleAPIClient.${methodName} has no real data source for tenant ` +
          `[${currentTenantId}].`,
      );
    }
    return currentTenantId;
  }

  /**
   * Every resident record in the current tenant.
   *
   * @param methodName - The calling method, named in the error.
   * @param dateRange - Narrows the query server-side; omit to fetch them all.
   */
  private async getResidentsForState(
    methodName: string,
    dateRange?: FirestoreDateRangeFilter,
  ): Promise<Array<WorkflowsResidentRecord>> {
    const currentTenantId = this.requireSupportedTenant(methodName);
    return this.paroleStore.rootStore.firestoreStore.getResidentsForState(
      currentTenantId,
      dateRange,
    );
  }

  /**
   * The Parole Board client profiles of these residents, by pseudonymizedId.
   * A resident with no profile document has no entry. Fetches by document id
   * when the residents query was narrowed to a date range, and otherwise
   * fetches the whole tenant's profiles in one query, since batching an id
   * lookup over every resident in a state would take hundreds of queries.
   *
   * @param residents - Residents of the current tenant.
   * @param dateRange - The filter the residents query was narrowed by, if any.
   */
  private async profilesByPseudonymizedId(
    residents: Array<WorkflowsResidentRecord>,
    dateRange: FirestoreDateRangeFilter | undefined,
  ): Promise<Map<string, ParoleBoardClientProfileRecord>> {
    const currentTenantId = this.requireSupportedTenant("hearings");
    const { firestoreStore } = this.paroleStore.rootStore;
    const profiles = dateRange
      ? await firestoreStore.getParoleBoardClientProfilesByRecordIds(
          residents.map((resident) => resident.recordId),
          currentTenantId,
        )
      : await firestoreStore.getParoleBoardClientProfilesForState(
          currentTenantId,
        );
    return new Map(
      profiles.map((profile) => [profile.pseudonymizedId, profile]),
    );
  }

  /**
   * Narrows the hearings() query to the tenant's docket window, so the docket
   * does not fetch every resident in the state.
   */
  private hearingDateRangeFilter(): FirestoreDateRangeFilter | undefined {
    const { windowDaysBefore, windowDaysAfter } =
      this.paroleStore.config.docketConfig;
    if (windowDaysAfter === undefined) return undefined;

    return {
      field: "metadata.docketHearingDate",
      startDateInclusive: formatDateToISO(
        subDays(startOfToday(), windowDaysBefore ?? 0),
      ),
      endDateInclusive: formatDateToISO(
        addDays(startOfToday(), windowDaysAfter),
      ),
    };
  }

  /**
   * This resident's docket row, or undefined when they have no scheduled
   * hearing to show.
   */
  private hearingForResident(
    resident: WorkflowsResidentRecord,
    profile: ParoleBoardClientProfileRecord | undefined,
  ): ParoleHearing | undefined {
    const hearingDate = this.docketHearingDate(resident);
    if (!hearingDate) return undefined;

    const hearing = this.scheduledHearing(profile);

    return {
      pseudonymizedId: resident.pseudonymizedId,
      displayId: resident.displayId,
      individualName: this.nameForResident(resident),
      hearingDate,
      hearingDateIsPlaceholder: hearing?.hearingDateIsPlaceholder,
      hearingType: hearing?.hearingType ?? UNKNOWN_TEXT,
      facility: this.facilityForResident(resident, profile),
    };
  }

  /**
   * The resident's soonest scheduled hearing, read from
   * `parole_board_client_profile.parole_hearings`. At most one per resident,
   * since ParoleHearing.pseudonymizedId is the person's id and two rows would
   * open the same case profile twice.
   *
   * @param profile - The resident's Parole Board client profile, if any.
   */
  private scheduledHearing(
    profile: ParoleBoardClientProfileRecord | undefined,
  ): ScheduledHearing | undefined {
    return (profile?.paroleHearings ?? [])
      .flatMap((hearing) =>
        hearing.hearingStatus === HEARING_STATUS_SCHEDULED &&
        hearing.hearingDate
          ? [
              {
                hearingDate: hearing.hearingDate,
                hearingType: hearing.hearingType,
                hearingDateIsPlaceholder: hearing.hearingDateIsPlaceholder,
              },
            ]
          : [],
      )
      .sort((a, b) => a.hearingDate.localeCompare(b.hearingDate))[0];
  }

  /**
   * Hearings the Board already held, newest first, read from
   * `parole_board_client_profile.parole_hearings`. A hearing without a date is
   * dropped, since the list cannot place it.
   *
   * @param profile - The resident's Parole Board client profile, if any.
   */
  private hearingHistoryForResident(
    profile: ParoleBoardClientProfileRecord | undefined,
  ): Array<ParoleHearingHistoryEntry> {
    return (profile?.paroleHearings ?? [])
      .flatMap((hearing) =>
        hearing.hearingStatus === HEARING_STATUS_PREVIOUS && hearing.hearingDate
          ? [
              {
                hearingDate: hearing.hearingDate,
                hearingType: hearing.hearingType ?? UNKNOWN_TEXT,
                hearingSubtype: hearing.hearingSubtype,
                hearingDecision: hearing.hearingDecision,
              },
            ]
          : [],
      )
      .sort((a, b) => b.hearingDate.localeCompare(a.hearingDate));
  }

  /**
   * The hearing date the docket and case profile show, which the backend
   * computes as docket_hearing_date: the soonest scheduled hearing, else the
   * tenant's fallback dates (US_ID's hearing due dates). The docket query
   * filters on this same field, so the rows it returns are the rows it shows.
   *
   * @param resident - The resident whose docket hearing date to read.
   */
  private docketHearingDate(
    resident: WorkflowsResidentRecord,
  ): string | undefined {
    const { metadata } = resident;
    return isSupportedTenantMetadata(metadata)
      ? metadata.docketHearingDate
      : undefined;
  }

  /**
   * The resident's name as the docket and case profile show it. US_ID puts the
   * surname first ("Last, First Middle"); other tenants read "First Middle
   * Last". A missing part is dropped along with its separator.
   *
   * @param resident - The resident whose name to format.
   */
  private nameForResident(resident: WorkflowsResidentRecord): string {
    if (resident.metadata.stateCode === "US_ID") {
      return formatNameLastFirstMiddle(resident.personName);
    }
    return addDisplayName({ fullName: resident.personName }).displayName;
  }

  /**
   * Assembles the whole case profile from one resident record, filling each
   * field the tenant does not source with its UNKNOWN placeholder.
   */
  private caseDetailForResident(
    resident: WorkflowsResidentRecord,
    profile: ParoleBoardClientProfileRecord | undefined,
  ): ParoleCase {
    const hearing = this.scheduledHearing(profile);
    const dates = this.sourceableDatesForResident(resident, profile);

    return {
      pseudonymizedId: resident.pseudonymizedId,
      displayId: resident.displayId,
      name: this.nameForResident(resident),
      dob: dates.dob ?? UNKNOWN_DATE,
      gender: resident.gender ?? UNKNOWN_TEXT,
      currentFacility: this.facilityForResident(resident, profile),
      custodyLevel: resident.custodyLevel ?? UNKNOWN_TEXT,
      caseManagerName: profile?.demographics.caseManager ?? UNKNOWN_TEXT,
      hearingDate: this.docketHearingDate(resident),
      hearingDateIsPlaceholder: hearing?.hearingDateIsPlaceholder,
      hearingType: hearing?.hearingType ?? UNKNOWN_TEXT,
      sentenceStartDate: dates.sentenceStartDate ?? UNKNOWN_DATE,
      paroleEligibilityDate: dates.paroleEligibilityDate ?? UNKNOWN_DATE,
      mandatoryReleaseDate: dates.mandatoryReleaseDate ?? UNKNOWN_DATE,
      lifeSentence: dates.lifeSentence,
      parolePlan: this.parolePlanForResident(profile),
      attachments: this.attachmentsForResident(profile),
      conductHistory: this.conductHistoryForResident(profile),
      disciplinaryFacilityNotes:
        profile?.disciplinarySummary?.disciplinaryFacilityNotes,
      stg: profile?.securityThreatGroup?.stg,
      communitySupervisionPlan:
        this.communitySupervisionPlanForResident(profile),
      docPrograms: this.docProgramsForResident(profile),
      edovoPrograms: this.edovoProgramsForResident(profile),
      caseNotes: this.caseNotesForResident(profile),
      hearingHistory: this.hearingHistoryForResident(profile),
      offenseHistory: {
        offenses: this.offensesForResident(profile),
        priorConvictions: this.priorConvictionsForResident(profile),
        victimInvolved: false,
        victimAttendingHearing: false,
      },
      riskAssessments: this.riskAssessmentsForResident(profile),
      riskAndNeedsFactors: this.riskAndNeedsFactorsForResident(profile),
    };
  }

  /**
   * One entry per sentence from
   * `parole_board_client_profile.active_sentences`, or the single
   * `[UNKNOWN_OFFENSE]` placeholder if that's empty -- unhydrated for the
   * resident's state, or they genuinely have no active sentence.
   */
  private offensesForResident(
    profile: ParoleBoardClientProfileRecord | undefined,
  ): ParoleOffenseHistory["offenses"] {
    const sentences = profile?.activeSentences ?? [];

    if (sentences.length === 0) return [UNKNOWN_OFFENSE];

    const [firstSentence, ...restSentences] = sentences;
    return [
      this.offenseForSentence(firstSentence),
      ...restSentences.map((sentence) => this.offenseForSentence(sentence)),
    ];
  }

  /** Maps one backend sentence onto the offense the profile renders. */
  private offenseForSentence(
    sentence: ParoleBoardClientProfileSentence,
  ): ParoleOffense {
    return {
      county: sentence.sentenceConvictionCounty ?? UNKNOWN_TEXT,
      docket: sentence.sentenceDocket ?? UNKNOWN_TEXT,
      conviction: sentence.sentenceChargeName ?? UNKNOWN_TEXT,
      statute: sentence.sentenceStatute,
      classFelony: sentence.sentenceFelonyClass ?? UNKNOWN_TEXT,
      sentence: sentence.sentenceLength ?? UNKNOWN_TEXT,
      dateOfOffense: sentence.sentenceOffenseDate ?? UNKNOWN_DATE,
      convictionDate: sentence.sentenceConvictionDate ?? UNKNOWN_DATE,
      offenseNarrative: sentence.sentenceSummary ?? UNKNOWN_TEXT,
      sentenceStartDate: realSentenceDate(sentence.sentenceStartDate),
      paroleEligibilityDate: realSentenceDate(
        sentence.sentenceParoleEligibilityDate,
      ),
      fullTermDate: realSentenceDate(sentence.sentenceFullTermReleaseDate),
      isLife: sentence.sentenceIsLife,
      indeterminateStartDate: realSentenceDate(
        sentence.sentenceIndeterminateStartDate,
      ),
      indeterminateEndDateInclusive: realSentenceDate(
        sentence.sentenceIndeterminateEndDateInclusive,
      ),
    };
  }

  /**
   * The resident's facility, preferring the profile struct's own value over the
   * resident record's `facilityId`. US_CO resolves the struct field to a
   * facility name where `facilityId` is a raw code; US_IX selects `facilityId`
   * straight through today, so the two agree there for now.
   */
  private facilityForResident(
    resident: WorkflowsResidentRecord,
    profile: ParoleBoardClientProfileRecord | undefined,
  ): string {
    return (
      profile?.demographics.facility ?? resident.facilityId ?? UNKNOWN_TEXT
    );
  }

  /**
   * Prior charges from the profile's criminal history. An entry missing
   * either the charge or the date is dropped, since ParoleConviction requires
   * both and any placeholder would misrepresent a real charge.
   */
  private priorConvictionsForResident(
    profile: ParoleBoardClientProfileRecord | undefined,
  ): Array<ParoleConviction> {
    const history = profile?.criminalHistory ?? [];
    return history.flatMap((entry) =>
      entry.historyCharge && entry.historyDate
        ? [{ charge: entry.historyCharge, date: entry.historyDate }]
        : [],
    );
  }

  /** Disciplinary records from the profile's violations. */
  private conductHistoryForResident(
    profile: ParoleBoardClientProfileRecord | undefined,
  ): Array<ParoleConductRecord> {
    const violations = profile?.violations ?? [];
    return violations.map((violation) => ({
      date: violation.violationDate ?? UNKNOWN_DATE,
      facility: violation.violationFacility ?? UNKNOWN_TEXT,
      violation: violation.violationType ?? UNKNOWN_TEXT,
      description: violation.violationDescription ?? UNKNOWN_TEXT,
      severity: violation.violationCategory ?? UNKNOWN_TEXT,
      disposition: violation.violationSanction ?? UNKNOWN_TEXT,
      isPending: violation.violationIsPending ?? false,
    }));
  }

  /**
   * DOC programs from the profile. A program whose raw status this client
   * does not recognize is dropped rather than shown under a guessed one,
   * because status has no safe placeholder.
   */
  private docProgramsForResident(
    profile: ParoleBoardClientProfileRecord | undefined,
  ): Array<ParoleDocProgram> {
    const programs = profile?.programs ?? [];
    return programs.flatMap((program) => {
      const status = program.programStatus
        ? programStatusForRawLabel(program.programStatus)
        : undefined;
      if (!status) return [];

      return [
        {
          name: program.programName ?? UNKNOWN_TEXT,
          referralDate: program.programReferralDate,
          startDate: program.programStartDate,
          completionDate: program.programCompletionDate ?? null,
          type: program.programCategory ?? UNKNOWN_TEXT,
          criminogenicNeed: program.programNeed ?? UNKNOWN_TEXT,
          status,
        },
      ];
    });
  }

  /**
   * Edovo programs from the profile, dropping any whose raw status this
   * client does not recognize, for the same reason as docProgramsForResident.
   */
  private edovoProgramsForResident(
    profile: ParoleBoardClientProfileRecord | undefined,
  ): Array<ParoleEdovoProgram> {
    const programs = profile?.edovoPrograms ?? [];
    return programs.flatMap((program) => {
      const status = program.edovoProgramStatus
        ? EDOVO_STATUS_BY_RAW_LABEL[program.edovoProgramStatus]
        : undefined;
      if (!status) return [];

      return [
        {
          title: program.edovoProgramName ?? UNKNOWN_TEXT,
          completionDate: program.edovoProgramCompletionDate ?? null,
          status,
          result: program.edovoProgramResult
            ? EDOVO_RESULT_BY_RAW_LABEL[program.edovoProgramResult]
            : undefined,
          startDate: program.edovoProgramStartDate,
          durationDays: program.edovoProgramDuration,
        },
      ];
    });
  }

  /**
   * Case notes from the profile. A note missing its date or body is dropped,
   * since the list can neither place nor show it. The backend sends no note
   * id, so each note's position in the list serves as one.
   */
  private caseNotesForResident(
    profile: ParoleBoardClientProfileRecord | undefined,
  ): Array<ParoleCaseNote> {
    const notes = profile?.caseNotes ?? [];
    return notes.flatMap((note, index) =>
      note.noteDate && note.noteBody
        ? [
            {
              id: String(index),
              type: note.noteType ?? UNKNOWN_TEXT,
              date: note.noteDate,
              body: note.noteBody,
            },
          ]
        : [],
    );
  }

  /**
   * Risk assessments from the profile. An assessment missing its tool, date,
   * or score is dropped, since each is required downstream.
   */
  private riskAssessmentsForResident(
    profile: ParoleBoardClientProfileRecord | undefined,
  ): Array<ParoleRiskAssessment> {
    const assessments = profile?.riskAssessments ?? [];

    return assessments.flatMap((assessment) => {
      const tool = assessment.assessmentType
        ? riskToolForRawLabel(assessment.assessmentType)
        : undefined;
      if (
        !tool ||
        !assessment.assessmentDate ||
        assessment.assessmentScore === undefined
      ) {
        return [];
      }

      return [
        {
          tool,
          level: assessment.assessmentLevel,
          score: assessment.assessmentScore,
          maxScore: assessment.assessmentMaxScore,
          date: assessment.assessmentDate,
          // CARAS scores its items as regression coefficients rather than a
          // score-over-max-score pair (see paroleCarasFactorSchema), which
          // this wire shape has no fields for -- carasFactors stays unset
          // here until the backend has a place to carry value/coefficient.
          ...(tool !== "CARAS" ? subcategoriesForAssessment(assessment) : {}),
        },
      ];
    });
  }

  /**
   * The resident's latest health/risk-and-needs classification, one entry
   * per domain. The scale is shown as-is; a domain with no code is dropped
   * rather than fabricated.
   */
  private riskAndNeedsFactorsForResident(
    profile: ParoleBoardClientProfileRecord | undefined,
  ): Array<ParoleRiskNeedFactor> {
    const summary = profile?.latestRiskNeedSummary;
    if (!summary) return [];

    return RISK_NEED_FACTOR_FIELDS.flatMap(({ field, factor }) => {
      const entry = summary[field];
      if (!entry?.code) return [];

      return [
        { factor, score: entry.code, scale: entry.scale ?? UNKNOWN_TEXT },
      ];
    });
  }

  /**
   * The resident's parole plan, or the schema's own "no plan on file" value
   * when the profile carries none.
   */
  private parolePlanForResident(
    profile: ParoleBoardClientProfileRecord | undefined,
  ): ParolePlan {
    const plan = profile?.parolePlan;
    if (!plan?.parolePlanIsOnFile) {
      return { onFile: false, documents: [] };
    }

    return {
      onFile: true,
      lastUpdated: plan.parolePlanLastUpdatedDate,
      documents: plan.parolePlanUrl
        ? [
            {
              url: plan.parolePlanUrl,
              uploadDate: plan.parolePlanDate ?? UNKNOWN_DATE,
            },
          ]
        : [],
    };
  }

  /**
   * The sponsor on this resident's parole plan, as an at-most-one-entry
   * list -- the backend struct carries a single plan, not several. No live
   * record has shown `parolePlanRecommended` populated yet, so this
   * conservatively drops the entry whenever that value isn't one of
   * PAROLE_RECOMMENDED_STATUS's exact strings, rather than guess at a
   * decision-relevant recommendation.
   */
  private communitySupervisionPlanForResident(
    profile: ParoleBoardClientProfileRecord | undefined,
  ): Array<ParoleCommunitySupervisionPlanEntry> {
    const plan = profile?.parolePlan;
    const recommended = plan?.parolePlanRecommended;
    if (!plan?.parolePlanIsOnFile || !plan.parolePlanSponsorName) return [];
    if (!recommended || !RECOMMENDED_STATUS_OPTIONS.has(recommended)) {
      return [];
    }

    return [
      {
        // No source yet for what kind of plan this is (e.g. "Home Plan").
        typeOfPlan: UNKNOWN_TEXT,
        name: plan.parolePlanSponsorName,
        relationship: plan.parolePlanSponsorRelationship ?? UNKNOWN_TEXT,
        address: plan.parolePlanAddress ?? UNKNOWN_TEXT,
        recommended: recommended as ParoleRecommendedStatus,
      },
    ];
  }

  /**
   * Attachments from the profile. One with no URL has nothing to link to and
   * is dropped; a missing name or upload date falls back to a placeholder,
   * because the link is still useful without them.
   */
  private attachmentsForResident(
    profile: ParoleBoardClientProfileRecord | undefined,
  ): Array<ParoleAttachment> {
    const attachments = profile?.attachments ?? [];
    return attachments.flatMap((attachment) =>
      attachment.attachmentUrl
        ? [
            {
              name: attachment.attachmentName ?? UNKNOWN_TEXT,
              type: attachmentTypeForRawLabel(attachment.attachmentType),
              url: attachment.attachmentUrl,
              uploadDate: attachment.attachmentUploadDate ?? UNKNOWN_DATE,
            },
          ]
        : [],
    );
  }

  /**
   * Sources the profile dates that each state's metadata carries under
   * different fields. caseDetailForResident falls back to UNKNOWN_DATE for
   * whichever come back undefined.
   */
  private sourceableDatesForResident(
    resident: WorkflowsResidentRecord,
    profile: ParoleBoardClientProfileRecord | undefined,
  ): {
    sentenceStartDate: string | undefined;
    paroleEligibilityDate: string | undefined;
    mandatoryReleaseDate: string | undefined;
    lifeSentence?: ParoleLifeSentence;
    dob: string | undefined;
  } {
    const dob = profile?.demographics.residentDob;
    // The soonest-eligibility sentence, first per the backend's own
    // ordering (see recidiviz-data#102399's ORDER BY) -- the same one
    // offensesForResident() lists first.
    const firstSentence = profile?.activeSentences?.[0];

    if (resident.metadata.stateCode === "US_ID") {
      return {
        dob,
        sentenceStartDate: resident.admissionDate
          ? formatDateToISO(resident.admissionDate)
          : undefined,
        paroleEligibilityDate:
          realSentenceDate(firstSentence?.sentenceParoleEligibilityDate) ??
          resident.metadata.paroleEligibilityDate,
        mandatoryReleaseDate: realSentenceDate(
          firstSentence?.sentenceMandatoryReleaseDate,
        ),
      };
    }
    if (resident.metadata.stateCode === "US_CO") {
      const { cohortLabel, incarcerationStartDate, pedTent, mrdTent } =
        resident.metadata;
      const sentenceStartDate = incarcerationStartDate
        ? formatDateToISO(incarcerationStartDate)
        : undefined;

      // Colorado fills life and interstate compact sentence dates with
      // placeholders, so only a standard sentence's dates are shown.
      if (cohortLabel !== "STANDARD") {
        return {
          dob,
          sentenceStartDate,
          paroleEligibilityDate: undefined,
          mandatoryReleaseDate: undefined,
          lifeSentence: LIFE_SENTENCE_BY_US_CO_COHORT[cohortLabel],
        };
      }

      return {
        dob,
        sentenceStartDate,
        paroleEligibilityDate:
          realSentenceDate(firstSentence?.sentenceParoleEligibilityDate) ??
          (pedTent ? formatDateToISO(pedTent) : undefined),
        mandatoryReleaseDate:
          realSentenceDate(firstSentence?.sentenceMandatoryReleaseDate) ??
          (mrdTent ? formatDateToISO(mrdTent) : undefined),
      };
    }
    return {
      dob,
      sentenceStartDate: undefined,
      paroleEligibilityDate: undefined,
      mandatoryReleaseDate: undefined,
    };
  }
}
