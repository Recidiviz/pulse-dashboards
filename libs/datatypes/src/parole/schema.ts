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

export const PAROLE_RISK_TOOL = z.enum([
  "LSI",
  "PIT",
  "CARAS",
  "SRT",
  "RT",
  "CST",
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

export const paroleHearingSchema = z.object({
  docId: z.string(),
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
export const PAROLE_PROGRAM_STATUS = z.enum([
  "completed",
  "in-progress",
  "recommended",
]);

export const paroleDocProgramSchema = z.object({
  name: z.string(),
  completionDate: z.string().nullable(),
  type: z.string(),
  criminogenicNeed: z.string(),
  status: PAROLE_PROGRAM_STATUS,
});
export type ParoleDocProgram = z.infer<typeof paroleDocProgramSchema>;

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
});
export type ParoleOffense = z.infer<typeof paroleOffenseSchema>;

export const paroleOffenseHistorySchema = z.object({
  // A person can be incarcerated on more than one current offense (e.g. one
  // docket entry per count), so this is a list rather than a single record.
  offenses: z.array(paroleOffenseSchema).nonempty(),
  priorConvictions: z.array(paroleConvictionSchema),
  victimInvolved: z.boolean(),
});
export type ParoleOffenseHistory = z.infer<typeof paroleOffenseHistorySchema>;

export const paroleCaseSchema = z.object({
  docId: z.string(),
  name: z.string(),
  dob: z.string(),
  gender: z.string(),
  currentFacility: z.string(),
  custodyLevel: z.string(),
  caseManagerName: z.string(),
  hearingDate: z.string().optional(),
  hearingTime: z.string().optional(),
  isParoleReturn: z.boolean().optional(),
  sentenceStartDate: z.string(),
  paroleEligibilityDate: z.string(),
  mandatoryReleaseDate: z.string(),
  parolePlan: paroleParolePlanSchema,
  attachments: z.array(paroleAttachmentSchema),
  conductHistory: z.array(paroleConductRecordSchema),
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
});
export type ParoleCase = z.infer<typeof paroleCaseSchema>;
