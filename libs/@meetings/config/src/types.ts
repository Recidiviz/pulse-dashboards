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

export const OutputSpecSchema = z.object({
  id: z.string().describe("Unique identifier for this output section"),
  label: z.string().describe("Human-readable label"),
  promptGuidance: z
    .string()
    .describe("LLM instructions for producing this output section"),
});

/**
 * Schema for a raw agency YAML file.
 *
 * Use plain fields (`glossary`, `keywords`, etc.) to fully replace the base.
 * Use `additional*` variants to extend the base instead — the loader merges
 * them on top before validation.
 */
export const AgencyConfigFileSchema = z.object({
  // ── Metadata ──────────────────────────────────────────────
  name: z.string(),
  stateCode: z.string(),
  version: z.number().int().positive().default(1),

  // ── Infrastructure ────────────────────────────────────────
  showTranscriptions: z.boolean().optional(),
  audioTTLDays: z.number().int().min(7).nullable().optional(),
  transcriptTTLDays: z.number().int().min(7).nullable().optional(),
  /** Replaces base keywords entirely */
  keywords: z.array(z.string()).optional(),
  /** Appended to base keywords */
  additionalKeywords: z.array(z.string()).optional(),

  // ── LLM ───────────────────────────────────────────────────
  /** Replaces base glossary entirely */
  glossary: z.record(z.string()).optional(),
  /** Merged on top of base glossary */
  additionalGlossary: z.record(z.string()).optional(),
  /** Replaces base rules entirely */
  rules: z.array(z.string()).optional(),
  /** Appended to base rules */
  additionalRules: z.array(z.string()).optional(),
  /** Replaces base outputs entirely */
  outputs: z.array(OutputSpecSchema).optional(),
  /** Appended to base outputs */
  additionalOutputs: z.array(OutputSpecSchema).optional(),
});

/**
 * The result of merging the base config with an agency YAML
 */
export const AgencyConfigSchema = z.object({
  // ── Metadata ──────────────────────────────────────────────
  name: z.string(),
  stateCode: z.string(),
  version: z.number().int().positive().default(1),
  baseVersion: z.number().int().positive().default(1),

  // ── Infrastructure ────────────────────────────────────────
  showTranscriptions: z.boolean().default(true),
  audioTTLDays: z.number().int().min(7).default(30).nullable(),
  transcriptTTLDays: z.number().int().min(7).default(30).nullable(),
  keywords: z.array(z.string()).default([]),

  // ── LLM ───────────────────────────────────────────────────
  glossary: z.record(z.string()).default({}),
  rules: z.array(z.string()).default([]),
  outputs: z.array(OutputSpecSchema).default([]),
});

export type AgencyConfigFile = z.infer<typeof AgencyConfigFileSchema>;
export type AgencyConfig = z.infer<typeof AgencyConfigSchema>;
export type OutputSpec = z.infer<typeof OutputSpecSchema>;
