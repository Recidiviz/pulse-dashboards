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

import { z } from "zod";

// Sentinel values ParoleAPIClient fills a required ParoleCase/ParoleOffense
// field with when it has no real value to source (see UNKNOWN_DATE there --
// same sentinel used for "no real value" elsewhere, see MISSING_DATE_SENTINEL
// in workflowsResidentRecordSchema.ts). Exported so a component doing date
// arithmetic or formatting on a case-profile date (e.g. calculating age from
// dob) can check for this first, rather than rendering whatever a future
// date produces -- a negative age, in that case.
export const PAROLE_UNKNOWN_DATE = "9999-12-01";
export const PAROLE_UNKNOWN_TEXT = "Not yet available";

export function isParoleUnknownDate(date: string): boolean {
  return date === PAROLE_UNKNOWN_DATE;
}

// Tools recidiviz-data's StateAssessmentType also defines use its exact
// value, so `parole_board_client_profile.risk_assessments[].assessment_type`
// needs no renaming. The rest have no StateAssessmentType member, so there
// is nothing to match yet -- note Colorado's SRT/RT/CST are not Texas's
// TX_SRT/TX_RT/TX_CST.
export const PAROLE_RISK_TOOL = z.enum([
  // Common tools
  "LSIR",
  // US_CO-only tools
  "PIT",
  "CARAS",
  "SRT",
  "RT",
  "CST",
  // US_ID-only tools
  "VRAG",
  "STATIC_99",
  "STABLE",
  "Guideline",
]);
export type ParoleRiskTool = z.infer<typeof PAROLE_RISK_TOOL>;

export const paroleSubcategoryScoreSchema = z.object({
  name: z.string(),
  score: z.number(),
  maxScore: z.number(),
});
export type ParoleSubcategoryScore = z.infer<
  typeof paroleSubcategoryScoreSchema
>;

// CARAS v7 doesn't score subcategories additively out of a max -- each item's
// raw value is multiplied by a fixed logistic-regression coefficient and
// summed into a log-odds, so its subcategories carry a coefficient instead of
// a maxScore. `value * coefficient` is the item's contribution to the overall
// risk score.
export const paroleCarasFactorSchema = z.object({
  name: z.string(),
  value: z.number(),
  coefficient: z.number(),
});
export type ParoleCarasFactor = z.infer<typeof paroleCarasFactorSchema>;

export const paroleRiskAssessmentSchema = z.object({
  tool: PAROLE_RISK_TOOL,
  score: z.number(),
  maxScore: z.number(),
  date: z.string(),
  // Present for LSI/PIT/SRT; absent for CARAS (see paroleCarasFactorSchema).
  subcategories: z.array(paroleSubcategoryScoreSchema).optional(),
  // Present for CARAS only.
  carasFactors: z.array(paroleCarasFactorSchema).optional(),
});
export type ParoleRiskAssessment = z.infer<typeof paroleRiskAssessmentSchema>;

export const PAROLE_RISK_NEED_SCALE = z.enum(["Low", "Moderate", "High"]);
export type ParoleRiskNeedScale = z.infer<typeof PAROLE_RISK_NEED_SCALE>;

export const paroleRiskNeedFactorSchema = z.object({
  factor: z.string(),
  // A display string rather than a number -- most factors show a plain
  // integer, but Mental Health's real eOMIS value is qualifier-suffixed
  // (e.g. "3/M"), so the field has to accommodate that format too.
  score: z.string(),
  // The backend's raw scale label, displayed as-is (not mapped onto
  // PAROLE_RISK_NEED_SCALE) since real labels aren't always one of its
  // three clean values (e.g. "Low to moderate").
  scale: z.string(),
});
export type ParoleRiskNeedFactor = z.infer<typeof paroleRiskNeedFactorSchema>;

export const paroleHearingSchema = z.object({
  // Stable person id, used for the case-profile route and the Firestore
  // lookup. For US_CO this is the OFFENDERID, which is not the number the
  // parole board works with -- show `displayId` instead.
  docId: z.string(),
  // The id shown to the user. For US_CO this is the ADCNUMBER.
  displayId: z.string(),
  individualName: z.string(),
  hearingDate: z.string(),
  hearingType: z.string(),
  facility: z.string(),
});
export type ParoleHearing = z.infer<typeof paroleHearingSchema>;

export const paroleParolePlanDocumentSchema = z.object({
  url: z.string(),
  uploadDate: z.string(),
});

export const paroleParolePlanSchema = z.object({
  onFile: z.boolean(),
  // Absent when there is no parole plan on file.
  lastUpdated: z.string().optional(),
  documents: z.array(paroleParolePlanDocumentSchema),
});
export type ParolePlan = z.infer<typeof paroleParolePlanSchema>;

export const PAROLE_ATTACHMENT_TYPE = z.enum([
  "Victim Impact Letter",
  "Letter of Support",
  "Other",
]);

export const paroleAttachmentSchema = z.object({
  name: z.string(),
  type: PAROLE_ATTACHMENT_TYPE,
  url: z.string(),
  uploadDate: z.string(),
});
export type ParoleAttachment = z.infer<typeof paroleAttachmentSchema>;

export const paroleConductRecordSchema = z.object({
  date: z.string(),
  facility: z.string(),
  violation: z.string(),
  description: z.string(),
  severity: z.string(),
  disposition: z.string(),
});
export type ParoleConductRecord = z.infer<typeof paroleConductRecordSchema>;

export const PAROLE_RECOMMENDED_STATUS = z.enum([
  "YES (Favorable)",
  "Pending",
  "TBD",
  "Withdrawn",
  "NO (Unfavorable)",
]);
export type ParoleRecommendedStatus = z.infer<typeof PAROLE_RECOMMENDED_STATUS>;

export const paroleCommunitySupervisionPlanEntrySchema = z.object({
  typeOfPlan: z.string(),
  name: z.string(),
  relationship: z.string(),
  address: z.string(),
  recommended: PAROLE_RECOMMENDED_STATUS,
});
export type ParoleCommunitySupervisionPlanEntry = z.infer<
  typeof paroleCommunitySupervisionPlanEntrySchema
>;

// Mirrors StateProgramAssignmentParticipationStatus in recidiviz-data, which
// `parole_board_client_profile.programs[].program_status` carries. The
// backend has states this UI has no display for yet (a refusal, a denial,
// an unsuccessful discharge); keeping the values identical avoids a lossy
// mapping.
export const PAROLE_PROGRAM_STATUS = z.enum([
  "DECEASED",
  "DENIED",
  "DISCHARGED_SUCCESSFUL",
  "DISCHARGED_SUCCESSFUL_WITH_DISCRETION",
  "DISCHARGED_UNSUCCESSFUL",
  "DISCHARGED_OTHER",
  "DISCHARGED_UNKNOWN",
  "IN_PROGRESS",
  "PENDING",
  "REFUSED",
  "PRESENT_WITHOUT_INFO",
  "INTERNAL_UNKNOWN",
  "EXTERNAL_UNKNOWN",
]);
export type ParoleProgramStatus = z.infer<typeof PAROLE_PROGRAM_STATUS>;

// Statuses meaning the person finished the program successfully. A
// discharge with an unknown outcome (DISCHARGED_OTHER, DISCHARGED_UNKNOWN)
// is deliberately excluded: it would overstate the record.
export const PAROLE_COMPLETED_PROGRAM_STATUSES: ReadonlySet<ParoleProgramStatus> =
  new Set(["DISCHARGED_SUCCESSFUL", "DISCHARGED_SUCCESSFUL_WITH_DISCRETION"]);

export const paroleDocProgramSchema = z.object({
  name: z.string(),
  completionDate: z.string().nullable(),
  type: z.string(),
  criminogenicNeed: z.string(),
  status: PAROLE_PROGRAM_STATUS,
});
export type ParoleDocProgram = z.infer<typeof paroleDocProgramSchema>;

// Edovo's backend field (`edovo_programs[].edovo_program_status`) is a free
// string with no enum behind it, so there is nothing to match here yet.
export const PAROLE_EDOVO_STATUS = z.enum(["completed", "in-progress"]);
export const PAROLE_EDOVO_RESULT = z.enum(["passed", "needs-improvement"]);

export const paroleEdovoProgramSchema = z.object({
  title: z.string(),
  completionDate: z.string().nullable(),
  status: PAROLE_EDOVO_STATUS,
  result: PAROLE_EDOVO_RESULT.optional(),
  startDate: z.string().optional(),
  durationDays: z.number().optional(),
});
export type ParoleEdovoProgram = z.infer<typeof paroleEdovoProgramSchema>;

export const paroleConvictionSchema = z.object({
  charge: z.string(),
  date: z.string(),
});
export type ParoleConviction = z.infer<typeof paroleConvictionSchema>;

export const paroleOffenseSchema = z.object({
  county: z.string(),
  docket: z.string(),
  conviction: z.string(),
  classFelony: z.string(),
  sentence: z.string(),
  dateOfOffense: z.string(),
  convictionDate: z.string(),
  offenseNarrative: z.string(),
  statute: z.string().optional(),
  sentencingDate: z.string().optional(),
  paroleEligibilityDate: z.string().optional(),
  fullTermDate: z.string().optional(),
  fixedLength: z.string().optional(),
  indeterminateLength: z.string().optional(),
});
export type ParoleOffense = z.infer<typeof paroleOffenseSchema>;

export const paroleOffenseHistorySchema = z.object({
  // A person can be incarcerated on more than one current offense (e.g. one
  // docket entry per count), so this is a list rather than a single record.
  offenses: z.array(paroleOffenseSchema).nonempty(),
  priorConvictions: z.array(paroleConvictionSchema),
  victimInvolved: z.boolean(),
  victimAttendingHearing: z.boolean(),
});
export type ParoleOffenseHistory = z.infer<typeof paroleOffenseHistorySchema>;

export const paroleCaseSchema = z.object({
  // See paroleHearingSchema above for the docId/displayId split.
  docId: z.string(),
  displayId: z.string(),
  name: z.string(),
  dob: z.string(),
  gender: z.string(),
  currentFacility: z.string(),
  custodyLevel: z.string(),
  caseManagerName: z.string(),
  hearingDate: z.string().optional(),
  hearingTime: z.string().optional(),
  hearingType: z.string(),
  reportAuthor: z.string().optional(),
  isParoleReturn: z.boolean().optional(),
  sentenceStartDate: z.string(),
  paroleEligibilityDate: z.string(),
  mandatoryReleaseDate: z.string(),
  parolePlan: paroleParolePlanSchema,
  attachments: z.array(paroleAttachmentSchema),
  conductHistory: z.array(paroleConductRecordSchema),
  communitySupervisionPlan: z.array(paroleCommunitySupervisionPlanEntrySchema),
  disciplinaryFacilityNotes: z.string().optional(),
  stg: z.string().optional(),
  docPrograms: z.array(paroleDocProgramSchema),
  edovoPrograms: z.array(paroleEdovoProgramSchema),
  offenseHistory: paroleOffenseHistorySchema,
  // Full assessment history per tool, not just the most recent one -- the
  // trajectory chart is derived from this at render time (see
  // RiskAssessmentSection.utils.ts) rather than duplicated into a separate
  // chart-shaped field, so there's a single source of truth for risk data.
  // Only the most recent entry per tool is expected to carry `subcategories`/
  // `carasFactors`; earlier entries may be bare score/date pairs.
  riskAssessments: z.array(paroleRiskAssessmentSchema),
  // The resident's latest health/risk-and-needs assessment from eOMIS -- only
  // the most recent snapshot is tracked (no history), unlike riskAssessments.
  riskAndNeedsFactors: z.array(paroleRiskNeedFactorSchema),
});
export type ParoleCase = z.infer<typeof paroleCaseSchema>;
