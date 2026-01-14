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
 * Pipeline Guards - Functional Validation System
 *
 * Defines guards for each pipeline step with composable validators.
 * Guards validate step outputs using their associated Zod schemas.
 */

import { z } from "zod";

import {
  DraftingOutput,
  ExtractionOutput,
  MinuteItem,
  TranscriptInput,
} from "~@meetings/tasks/llm/schemas";

// ==========================================
// CORE TYPES
// ==========================================

/**
 * Result of a validation check
 */
export interface ValidationResult {
  valid: boolean;
  errorKind?: string;
  message?: string;
}

/**
 * A validator is a pure function that performs a specific validation check
 */
export type Validator<T> = (data: T, context?: unknown) => ValidationResult;

/**
 * A guard validates data against a schema and runs additional validators
 */
export type Guard<T> = (
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  data: unknown,
  context?: unknown,
) => ValidationResult;

// ==========================================
// GUARD FACTORY
// ==========================================

/**
 * Creates a guard function that validates against a schema and runs additional validators
 */
export function createGuard<T>(validators: Validator<T>[] = []): Guard<T> {
  return (
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
    data: unknown,
    context?: unknown,
  ): ValidationResult => {
    // First, validate against the Zod schema
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
      return {
        valid: false,
        errorKind: "Schema",
        message: `Schema validation failed: ${parseResult.error.message}`,
      };
    }

    // Then run each additional validator
    const validData = parseResult.data;
    for (const validator of validators) {
      const result = validator(validData, context);
      if (!result.valid) {
        return result;
      }
    }

    return { valid: true };
  };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Counts words in text by splitting on whitespace
 */
function countWords(text: string): number {
  return text.split(/\s+/).length;
}

/**
 * Checks if text contains any injection patterns
 */
function hasInjectionPattern(text: string): RegExp | null {
  const INJECTION_PATTERNS = [
    /(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior)\s+(?:instructions|prompts|rules)/i,
    /system\s+override/i,
    /you\s+are\s+now\s+(?:unrestricted|jailbroken)/i,
    /delete\s+this\s+log/i,
    /act\s+as\s+an\s+evil/i,
  ];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return pattern;
    }
  }
  return null;
}

// ==========================================
// VALIDATORS
// ==========================================

/**
 * Validates that transcript has minimum word count
 */
export const validateWordCount: Validator<TranscriptInput> = (data) => {
  const wordCount = countWords(data.rawText);
  const minWords = 50;

  if (wordCount < minWords) {
    return {
      valid: false,
      errorKind: "Length",
      message: `Transcript too short: ${wordCount} words (minimum ${minWords})`,
    };
  }

  return { valid: true };
};

/**
 * Checks for template leaks in text
 */
const LEAK_PATTERNS = [/\[INSERT DATE\]/, /\{.*\}/];

export const validateNoTemplateLeaks: Validator<{ content: string }> = (
  data,
) => {
  const text = data.content;
  for (const pattern of LEAK_PATTERNS) {
    if (pattern.test(text)) {
      return {
        valid: false,
        errorKind: "Format",
        message: `Template artifact detected: ${pattern.source}`,
      };
    }
  }
  return { valid: true };
};

/**
 * Checks for robotic AI tone
 */
const ROBOT_PATTERNS = [
  /as an ai/i,
  /i cannot/i,
  /i apologize/i,
  /based on the transcript/i,
];

export const validateNoRoboticTone: Validator<{
  content?: string;
  rawText?: string;
}> = (data) => {
  const text = data.content ?? data.rawText;

  if (!text) {
    return {
      valid: false,
      errorKind: "Format",
      message: "No text content found (expected 'content' or 'rawText' field)",
    };
  }

  for (const pattern of ROBOT_PATTERNS) {
    if (pattern.test(text)) {
      return {
        valid: false,
        errorKind: "Tone",
        message: "AI refusal/apology detected",
      };
    }
  }
  return { valid: true };
};

/**
 * Validates case note has minimum length
 */
export const validateCaseNoteLength: Validator<DraftingOutput> = (data) => {
  const totalWords = countWords(data.caseNote);
  const minWords = 150;

  if (totalWords < minWords) {
    return {
      valid: false,
      errorKind: "Length",
      message: `Note too short: ${totalWords} words (minimum ${minWords})`,
    };
  }

  return { valid: true };
};

/**
 * Validates case note content quality (no template leaks or robotic tone)
 */
export const validateCaseNoteQuality: Validator<DraftingOutput> = (data) => {
  const leakCheck = validateNoTemplateLeaks({ content: data.caseNote });
  if (!leakCheck.valid) return leakCheck;

  const toneCheck = validateNoRoboticTone({ content: data.caseNote });
  if (!toneCheck.valid) return toneCheck;

  return { valid: true };
};

/**
 * Recursively counts all items including nested sub_items
 */
function countSubItems(item: MinuteItem): number {
  let count = 0;
  if (item.sub_items && item.sub_items.length > 0) {
    for (const subItem of item.sub_items) {
      count += 1 + countSubItems(subItem);
    }
  }
  return count;
}

/**
 * Validates minutes have minimum detail
 */
export const validateMinutesDetail: Validator<DraftingOutput> = (data) => {
  const minutes = data.minutes;

  if (!minutes || minutes.length === 0) {
    return {
      valid: false,
      errorKind: "Length",
      message: "No meeting sections found",
    };
  }

  // Count total items
  let totalItems = 0;
  for (const section of minutes) {
    totalItems += section.items.length;

    // Count nested items
    for (const item of section.items) {
      totalItems += countSubItems(item);
    }
  }

  const minItems = 3;
  if (totalItems < minItems) {
    return {
      valid: false,
      errorKind: "Length",
      message: `Insufficient detail: ${totalItems} items (minimum ${minItems})`,
    };
  }

  return { valid: true };
};

/**
 * Validates minutes content quality (checks each item)
 */
export const validateMinutesQuality: Validator<DraftingOutput> = (data) => {
  const minutes = data.minutes;

  for (const section of minutes) {
    for (const item of section.items) {
      const leakCheck = validateNoTemplateLeaks({ content: item.content });
      if (!leakCheck.valid) return leakCheck;

      const toneCheck = validateNoRoboticTone({ content: item.content });
      if (!toneCheck.valid) return toneCheck;
    }
  }

  return { valid: true };
};

/**
 * Logs a warning if extraction found no action items (non-blocking)
 */
export const validateExtractionPresence: Validator<ExtractionOutput> = () => {
  // This is a warning-only validator, always returns valid
  // The actual warning is logged in the orchestrator
  return { valid: true };
};

// ==========================================
// SECURITY VALIDATORS
// ==========================================

/**
 * Validates text has no prompt injection attempts
 */
export const validateNoPromptInjection: Validator<{
  content?: string;
  rawText?: string;
}> = (data) => {
  const text = data.content ?? data.rawText;

  if (!text) {
    return {
      valid: false,
      errorKind: "Format",
      message: "No text content found (expected 'content' or 'rawText' field)",
    };
  }

  const pattern = hasInjectionPattern(text);
  if (pattern) {
    return {
      valid: false,
      errorKind: "Security",
      message: `Prompt injection detected: ${pattern.source}`,
    };
  }
  return { valid: true };
};

/**
 * Validates PO notes have no prompt injection attempts
 */
export const validateNoNotesInjection: Validator<TranscriptInput> = (data) => {
  if (!data.poNotes || data.poNotes.length === 0) {
    return { valid: true }; // Skip if no notes
  }

  const pattern = hasInjectionPattern(data.poNotes);
  if (pattern) {
    return {
      valid: false,
      errorKind: "Security",
      message: `Prompt injection detected in PO notes: ${pattern.source}`,
    };
  }
  return { valid: true };
};

/**
 * Validates speaker distribution to detect monologues or audio quality issues
 */
export const validateDiarization: Validator<TranscriptInput> = (data) => {
  if (!data.utterances || data.utterances.length === 0) {
    return { valid: true }; // Skip if no metadata available
  }

  const speakerCounts: Record<string, number> = {};
  let totalWords = 0;

  for (const segment of data.utterances) {
    const speaker = segment.speaker || "Unknown";
    const words = countWords(segment.text || "");
    speakerCounts[speaker] = (speakerCounts[speaker] || 0) + words;
    totalWords += words;
  }

  const uniqueSpeakers = Object.keys(speakerCounts).length;

  // Check 1: Monologue detection (< 2 speakers)
  if (uniqueSpeakers < 2) {
    return {
      valid: false,
      errorKind: "AudioQuality",
      message: `Only ${uniqueSpeakers} speaker detected.`,
    };
  }

  // Check 2: Speaker dominance (>95% single speaker)
  if (totalWords > 0) {
    for (const [speaker, count] of Object.entries(speakerCounts)) {
      const ratio = count / totalWords;
      if (ratio > 0.95) {
        return {
          valid: false,
          errorKind: "AudioQuality",
          message: `Speaker '${speaker}' dominates ${(ratio * 100).toFixed(1)}% of conversation. Possible audio quality issue.`,
        };
      }
    }
  }

  return { valid: true };
};

// ==========================================
// PIPELINE GUARDS
// ==========================================

/**
 * Transcript guard - validates transcript meets minimum requirements
 */
export const transcriptGuard = createGuard<TranscriptInput>([
  validateWordCount,
  validateNoPromptInjection,
  validateNoNotesInjection,
  validateDiarization,
]);

/**
 * Extraction guard - validates extraction output
 */
export const extractionGuard = createGuard<ExtractionOutput>([
  validateExtractionPresence,
]);

/**
 * Drafting guard - validates case notes and minutes
 */
export const draftingGuard = createGuard<DraftingOutput>([
  validateCaseNoteLength,
  validateCaseNoteQuality,
  validateMinutesDetail,
  validateMinutesQuality,
]);
