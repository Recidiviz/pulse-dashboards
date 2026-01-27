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

import { GoogleGenerativeAI, Schema } from "@google/generative-ai";
import { traceable } from "langsmith/traceable";
import { ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Recursively removes fields that Gemini's API doesn't support
 */
function stripUnsupportedFields(obj: Record<string, unknown>): Schema {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip unsupported fields
    if (
      key === "$schema" ||
      key === "additionalProperties" ||
      key === "default"
    ) {
      continue;
    }

    // Recursively clean nested objects
    if (value && typeof value === "object" && !Array.isArray(value)) {
      cleaned[key] = stripUnsupportedFields(value as Record<string, unknown>);
    }
    // Clean arrays of objects
    else if (Array.isArray(value)) {
      cleaned[key] = value.map((item) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? stripUnsupportedFields(item as Record<string, unknown>)
          : item,
      );
    }
    // Keep primitives as-is
    else {
      cleaned[key] = value;
    }
  }

  return cleaned as unknown as Schema;
}

/**
 * Converts a Zod schema to Gemini's responseJsonSchema format
 * Gemini doesn't support $schema, additionalProperties, and other JSON Schema metadata
 */
export function zodToGeminiResponseSchema(schema: ZodSchema) {
  // Use "root" strategy to properly handle recursive schemas (e.g., MinuteItemSchema)
  const jsonSchema = zodToJsonSchema(schema, {
    $refStrategy: "root",
  });
  return stripUnsupportedFields(jsonSchema);
}

type ZodGenerateContentOptions<T extends ZodSchema> = {
  client: GoogleGenerativeAI;
  systemInstruction: string;
  userMessage: string;
  schema: T;
  modelName?: string;
};

/**
 * Generates content with Gemini using a Zod schema for structured output
 */
const generateContentWithZodSchemaInternal = async <T extends ZodSchema>({
  client,
  systemInstruction,
  userMessage,
  schema,
  modelName = "gemini-2.5-flash",
}: ZodGenerateContentOptions<T>): Promise<T["_output"]> => {
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: zodToGeminiResponseSchema(schema),
    },
  });

  const result = await model.generateContent(userMessage);
  const content = result.response.text();

  // Parse and validate with Zod
  return schema.parse(JSON.parse(content));
};

export const generateContentWithZodSchema = traceable(
  generateContentWithZodSchemaInternal,
  { name: "gemini-generate-content", run_type: "llm" },
);
