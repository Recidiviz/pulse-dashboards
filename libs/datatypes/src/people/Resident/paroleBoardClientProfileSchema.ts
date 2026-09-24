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

import { nullishAsUndefined } from "../../utils/zod";

// Mirrors recidiviz-data's parole_board_client_profile_schema.py: one shared
// contract multiple states select into, one sub-object per profile category
// (demographics, active_sentence, etc.). Deliberately partial -- the backend
// contract has ~30 fields, most still unhydrated for every state. Zod strips
// unrecognized keys by default, so it's safe to type only the fields
// something reads; add more as recidiviz-data hydrates
// PAROLE_BOARD_CLIENT_PROFILE_SCHEMA further.
// One entry per parole board meeting, past and upcoming. `hearingStatus` is
// PREVIOUS or SCHEDULED; a SCHEDULED entry has no decision yet.
export const paroleBoardClientProfileHearingSchema = z.object({
  hearingStatus: nullishAsUndefined(z.string()),
  hearingDate: nullishAsUndefined(z.string()),
  hearingType: nullishAsUndefined(z.string()),
  hearingSubtype: nullishAsUndefined(z.string()),
  hearingDecision: nullishAsUndefined(z.string()),
});
export type ParoleBoardClientProfileHearing = z.infer<
  typeof paroleBoardClientProfileHearingSchema
>;

// One entry per sentence the resident is currently serving (see
// recidiviz-data's `active_sentences` category, made REPEATED in
// recidiviz-data#102573 and #102582). `sentenceLength` is already a
// human-readable string from the backend.
export const paroleBoardClientProfileSentenceSchema = z.object({
  sentenceConvictionCounty: nullishAsUndefined(z.string()),
  sentenceDocket: nullishAsUndefined(z.string()),
  sentenceFelonyClass: nullishAsUndefined(z.string()),
  sentenceChargeName: nullishAsUndefined(z.string()),
  sentenceStatute: nullishAsUndefined(z.string()),
  sentenceOffenseDate: nullishAsUndefined(z.string()),
  sentenceConvictionDate: nullishAsUndefined(z.string()),
  sentenceStartDate: nullishAsUndefined(z.string()),
  sentenceLength: nullishAsUndefined(z.string()),
  sentenceParoleEligibilityDate: nullishAsUndefined(z.string()),
  sentenceMandatoryReleaseDate: nullishAsUndefined(z.string()),
  sentenceFullTermReleaseDate: nullishAsUndefined(z.string()),
  sentenceIsLife: nullishAsUndefined(z.boolean()),
  sentenceIndeterminateStartDate: nullishAsUndefined(z.string()),
  sentenceIndeterminateEndDateInclusive: nullishAsUndefined(z.string()),
});
export type ParoleBoardClientProfileSentence = z.infer<
  typeof paroleBoardClientProfileSentenceSchema
>;

// One entry per prior criminal history record.
export const paroleBoardClientProfileCriminalHistorySchema = z.object({
  historyCharge: nullishAsUndefined(z.string()),
  historyDate: nullishAsUndefined(z.string()),
});
export type ParoleBoardClientProfileCriminalHistory = z.infer<
  typeof paroleBoardClientProfileCriminalHistorySchema
>;

// One entry per risk/needs assessment on record. `assessmentType` is a raw
// backend label (e.g. US_CO's "RT Scoring Tool") that doesn't necessarily
// match PAROLE_RISK_TOOL's values -- the frontend translates it, dropping
// an assessment it can't confidently map to a known tool rather than
// mislabeling it. `assessmentCategory*` describe one subcategory of the
// assessment named by `assessmentDate`+`assessmentType`; every category row
// for the same assessment shares those two fields.
export const paroleBoardClientProfileRiskAssessmentSchema = z.object({
  assessmentDate: nullishAsUndefined(z.string()),
  assessmentType: nullishAsUndefined(z.string()),
  assessmentScore: nullishAsUndefined(z.number()),
  assessmentMaxScore: nullishAsUndefined(z.number()),
  assessmentCategoryName: nullishAsUndefined(z.string()),
  assessmentCategoryScore: nullishAsUndefined(z.number()),
  assessmentCategoryMaxScore: nullishAsUndefined(z.number()),
});
export type ParoleBoardClientProfileRiskAssessment = z.infer<
  typeof paroleBoardClientProfileRiskAssessmentSchema
>;

// The resident's latest health/risk-and-needs classification per domain (see
// recidiviz-data's LATEST_RISK_NEED_SUMMARY category), as a [score, scale]
// pair. A domain still on the old single-string format (migration is
// rolling out per domain/state) is treated as absent rather than failing
// the whole resident record's parse.
const riskNeedSummaryPair = z
  .union([z.tuple([z.string(), z.string()]), z.string()])
  .nullish()
  .transform((value) => (Array.isArray(value) ? value : undefined));

export const paroleBoardClientProfileLatestRiskNeedSummarySchema = z.object({
  assessmentLatestMedical: riskNeedSummaryPair,
  assessmentLatestDental: riskNeedSummaryPair,
  assessmentLatestMentalHealth: riskNeedSummaryPair,
  assessmentLatestId: riskNeedSummaryPair,
  assessmentLatestSexOffender: riskNeedSummaryPair,
  assessmentLatestSar: riskNeedSummaryPair,
  assessmentLatestSoar: riskNeedSummaryPair,
});
export type ParoleBoardClientProfileLatestRiskNeedSummary = z.infer<
  typeof paroleBoardClientProfileLatestRiskNeedSummarySchema
>;

// One entry per institutional conduct violation.
export const paroleBoardClientProfileViolationSchema = z.object({
  violationCategory: nullishAsUndefined(z.string()),
  violationDate: nullishAsUndefined(z.string()),
  violationType: nullishAsUndefined(z.string()),
  violationDescription: nullishAsUndefined(z.string()),
  violationSanction: nullishAsUndefined(z.string()),
  violationFacility: nullishAsUndefined(z.string()),
});
export type ParoleBoardClientProfileViolation = z.infer<
  typeof paroleBoardClientProfileViolationSchema
>;

// One entry per DOC program the resident has participated in. `programStatus`
// is a raw backend label, not necessarily one of PAROLE_PROGRAM_STATUS's
// values -- US_ID's already matches (it's the normalized
// StateProgramAssignmentParticipationStatus enum), but US_CO's is its own
// free-form program-tracking status (e.g. "Transferred to another
// Facility"), so the frontend translates it per state.
export const paroleBoardClientProfileProgramSchema = z.object({
  programName: nullishAsUndefined(z.string()),
  programStatus: nullishAsUndefined(z.string()),
  programCategory: nullishAsUndefined(z.string()),
  programNeed: nullishAsUndefined(z.string()),
  programCompletionDate: nullishAsUndefined(z.string()),
});
export type ParoleBoardClientProfileProgram = z.infer<
  typeof paroleBoardClientProfileProgramSchema
>;

// One entry per Edovo tablet program. `edovoProgramStatus`/`edovoProgramResult`
// are raw backend labels the frontend translates, same reasoning as
// `programStatus` above.
export const paroleBoardClientProfileEdovoProgramSchema = z.object({
  edovoProgramStatus: nullishAsUndefined(z.string()),
  edovoProgramName: nullishAsUndefined(z.string()),
  edovoProgramResult: nullishAsUndefined(z.string()),
  edovoProgramStartDate: nullishAsUndefined(z.string()),
  edovoProgramCompletionDate: nullishAsUndefined(z.string()),
  edovoProgramDuration: nullishAsUndefined(z.number()),
});
export type ParoleBoardClientProfileEdovoProgram = z.infer<
  typeof paroleBoardClientProfileEdovoProgramSchema
>;

// The resident's single proposed release plan (not a list -- one plan per
// resident, see ParoleAPIClient for how it becomes both `ParolePlan` and an
// at-most-one-entry `communitySupervisionPlan`).
export const paroleBoardClientProfileParolePlanSchema = z.object({
  parolePlanIsOnFile: nullishAsUndefined(z.boolean()),
  parolePlanLastUpdatedDate: nullishAsUndefined(z.string()),
  parolePlanUrl: nullishAsUndefined(z.string()),
  parolePlanDate: nullishAsUndefined(z.string()),
  parolePlanSponsorName: nullishAsUndefined(z.string()),
  parolePlanSponsorRelationship: nullishAsUndefined(z.string()),
  parolePlanAddress: nullishAsUndefined(z.string()),
  parolePlanRecommended: nullishAsUndefined(z.string()),
});
export type ParoleBoardClientProfileParolePlan = z.infer<
  typeof paroleBoardClientProfileParolePlanSchema
>;

// One entry per document attached to the resident's profile. `attachmentType`
// is a raw backend label (e.g. "VICTIM_STATEMENT", "PSI") the frontend
// translates to PAROLE_ATTACHMENT_TYPE's narrower set, falling back to
// "Other" for a type with no closer match.
export const paroleBoardClientProfileAttachmentSchema = z.object({
  attachmentName: nullishAsUndefined(z.string()),
  attachmentType: nullishAsUndefined(z.string()),
  attachmentUrl: nullishAsUndefined(z.string()),
  attachmentUploadDate: nullishAsUndefined(z.string()),
});
export type ParoleBoardClientProfileAttachment = z.infer<
  typeof paroleBoardClientProfileAttachmentSchema
>;

export const paroleBoardClientProfileSchema = z.object({
  demographics: z.object({
    residentDob: nullishAsUndefined(z.string()),
    caseManager: nullishAsUndefined(z.string()),
  }),
  // Optional: an unhydrated state emits an empty array, and the whole
  // struct is absent until the backend view is materialized.
  paroleHearings: z
    .array(paroleBoardClientProfileHearingSchema)
    .optional()
    .default([]),
  // Optional for the same reason as paroleHearings above. A state with no
  // per-sentence data yet (or a resident with none) emits an empty array.
  activeSentences: z
    .array(paroleBoardClientProfileSentenceSchema)
    .optional()
    .default([]),
  criminalHistory: z
    .array(paroleBoardClientProfileCriminalHistorySchema)
    .optional()
    .default([]),
  riskAssessments: z
    .array(paroleBoardClientProfileRiskAssessmentSchema)
    .optional()
    .default([]),
  // Optional rather than defaulted -- a struct has no natural empty value.
  latestRiskNeedSummary:
    paroleBoardClientProfileLatestRiskNeedSummarySchema.optional(),
  violations: z
    .array(paroleBoardClientProfileViolationSchema)
    .optional()
    .default([]),
  programs: z
    .array(paroleBoardClientProfileProgramSchema)
    .optional()
    .default([]),
  edovoPrograms: z
    .array(paroleBoardClientProfileEdovoProgramSchema)
    .optional()
    .default([]),
  attachments: z
    .array(paroleBoardClientProfileAttachmentSchema)
    .optional()
    .default([]),
  // Optional (rather than defaulted): every field on it is itself optional,
  // and "no plan on file" is a real, common state -- not the same as the
  // whole category being unhydrated -- so ParoleAPIClient distinguishes
  // "absent" from "present but empty" itself rather than this schema
  // collapsing the two.
  parolePlan: paroleBoardClientProfileParolePlanSchema.optional(),
});
