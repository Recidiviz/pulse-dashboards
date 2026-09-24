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
  ParoleBoardClientProfileRiskAssessment,
  ParoleBoardClientProfileSentence,
  ParoleCase,
  ParoleCommunitySupervisionPlanEntry,
  ParoleConductRecord,
  ParoleConviction,
  ParoleDocProgram,
  ParoleEdovoProgram,
  ParoleHearing,
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
import { formatDateToISO } from "../../utils";
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

/** The fields the mappers below read off a resident's scheduled hearing. */
type ScheduledHearing = Pick<
  ParoleBoardClientProfileHearing,
  "hearingDate" | "hearingType"
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

/**
 * Returns the date, or undefined when a source system wrote a year-9999
 * placeholder (e.g. "9999-01-20") to mean "no defined date". Only the year
 * marks the placeholder, so a real far-future date such as a life sentence's
 * mandatory release is kept.
 *
 * @param date - A sentence-level date, as the source system wrote it.
 */
function realSentenceDate(date: string | undefined): string | undefined {
  return date && !date.startsWith("9999-") ? date : undefined;
}

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
 * Builds one assessment's subcategory breakdown from its raw category rows. A
 * row with no assessmentCategoryName is a bare score/date entry from an
 * earlier, pre-breakdown assessment, and contributes nothing.
 *
 * Returns `{}` rather than `{ subcategories: [] }` when no row has one, so
 * SubcategoryBreakdownChart renders nothing instead of an empty chart.
 */
function subcategoriesFromRows(
  rows: Array<ParoleBoardClientProfileRiskAssessment>,
): Pick<ParoleRiskAssessment, "subcategories"> {
  const subcategories: Array<ParoleSubcategoryScore> = rows.flatMap((row) =>
    row.assessmentCategoryName &&
    row.assessmentCategoryScore !== undefined &&
    row.assessmentCategoryMaxScore !== undefined
      ? [
          {
            name: row.assessmentCategoryName,
            score: row.assessmentCategoryScore,
            maxScore: row.assessmentCategoryMaxScore,
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
   * One docket row per resident with an upcoming scheduled hearing. A
   * resident with no scheduled hearing is left out.
   */
  async hearings(): Promise<Array<ParoleHearing>> {
    const residents = await this.getResidentsForState(
      "hearings",
      this.hearingDateRangeFilter(),
    );

    return residents.flatMap(
      (resident) => this.hearingForResident(resident) ?? [],
    );
  }

  /**
   * The full case profile for one resident. Throws when the current tenant
   * has no resident under that id.
   *
   * @param docId - The resident's DOC id, as the docket links to it.
   */
  async caseDetail(docId: string): Promise<ParoleCase> {
    const currentTenantId = this.requireSupportedTenant("caseDetail");

    const resident =
      await this.paroleStore.rootStore.firestoreStore.getResidentByPersonExternalId(
        currentTenantId,
        docId,
      );
    if (!resident) {
      throw new Error(
        `No ${currentTenantId} resident found for docId [${docId}].`,
      );
    }

    return this.caseDetailForResident(resident);
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
   * Narrows the hearings() query to the tenant's docket window, so the docket
   * does not fetch every resident in the state and window them client-side in
   * ParoleDocketPresenter.hearingsInWindow.
   */
  private hearingDateRangeFilter(): FirestoreDateRangeFilter | undefined {
    const { currentTenantId } = this.paroleStore.rootStore.tenantStore;
    if (currentTenantId !== "US_CO") return undefined;

    const { docketWindowDaysBefore, docketWindowDaysAfter } =
      this.paroleStore.config;
    if (docketWindowDaysAfter === undefined) return undefined;

    return {
      field: "metadata.nextParoleHearingDate",
      startDateInclusive: formatDateToISO(
        subDays(startOfToday(), docketWindowDaysBefore ?? 0),
      ),
      endDateInclusive: formatDateToISO(
        addDays(startOfToday(), docketWindowDaysAfter),
      ),
    };
  }

  /**
   * This resident's docket row, or undefined when they have no scheduled
   * hearing to show.
   */
  private hearingForResident(
    resident: WorkflowsResidentRecord,
  ): ParoleHearing | undefined {
    if (!isSupportedTenantId(resident.metadata.stateCode)) return undefined;

    const hearing = this.scheduledHearing(resident);
    const hearingDate = hearing?.hearingDate ?? this.flatHearingDate(resident);
    if (!hearingDate) return undefined;

    return {
      docId: resident.personExternalId,
      displayId: resident.displayId,
      individualName: addDisplayName({ fullName: resident.personName })
        .displayName,
      hearingDate,
      hearingType: hearing?.hearingType ?? UNKNOWN_TEXT,
      facility: this.facilityForResident(resident),
    };
  }

  /**
   * The resident's soonest scheduled hearing, read from
   * `parole_board_client_profile.parole_hearings`. At most one per resident,
   * since ParoleHearing.docId is the person's id and two rows would open the
   * same case profile twice.
   *
   * @param resident - The resident whose hearing to find.
   */
  private scheduledHearing(
    resident: WorkflowsResidentRecord,
  ): ScheduledHearing | undefined {
    return (this.profileFor(resident)?.paroleHearings ?? [])
      .flatMap((hearing) =>
        hearing.hearingStatus === "SCHEDULED" && hearing.hearingDate
          ? [
              {
                hearingDate: hearing.hearingDate,
                hearingType: hearing.hearingType,
              },
            ]
          : [],
      )
      .sort((a, b) => a.hearingDate.localeCompare(b.hearingDate))[0];
  }

  /**
   * The flat hearing date us_ix_resident_metadata carries beside the parole
   * hearings struct. Most US_ID residents have no SCHEDULED entry in that
   * struct, so this is where their hearing date comes from. It carries no
   * hearing type, so callers supply their own placeholder for that.
   *
   * Drop this once the struct covers them, not merely once it exists.
   *
   * @param resident - The resident whose flat hearing date to read.
   */
  private flatHearingDate(
    resident: WorkflowsResidentRecord,
  ): string | undefined {
    const { metadata } = resident;
    if (metadata.stateCode !== "US_ID") return undefined;
    return metadata.nextParoleHearingDate ?? metadata.initialParoleHearingDate;
  }

  /**
   * Assembles the whole case profile from one resident record, filling each
   * field the tenant does not source with its UNKNOWN placeholder.
   */
  private caseDetailForResident(resident: WorkflowsResidentRecord): ParoleCase {
    const hearing = this.scheduledHearing(resident);
    const dates = this.sourceableDatesForResident(resident);

    return {
      docId: resident.personExternalId,
      displayId: resident.displayId,
      name: addDisplayName({ fullName: resident.personName }).displayName,
      dob: dates.dob ?? UNKNOWN_DATE,
      gender: resident.gender ?? UNKNOWN_TEXT,
      currentFacility: this.facilityForResident(resident),
      custodyLevel: resident.custodyLevel ?? UNKNOWN_TEXT,
      caseManagerName:
        this.profileFor(resident)?.demographics.caseManager ?? UNKNOWN_TEXT,
      hearingDate: hearing?.hearingDate ?? this.flatHearingDate(resident),
      hearingType: hearing?.hearingType ?? UNKNOWN_TEXT,
      sentenceStartDate: dates.sentenceStartDate ?? UNKNOWN_DATE,
      paroleEligibilityDate: dates.paroleEligibilityDate ?? UNKNOWN_DATE,
      mandatoryReleaseDate: dates.mandatoryReleaseDate ?? UNKNOWN_DATE,
      parolePlan: this.parolePlanForResident(resident),
      attachments: this.attachmentsForResident(resident),
      conductHistory: this.conductHistoryForResident(resident),
      communitySupervisionPlan:
        this.communitySupervisionPlanForResident(resident),
      docPrograms: this.docProgramsForResident(resident),
      edovoPrograms: this.edovoProgramsForResident(resident),
      offenseHistory: {
        offenses: this.offensesForResident(resident),
        priorConvictions: this.priorConvictionsForResident(resident),
        victimInvolved: false,
        victimAttendingHearing: false,
      },
      riskAssessments: this.riskAssessmentsForResident(resident),
      riskAndNeedsFactors: this.riskAndNeedsFactorsForResident(resident),
    };
  }

  /**
   * One entry per sentence from
   * `parole_board_client_profile.active_sentences`, or the single
   * `[UNKNOWN_OFFENSE]` placeholder if that's empty -- unhydrated for the
   * resident's state, or they genuinely have no active sentence.
   */
  private offensesForResident(
    resident: WorkflowsResidentRecord,
  ): ParoleOffenseHistory["offenses"] {
    const sentences = this.profileFor(resident)?.activeSentences ?? [];

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
      offenseNarrative: UNKNOWN_TEXT,
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
  private facilityForResident(resident: WorkflowsResidentRecord): string {
    return (
      this.profileFor(resident)?.demographics.facility ??
      resident.facilityId ??
      UNKNOWN_TEXT
    );
  }

  /**
   * The resident's paroleBoardClientProfile, which every mapper below reads
   * from. Undefined when the resident belongs to a tenant that carries none.
   */
  private profileFor(resident: WorkflowsResidentRecord) {
    const { metadata } = resident;
    return isSupportedTenantMetadata(metadata)
      ? metadata.paroleBoardClientProfile
      : undefined;
  }

  /**
   * Prior charges from the profile's criminal history. An entry missing
   * either the charge or the date is dropped, since ParoleConviction requires
   * both and any placeholder would misrepresent a real charge.
   */
  private priorConvictionsForResident(
    resident: WorkflowsResidentRecord,
  ): Array<ParoleConviction> {
    const history = this.profileFor(resident)?.criminalHistory ?? [];
    return history.flatMap((entry) =>
      entry.historyCharge && entry.historyDate
        ? [{ charge: entry.historyCharge, date: entry.historyDate }]
        : [],
    );
  }

  /** Disciplinary records from the profile's violations. */
  private conductHistoryForResident(
    resident: WorkflowsResidentRecord,
  ): Array<ParoleConductRecord> {
    const violations = this.profileFor(resident)?.violations ?? [];
    return violations.map((violation) => ({
      date: violation.violationDate ?? UNKNOWN_DATE,
      facility: violation.violationFacility ?? UNKNOWN_TEXT,
      violation: violation.violationType ?? UNKNOWN_TEXT,
      description: violation.violationDescription ?? UNKNOWN_TEXT,
      severity: violation.violationCategory ?? UNKNOWN_TEXT,
      disposition: violation.violationSanction ?? UNKNOWN_TEXT,
    }));
  }

  /**
   * DOC programs from the profile. A program whose raw status this client
   * does not recognize is dropped rather than shown under a guessed one,
   * because status has no safe placeholder.
   */
  private docProgramsForResident(
    resident: WorkflowsResidentRecord,
  ): Array<ParoleDocProgram> {
    const programs = this.profileFor(resident)?.programs ?? [];
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
    resident: WorkflowsResidentRecord,
  ): Array<ParoleEdovoProgram> {
    const programs = this.profileFor(resident)?.edovoPrograms ?? [];
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
   * Risk assessments from the profile, one per date and tool. An assessment
   * missing its tool, date, score, or maximum is dropped, since every one of
   * those is required downstream.
   */
  private riskAssessmentsForResident(
    resident: WorkflowsResidentRecord,
  ): Array<ParoleRiskAssessment> {
    const rows = this.profileFor(resident)?.riskAssessments ?? [];

    // Every row for the same assessment repeats that assessment's own
    // assessmentDate/assessmentType/assessmentScore/assessmentMaxScore, and
    // carries one subcategory of it (assessmentCategory*) -- so grouping by
    // date+type recovers one assessment per group, with one subcategory
    // entry per row in that group.
    const rowsByAssessment = new Map<
      string,
      Array<ParoleBoardClientProfileRiskAssessment>
    >();
    for (const row of rows) {
      const key = `${row.assessmentDate}@@${row.assessmentType}`;
      const group = rowsByAssessment.get(key);
      if (group) {
        group.push(row);
      } else {
        rowsByAssessment.set(key, [row]);
      }
    }

    return [...rowsByAssessment.values()].flatMap((group) => {
      const [firstRow] = group;
      const tool = firstRow.assessmentType
        ? riskToolForRawLabel(firstRow.assessmentType)
        : undefined;
      if (
        !tool ||
        !firstRow.assessmentDate ||
        firstRow.assessmentScore === undefined
      ) {
        return [];
      }

      return [
        {
          tool,
          level: firstRow.assessmentLevel,
          score: firstRow.assessmentScore,
          maxScore: firstRow.assessmentMaxScore,
          date: firstRow.assessmentDate,
          // CARAS scores its items as regression coefficients rather than a
          // score-over-max-score pair (see paroleCarasFactorSchema), which
          // this wire shape has no fields for -- carasFactors stays unset
          // here until the backend has a place to carry value/coefficient.
          ...(tool !== "CARAS" ? subcategoriesFromRows(group) : {}),
        },
      ];
    });
  }

  /**
   * The resident's latest health/risk-and-needs classification, one entry
   * per domain with a [score, scale] pair. The scale is shown as-is; a
   * domain missing from the summary is dropped rather than fabricated.
   */
  private riskAndNeedsFactorsForResident(
    resident: WorkflowsResidentRecord,
  ): Array<ParoleRiskNeedFactor> {
    const summary = this.profileFor(resident)?.latestRiskNeedSummary;
    if (!summary) return [];

    return RISK_NEED_FACTOR_FIELDS.flatMap(({ field, factor }) => {
      const pair = summary[field];
      if (!pair) return [];

      const [score, scale] = pair;
      return [{ factor, score, scale }];
    });
  }

  /**
   * The resident's parole plan, or the schema's own "no plan on file" value
   * when the profile carries none.
   */
  private parolePlanForResident(resident: WorkflowsResidentRecord): ParolePlan {
    const plan = this.profileFor(resident)?.parolePlan;
    if (!plan?.parolePlanIsOnFile) {
      // { onFile: false, documents: [] } is the schema's own "no plan on
      // file" representation (see CO_REAL_CASE_PROFILES in fixture.ts), not
      // a fabricated value.
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
    resident: WorkflowsResidentRecord,
  ): Array<ParoleCommunitySupervisionPlanEntry> {
    const plan = this.profileFor(resident)?.parolePlan;
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
    resident: WorkflowsResidentRecord,
  ): Array<ParoleAttachment> {
    const attachments = this.profileFor(resident)?.attachments ?? [];
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
  private sourceableDatesForResident(resident: WorkflowsResidentRecord): {
    sentenceStartDate: string | undefined;
    paroleEligibilityDate: string | undefined;
    mandatoryReleaseDate: string | undefined;
    dob: string | undefined;
  } {
    const dob = this.profileFor(resident)?.demographics.residentDob;
    // The soonest-eligibility sentence, first per the backend's own
    // ordering (see recidiviz-data#102399's ORDER BY) -- the same one
    // offensesForResident() lists first.
    const firstSentence = this.profileFor(resident)?.activeSentences?.[0];

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
      return {
        dob,
        sentenceStartDate: resident.metadata.incarcerationStartDate
          ? formatDateToISO(resident.metadata.incarcerationStartDate)
          : undefined,
        paroleEligibilityDate:
          realSentenceDate(firstSentence?.sentenceParoleEligibilityDate) ??
          (resident.metadata.pedTent
            ? formatDateToISO(resident.metadata.pedTent)
            : undefined),
        mandatoryReleaseDate:
          realSentenceDate(firstSentence?.sentenceMandatoryReleaseDate) ??
          (resident.metadata.mrdTent
            ? formatDateToISO(resident.metadata.mrdTent)
            : undefined),
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
