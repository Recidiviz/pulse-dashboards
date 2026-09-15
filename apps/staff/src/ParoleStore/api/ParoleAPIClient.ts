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

// Both re-exported under this file's existing local names -- see
// PAROLE_UNKNOWN_DATE/PAROLE_UNKNOWN_TEXT in ~datatypes for what a component
// rendering one of these fields should check for before formatting it.
const UNKNOWN_TEXT = PAROLE_UNKNOWN_TEXT;
const UNKNOWN_DATE = PAROLE_UNKNOWN_DATE;

// ParoleCase.offenseHistory.offenses is non-empty, but a resident whose
// activeSentences is empty (not yet hydrated for their state, or they
// genuinely have none) has no per-sentence data to build a real one from --
// this stands in instead.
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

// sentence*LengthDays are raw day counts (see paroleBoardClientProfileSchema.ts);
// this is deliberately the plainest possible rendering -- converting to
// years/months would need a rounding convention nothing has specified yet.
function formatSentenceLengthDays(
  days: number | undefined,
): string | undefined {
  return days === undefined ? undefined : `${days} days`;
}

// US_CO's own source system uses a year-9999 date as its "no defined date"
// placeholder on sentence dates (e.g. sentence_mandatory_release_date of
// "9999-01-20") -- the same idea as this client's own UNKNOWN_DATE sentinel,
// but a different exact value, and specific to the year: a genuinely
// far-future projected date (e.g. a life sentence's mandatory release
// decades out) is real and kept. Applied to every sentence-level date this
// client reads, since all of them come from the same source.
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

function riskToolForRawLabel(raw: string): ParoleRiskTool | undefined {
  if (RISK_TOOL_OPTIONS.has(raw)) return raw as ParoleRiskTool;
  return RISK_TOOL_BY_RAW_LABEL[raw];
}

// Builds the subcategory breakdown for one assessment from its raw category
// rows. A row with no assessmentCategoryName is a bare score/date entry (an
// earlier, pre-breakdown assessment) and contributes nothing. Returns {}
// (not { subcategories: [] }) when no row has one, so
// SubcategoryBreakdownChart's `!assessment.subcategories` check still
// renders nothing rather than an empty chart.
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

  async hearings(): Promise<Array<ParoleHearing>> {
    const residents = await this.getResidentsForState(
      "hearings",
      this.hearingDateRangeFilter(),
    );

    return residents.flatMap(
      (resident) => this.hearingForResident(resident) ?? [],
    );
  }

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

  // Scopes the hearings() query itself to the tenant's docket window,
  // instead of fetching every resident in the state and windowing
  // client-side in ParoleDocketPresenter.hearingsInWindow. Only built for
  // US_CO for now: the metadata.nextParoleHearingDate field this filters on
  // (see US_CO's resident metadata schema) is populated by US_CO's pipeline
  // only. Other tenants fall back to undefined -- an unfiltered query,
  // exactly like before this existed -- until their pipelines populate the
  // same field.
  // TEMPORARY: the field path is metadata.nextParoleHearingDate because
  // that's where the current sandbox upload puts it.
  // TODO(OBT-47979): move this to the top-level field path (and extend to
  // other tenants) once the real backend export lands.
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

  private hearingForResident(
    resident: WorkflowsResidentRecord,
  ): ParoleHearing | undefined {
    if (!isSupportedTenantId(resident.metadata.stateCode)) return undefined;

    const hearing = this.nextScheduledHearing(resident);
    if (!hearing?.hearingDate) return undefined;

    return {
      docId: resident.personExternalId,
      displayId: resident.displayId,
      individualName: addDisplayName({ fullName: resident.personName })
        .displayName,
      hearingDate: hearing.hearingDate,
      hearingType: hearing.hearingType ?? UNKNOWN_TEXT,
      facility: resident.facilityId ?? UNKNOWN_TEXT,
    };
  }

  /**
   * The soonest upcoming hearing, read from
   * `parole_board_client_profile.parole_hearings`. Returns at most one row
   * per resident: ParoleHearing.docId is the person's DOC id, so two rows
   * per person would open the same case profile twice.
   */
  private nextScheduledHearing(
    resident: WorkflowsResidentRecord,
  ): ParoleBoardClientProfileHearing | undefined {
    const { metadata } = resident;
    const profile = this.profileFor(resident);

    const scheduled = (profile?.paroleHearings ?? [])
      .filter((hearing) => hearing.hearingStatus === "SCHEDULED")
      .filter((hearing) => hearing.hearingDate)
      .sort((a, b) => (a.hearingDate ?? "").localeCompare(b.hearingDate ?? ""));

    if (scheduled.length > 0) return scheduled[0];

    // TODO(XXXX): transitional -- us_ix_resident_metadata still emits the
    // flat next/initial hearing dates alongside the struct, so US_ID works
    // before parole_hearings is materialized. Drop this branch once it is.
    if (metadata.stateCode === "US_ID") {
      const hearingDate =
        metadata.nextParoleHearingDate ?? metadata.initialParoleHearingDate;
      if (!hearingDate) return undefined;
      return { hearingDate, hearingType: UNKNOWN_TEXT };
    }

    return undefined;
  }

  private caseDetailForResident(resident: WorkflowsResidentRecord): ParoleCase {
    const dates = this.sourceableDatesForResident(resident);

    return {
      docId: resident.personExternalId,
      displayId: resident.displayId,
      name: addDisplayName({ fullName: resident.personName }).displayName,
      dob: dates.dob ?? UNKNOWN_DATE,
      gender: resident.gender ?? UNKNOWN_TEXT,
      currentFacility: resident.facilityId ?? UNKNOWN_TEXT,
      custodyLevel: resident.custodyLevel ?? UNKNOWN_TEXT,
      caseManagerName:
        this.profileFor(resident)?.demographics.caseManager ?? UNKNOWN_TEXT,
      hearingDate: dates.hearingDate,
      hearingType: UNKNOWN_TEXT,
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

  private offenseForSentence(
    sentence: ParoleBoardClientProfileSentence,
  ): ParoleOffense {
    const { sentenceMinLengthDays, sentenceMaxLengthDays } = sentence;
    const indeterminateLengthDays =
      sentenceMinLengthDays !== undefined && sentenceMaxLengthDays !== undefined
        ? sentenceMaxLengthDays - sentenceMinLengthDays
        : undefined;

    return {
      county: sentence.sentenceConvictionCounty ?? UNKNOWN_TEXT,
      docket: sentence.sentenceDocket ?? UNKNOWN_TEXT,
      conviction: sentence.sentenceChargeName ?? UNKNOWN_TEXT,
      classFelony: sentence.sentenceFelonyClass ?? UNKNOWN_TEXT,
      sentence: sentence.sentenceLength ?? UNKNOWN_TEXT,
      dateOfOffense: sentence.sentenceOffenseDate ?? UNKNOWN_DATE,
      convictionDate: sentence.sentenceConvictionDate ?? UNKNOWN_DATE,
      offenseNarrative: UNKNOWN_TEXT,
      paroleEligibilityDate: realSentenceDate(
        sentence.sentenceParoleEligibilityDate,
      ),
      fullTermDate: realSentenceDate(sentence.sentenceFullTermReleaseDate),
      fixedLength: formatSentenceLengthDays(sentenceMinLengthDays),
      indeterminateLength: formatSentenceLengthDays(indeterminateLengthDays),
    };
  }

  private profileFor(resident: WorkflowsResidentRecord) {
    const { metadata } = resident;
    return isSupportedTenantMetadata(metadata)
      ? metadata.paroleBoardClientProfile
      : undefined;
  }

  private priorConvictionsForResident(
    resident: WorkflowsResidentRecord,
  ): Array<ParoleConviction> {
    const history = this.profileFor(resident)?.criminalHistory ?? [];
    // Both fields are required on ParoleConviction with no placeholder that
    // wouldn't misrepresent a real charge/date, so an entry missing either
    // is dropped rather than shown with one invented.
    return history.flatMap((entry) =>
      entry.historyCharge && entry.historyDate
        ? [{ charge: entry.historyCharge, date: entry.historyDate }]
        : [],
    );
  }

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

  private docProgramsForResident(
    resident: WorkflowsResidentRecord,
  ): Array<ParoleDocProgram> {
    const programs = this.profileFor(resident)?.programs ?? [];
    return programs.flatMap((program) => {
      const status = program.programStatus
        ? programStatusForRawLabel(program.programStatus)
        : undefined;
      // status is required with no safe placeholder -- a program whose raw
      // status this client doesn't recognize is dropped rather than shown
      // under a guessed one.
      if (!status) return [];

      return [
        {
          name: program.programName ?? UNKNOWN_TEXT,
          completionDate: program.programCompletionDate ?? null,
          type: program.programCategory ?? UNKNOWN_TEXT,
          criminogenicNeed: program.programNeed ?? UNKNOWN_TEXT,
          status,
        },
      ];
    });
  }

  private edovoProgramsForResident(
    resident: WorkflowsResidentRecord,
  ): Array<ParoleEdovoProgram> {
    const programs = this.profileFor(resident)?.edovoPrograms ?? [];
    return programs.flatMap((program) => {
      const status = program.edovoProgramStatus
        ? EDOVO_STATUS_BY_RAW_LABEL[program.edovoProgramStatus]
        : undefined;
      // Same reasoning as docProgramsForResident() -- drop rather than guess.
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
        firstRow.assessmentScore === undefined ||
        firstRow.assessmentMaxScore === undefined
      ) {
        return [];
      }

      return [
        {
          tool,
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

  private attachmentsForResident(
    resident: WorkflowsResidentRecord,
  ): Array<ParoleAttachment> {
    const attachments = this.profileFor(resident)?.attachments ?? [];
    // A URL-less attachment has nothing to link to, so it's dropped; name
    // and upload date fall back to placeholders since the link is still
    // useful without them.
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

  // Each state's metadata carries a different set of these date fields, so
  // they're sourced per state here; caseDetailForResident() falls back to
  // UNKNOWN_DATE for whichever come back undefined. hearingDate and dob are
  // the exceptions -- demographics.residentDob is the same shared category
  // both states select into (see profileFor()), same as parole_hearings, so
  // both are computed once below rather than duplicated into each branch.
  private sourceableDatesForResident(resident: WorkflowsResidentRecord): {
    hearingDate: string | undefined;
    sentenceStartDate: string | undefined;
    paroleEligibilityDate: string | undefined;
    mandatoryReleaseDate: string | undefined;
    dob: string | undefined;
  } {
    const hearingDate = this.nextScheduledHearing(resident)?.hearingDate;
    const dob = this.profileFor(resident)?.demographics.residentDob;
    // The soonest-eligibility sentence, first per the backend's own
    // ordering (see recidiviz-data#102399's ORDER BY) -- the same one
    // offensesForResident() lists first.
    const firstSentence = this.profileFor(resident)?.activeSentences?.[0];

    if (resident.metadata.stateCode === "US_ID") {
      return {
        hearingDate,
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
        hearingDate,
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
      hearingDate,
      dob,
      sentenceStartDate: undefined,
      paroleEligibilityDate: undefined,
      mandatoryReleaseDate: undefined,
    };
  }
}
