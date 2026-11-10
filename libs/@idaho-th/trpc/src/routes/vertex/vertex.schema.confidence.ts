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

import type { GeminiSchema } from "~@idaho-th/trpc/routes/vertex/vertex.types";

export const FIELD_CONFIDENCE_SUFFIX = "Confidence" as const;

export const FIELD_CONFIDENCE_MIN = 0;
export const FIELD_CONFIDENCE_MAX = 100;

const makeFieldConfidence = (): GeminiSchema => ({
  type: "integer",
  minimum: FIELD_CONFIDENCE_MIN,
  maximum: FIELD_CONFIDENCE_MAX,
});

function fieldConfidenceKey(fieldKey: string): string {
  return `${fieldKey}${FIELD_CONFIDENCE_SUFFIX}`;
}

function isNestedObjectSchema(schema: GeminiSchema): boolean {
  return schema.type === "object" && schema.properties !== undefined;
}

export function withFieldConfidence(schema: GeminiSchema): GeminiSchema {
  if (!isNestedObjectSchema(schema)) {
    return schema;
  }

  const properties: Record<string, GeminiSchema> = {};
  const required = [...(schema.required ?? [])];

  for (const [key, fieldSchema] of Object.entries(schema.properties ?? {})) {
    if (isNestedObjectSchema(fieldSchema)) {
      properties[key] = withFieldConfidence(fieldSchema);
      continue;
    }

    properties[key] = fieldSchema;
    const confidenceKey = fieldConfidenceKey(key);
    properties[confidenceKey] = makeFieldConfidence();
    if (required.includes(key)) {
      required.push(confidenceKey);
    }
  }

  return { ...schema, properties, required };
}

export function resolveResponseSchema(
  schema: GeminiSchema,
  includeConfidence: boolean,
): GeminiSchema {
  return includeConfidence ? withFieldConfidence(schema) : schema;
}

export function isFieldConfidenceKey(key: string): boolean {
  return key.endsWith(FIELD_CONFIDENCE_SUFFIX);
}

export function stripFieldConfidence<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripFieldConfidence(item)) as T;
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !isFieldConfidenceKey(key))
      .map(([key, nested]) => [key, stripFieldConfidence(nested)]);

    return Object.fromEntries(entries) as T;
  }

  return value;
}
