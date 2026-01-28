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

/**
 * Data Schemas for Notetaker Pipeline
 *
 * Defines all input and output schemas using Zod for runtime validation.
 */

import { z } from "zod";

// ==========================================
// INPUT SCHEMAS
// ==========================================

export const NoteSectionSchema = z.object({
  sectionId: z.string().describe("JSON key or Header title"),
  instruction: z.string().describe("Prompt instructions for this section"),
});

export const NoteStructureSchema = z.object({
  structureName: z.string(),
  combineOutput: z
    .boolean()
    .describe("True = Monolithic Text, False = Structured JSON"),
  sections: z.array(NoteSectionSchema),
});

export const AgencyConfigSchema = z.object({
  agencyName: z.string(),
  glossary: z.record(z.string()),
  operationalRules: z.array(z.string()),
  noteConfig: NoteStructureSchema,
});

export const TranscriptInputSchema = z.object({
  rawText: z.string(),
  recordingDate: z.string().describe("YYYY-MM-DD"),
  durationSeconds: z.number(),
  poNotes: z.string().default("").describe("Officer's raw notes"),
  utterances: z
    .array(
      z.object({
        speaker: z.string().optional(),
        text: z.string().optional(),
      }),
    )
    .optional()
    .describe("Speaker-segmented transcript data for diarization analysis"),
});

// ==========================================
// OUTPUT SCHEMAS
// ==========================================

// Gatekeeper step - validates transcript meets minimum requirements
export const GatekeeperOutputSchema = TranscriptInputSchema;

export const ActionItemSchema = z.object({
  assignee: z.enum(["PO", "Client", "Third Party"]),
  task: z.string(),
  deadline: z.string().nullable().optional().describe("Due date if specified"),
  context: z.string().optional().describe("Context/Reasoning for the task"),
});

export const CriticalUpdateSchema = z.object({
  category: z.enum([
    "Housing",
    "Employment",
    "Legal",
    "Substance",
    "Family",
    "Health",
    "Other",
  ]),
  updateType: z.enum(["New", "Change", "Stable/Status Quo"]),
  details: z.string(),
  evidence: z.string().nullable().optional(),
});

// Define the base schema first to avoid circular type issues
export const MinuteItemSchema: z.ZodSchema = z.lazy(() =>
  z.object({
    timestamp: z.string().optional().describe("[MM:SS] format"),
    content: z.string(),
    status: z.enum(["Discussed", "Completed", "Assigned"]).default("Discussed"),
    subItems: z.array(MinuteItemSchema).default([]),
  }),
);

export const MinuteSectionSchema = z.object({
  title: z.string().default("General"),
  items: z.array(MinuteItemSchema).default([]),
});

// Drafting step - writer agent output
export const DraftingOutputSchema = z.object({
  caseNote: z
    .string()
    .describe(
      "Official case note in professional third-person style with CAPS LABELS for sections",
    ),
  minutes: z
    .array(MinuteSectionSchema)
    .describe("Structured meeting minutes with timestamps and nested items"),
});

export const PipelineOutputSchema = z.object({
  caseNote: z.string(),
  meetingMinutes: z.array(MinuteSectionSchema).optional(),
  actionItems: z.array(ActionItemSchema),
  statusUpdates: z.array(CriticalUpdateSchema),
});

// ==========================================
// INTERMEDIATE SCHEMAS
// ==========================================

export const EntityItemSchema = z.object({
  value: z.string(),
  entityKind: z.string(),
});

// Extraction step - extraction agent output
export const ExtractionOutputSchema = z.object({
  actionItems: z.array(ActionItemSchema),
  criticalUpdates: z.array(CriticalUpdateSchema),
  entities: z.array(EntityItemSchema),
});

export const VerificationEntrySchema = z.object({
  claimId: z.string(),
  // All verifications must contain at least one quote
  evidenceQuotes: z.array(z.string()).min(1),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW", "NONE"]),
  ambiguity: z.enum(["HIGH", "MEDIUM", "LOW", "NONE"]),
});

export const VerificationPayloadSchema = z.object({
  verifications: z.array(VerificationEntrySchema),
});

// Verification step - verification agent output (enhanced extraction)
export const VerificationOutputSchema = ExtractionOutputSchema;

// Assembly step - final pipeline output
export const AssemblyOutputSchema = PipelineOutputSchema;

// ==========================================
// TYPE EXPORTS
// ==========================================

export type AgencyConfig = z.infer<typeof AgencyConfigSchema>;
export type NoteStructure = z.infer<typeof NoteStructureSchema>;
export type NoteSection = z.infer<typeof NoteSectionSchema>;
export type TranscriptInput = z.infer<typeof TranscriptInputSchema>;
export type ActionItem = z.infer<typeof ActionItemSchema>;
export type CriticalUpdate = z.infer<typeof CriticalUpdateSchema>;
export type MinuteItem = z.infer<typeof MinuteItemSchema>;
export type MinuteSection = z.infer<typeof MinuteSectionSchema>;
export type PipelineOutput = z.infer<typeof PipelineOutputSchema>;
export type EntityItem = z.infer<typeof EntityItemSchema>;
export type VerificationEntry = z.infer<typeof VerificationEntrySchema>;
export type VerificationPayload = z.infer<typeof VerificationPayloadSchema>;

// Pipeline step output types
export type GatekeeperOutput = z.infer<typeof GatekeeperOutputSchema>;
export type ExtractionOutput = z.infer<typeof ExtractionOutputSchema>;
export type DraftingOutput = z.infer<typeof DraftingOutputSchema>;
export type VerificationOutput = z.infer<typeof VerificationOutputSchema>;
export type AssemblyOutput = z.infer<typeof AssemblyOutputSchema>;
