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

import { Timestamp } from "firebase/firestore";
import { z } from "zod";

/**
 * A timestamp on a report document: a Firestore Timestamp, or a Date in tests
 * and offline fixtures. Read report documents with serverTimestamps:
 * "estimate", so a serverTimestamp() write that is still pending also arrives
 * as a Timestamp rather than null.
 */
const firestoreTimestampSchema = z.union([z.instanceof(Timestamp), z.date()]);

// The Firestore rules for paroleBoardReports compare status against these
// exact values.
export const PAROLE_BOARD_REPORT_STATUS = z.enum([
  "IN_PROGRESS",
  "SUBMITTED",
  "ARCHIVED",
]);
export type ParoleBoardReportStatus = z.infer<
  typeof PAROLE_BOARD_REPORT_STATUS
>;

/**
 * A value a Pre-Hearing Investigator (PHI) entered, either in a field Atlas
 * does not have or as a correction of an Atlas value. A null value means the
 * PHI cleared the field. A field with no entry at all shows its Atlas value.
 *
 * @param valueSchema - The schema for the value the PHI entered.
 */
export function phiValueSchema<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    value: valueSchema.nullable(),
    updatedBy: z.string(),
    updatedAt: firestoreTimestampSchema,
  });
}

/**
 * The PHI's input for one row of a section, such as one instant offense.
 * Writers set source on the row's first edit, along with atlasLabel for a row
 * that came from Atlas.
 *
 * @param fields - The row's editable fields, each a phiValueSchema marked
 *   optional.
 */
export function reportRowEntrySchema<Fields extends z.ZodRawShape>(
  fields: Fields,
) {
  return z.object({
    // ATLAS for a row keyed by its Atlas id, PHI for a row the PHI added.
    source: z.enum(["ATLAS", "PHI"]),
    // A label copied from Atlas, so the row can still be named after it drops
    // out of Atlas.
    atlasLabel: z.string().optional(),
    // Set when the PHI removes an Atlas row. Undo deletes it.
    removed: z
      .object({ by: z.string(), at: firestoreTimestampSchema })
      .optional(),
    fields: z.object(fields).optional(),
  });
}

/**
 * The PHI's input for one section of the report: fields that belong to the
 * section as a whole, and rows keyed by their Atlas id, or by a generated id
 * for a row the PHI added.
 *
 * @param fields - The section-level fields, each a phiValueSchema marked
 *   optional.
 * @param rowFields - The fields on each row, each a phiValueSchema marked
 *   optional.
 */
export function reportSectionInputSchema<
  Fields extends z.ZodRawShape,
  RowFields extends z.ZodRawShape,
>(fields: Fields, rowFields: RowFields) {
  return z.object({
    fields: z.object(fields).optional(),
    rows: z.record(z.string(), reportRowEntrySchema(rowFields)).optional(),
  });
}

// Psychological Evaluation has a single option for now; product will add more.
export const PAROLE_REPORT_PSYCHOLOGICAL_EVALUATION = z.enum(["NONE"]);
export type ParoleReportPsychologicalEvaluation = z.infer<
  typeof PAROLE_REPORT_PSYCHOLOGICAL_EVALUATION
>;

export const PAROLE_REPORT_VICTIM = z.enum(["YES", "NO"]);
export type ParoleReportVictim = z.infer<typeof PAROLE_REPORT_VICTIM>;

/**
 * Offense Information: the Case Details fields, and one row per instant
 * offense keyed by the original Atlas SentenceId of its sentence
 * (originalSentenceExternalId), which stays the same when Atlas corrects the
 * sentence.
 */
export const offenseInformationInputSchema = reportSectionInputSchema(
  {
    psychologicalEvaluation: phiValueSchema(
      PAROLE_REPORT_PSYCHOLOGICAL_EVALUATION,
    ).optional(),
    victim: phiValueSchema(PAROLE_REPORT_VICTIM).optional(),
  },
  {
    sentencingDate: phiValueSchema(z.string().date()).optional(),
  },
);
export type OffenseInformationInput = z.infer<
  typeof offenseInformationInputSchema
>;

// A month and year, such as "2015-03", for a field where the PHI picks a month
// rather than a day.
const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected a month as YYYY-MM");

/**
 * Past Actions: events in the resident's history that the PHI enters, one row
 * per event. Atlas has no source for them, so every row is one the PHI added.
 */
export const pastActionsInputSchema = reportSectionInputSchema(
  {},
  {
    date: phiValueSchema(monthSchema).optional(),
    // The input limits notes to 250 characters. The schema doesn't, because a
    // note that failed validation would make the whole report fail to parse.
    notes: phiValueSchema(z.string()).optional(),
  },
);
export type PastActionsInput = z.infer<typeof pastActionsInputSchema>;

/**
 * Personal History: the PHI's notes on the resident's background, one box for
 * each part of it, and the resident's substance use, one row per substance.
 * The PHI writes every box and adds every row, because Atlas has no current
 * source for any of them.
 */
export const personalHistoryInputSchema = reportSectionInputSchema(
  {
    // The inputs limit each box to between 500 and 2,500 characters. The
    // schema doesn't, for the same reason as Past Actions' notes.
    socialHistory: phiValueSchema(z.string()).optional(),
    relationships: phiValueSchema(z.string()).optional(),
    education: phiValueSchema(z.string()).optional(),
    occupation: phiValueSchema(z.string()).optional(),
    military: phiValueSchema(z.string()).optional(),
    // The resident's comments, which follow the substance use rows.
    residentComments: phiValueSchema(z.string()).optional(),
  },
  {
    substance: phiValueSchema(z.string()).optional(),
    // The input offers ages 1 to 100. The schema takes any whole number, so
    // an age outside that range can't make the report fail to parse.
    ageOfFirstUse: phiValueSchema(z.number().int()).optional(),
    lastUse: phiValueSchema(monthSchema).optional(),
    heaviestUse: phiValueSchema(z.string()).optional(),
  },
);
export type PersonalHistoryInput = z.infer<typeof personalHistoryInputSchema>;

/**
 * Community Reentry Plan: the PHI's notes on the resident's plan for release,
 * one box for each part of the plan. The PHI writes all five, and the section
 * has no rows.
 */
export const communityReentryPlanInputSchema = reportSectionInputSchema(
  {
    // The inputs limit each box to 1,000 or 1,500 characters. The schema
    // doesn't, for the same reason as Past Actions' notes.
    housing: phiValueSchema(z.string()).optional(),
    employment: phiValueSchema(z.string()).optional(),
    aftercare: phiValueSchema(z.string()).optional(),
    transportation: phiValueSchema(z.string()).optional(),
    supportNetwork: phiValueSchema(z.string()).optional(),
  },
  {},
);
export type CommunityReentryPlanInput = z.infer<
  typeof communityReentryPlanInputSchema
>;

// The PHI's answer under the Summary's statement that the Idaho Code 20-1007
// 4th Amendment Waiver was read and reviewed during the interview.
export const PAROLE_REPORT_FOURTH_AMENDMENT_WAIVER = z.enum([
  "YES",
  "INTERVIEW_NOT_CONDUCTED",
]);
export type ParoleReportFourthAmendmentWaiver = z.infer<
  typeof PAROLE_REPORT_FOURTH_AMENDMENT_WAIVER
>;

/**
 * Summary: the PHI's summary of the case and their answer about the 4th
 * Amendment Waiver. The PHI writes both, and the section has no rows.
 */
export const summaryInputSchema = reportSectionInputSchema(
  {
    // The input limits the summary to 10,000 characters. The schema doesn't,
    // for the same reason as Past Actions' notes.
    summary: phiValueSchema(z.string()).optional(),
    fourthAmendmentWaiver: phiValueSchema(
      PAROLE_REPORT_FOURTH_AMENDMENT_WAIVER,
    ).optional(),
  },
  {},
);
export type SummaryInput = z.infer<typeof summaryInputSchema>;

/**
 * One PHI report, at paroleBoardReports/{recordId}/reports/{reportId}. It
 * holds only what the PHI entered; Atlas data stays in the resident's
 * paroleBoardClientProfiles document, and the app combines the two to render
 * the report.
 *
 * For example, a report where the PHI set Victim and corrected one offense's
 * sentencing date has these sections (other fields abridged):
 *
 *   sections: {
 *     offenseInformation: {
 *       fields: { victim: { value: "YES", updatedBy: "phi@...", ... } },
 *       rows: {
 *         "1001": {
 *           source: "ATLAS",
 *           atlasLabel: "Robbery §18-6501, Case # CR25-08-1142",
 *           fields: { sentencingDate: { value: "2025-08-15", ... } },
 *         },
 *       },
 *     },
 *   }
 *
 * Every section key is optional, so a report written before a section existed
 * still parses. Zod drops keys it doesn't know, so update a report one field
 * at a time rather than writing a parsed report back whole.
 */
export const paroleBoardReportSchema = z.object({
  stateCode: z.string(),
  pseudonymizedId: z.string(),
  // The hearing the report is for. The app keeps it in step with the docket
  // while the report is in progress, and it is frozen at submission.
  hearing: z.object({
    // Atlas BOPHearingId, once Atlas has scheduled the hearing.
    atlasHearingId: z.string().optional(),
    hearingDate: z.string().date(),
    hearingType: z.string().optional(),
  }),
  status: PAROLE_BOARD_REPORT_STATUS,
  createdBy: z.string(),
  createdAt: firestoreTimestampSchema,
  updatedBy: z.string(),
  updatedAt: firestoreTimestampSchema,
  submittedBy: z.string().optional(),
  submittedAt: firestoreTimestampSchema.optional(),
  // From the review page's Signature card. Signing submits the report.
  signature: z
    .object({
      name: z.string(),
      title: z.string(),
      signedBy: z.string(),
      signedAt: firestoreTimestampSchema,
    })
    .optional(),
  sections: z
    .object({
      offenseInformation: offenseInformationInputSchema.optional(),
      pastActions: pastActionsInputSchema.optional(),
      personalHistory: personalHistoryInputSchema.optional(),
      communityReentryPlan: communityReentryPlanInputSchema.optional(),
      summary: summaryInputSchema.optional(),
    })
    .default({}),
});
export type ParoleBoardReport = z.infer<typeof paroleBoardReportSchema>;
export type ParoleBoardReportSectionKey = keyof ParoleBoardReport["sections"];

/**
 * The resident's parent document at paroleBoardReports/{recordId}, which
 * points at their reports. Only PHIs and Recidiviz users can read it, because
 * it shows whether a report is in progress.
 */
export const paroleBoardReportsForResidentSchema = z.object({
  stateCode: z.string(),
  // The report in progress, if any. Creating a report sets it in a
  // transaction that fails unless it is null, so a resident has at most one.
  activeReportId: z.string().nullable(),
  // What the PHI Report Dashboard's Status column shows.
  latestReport: z
    .object({
      reportId: z.string(),
      status: PAROLE_BOARD_REPORT_STATUS,
      hearingDate: z.string().date(),
    })
    .nullable(),
});
export type ParoleBoardReportsForResident = z.infer<
  typeof paroleBoardReportsForResidentSchema
>;
