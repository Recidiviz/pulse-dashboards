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

export const paroleCaseSchema = z.object({
  docId: z.string(),
  name: z.string(),
  dob: z.string(),
  currentFacility: z.string(),
  custodyLevel: z.string(),
  caseManagerName: z.string(),
  // Absent when this individual has no hearing currently scheduled.
  hearingDate: z.string().optional(),
  hearingTime: z.string().optional(),
  sentenceStartDate: z.string(),
  paroleEligibilityDate: z.string(),
  mandatoryReleaseDate: z.string(),
  parolePlan: paroleParolePlanSchema,
  attachments: z.array(paroleAttachmentSchema),
});
export type ParoleCase = z.infer<typeof paroleCaseSchema>;
