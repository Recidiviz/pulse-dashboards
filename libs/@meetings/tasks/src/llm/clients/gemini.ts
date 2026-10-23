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

import { GoogleGenAI, Part } from "@google/genai";
import { Storage } from "@google-cloud/storage";
import { traceable } from "langsmith/traceable";
import { ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// gemini-2.5-flash is served only by regional Vertex endpoints such as
// us-central1, while Gemini 3.x is served only by the "us" multi-region, so
// moving the default model to 3.x also means changing this location.
const DEFAULT_VERTEX_LOCATION = "us-central1";

/**
 * Returns a Gemini client that routes through Vertex AI in GCP
 */
export function createVertexGeminiClient(): GoogleGenAI {
  const project = process.env["GOOGLE_CLOUD_PROJECT"];
  if (!project) {
    throw new Error("Missing GOOGLE_CLOUD_PROJECT environment variable");
  }

  return new GoogleGenAI({
    vertexai: true,
    project,
    location: process.env["GOOGLE_CLOUD_LOCATION"] ?? DEFAULT_VERTEX_LOCATION,
  });
}

/**
 * Recursively removes fields that Gemini's API doesn't support
 */
function stripUnsupportedFields(
  obj: Record<string, unknown>,
): Record<string, unknown> {
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

  return cleaned;
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

export type ZodGenerateContentOptions<T extends ZodSchema> = {
  client: GoogleGenAI;
  systemInstruction: string;
  /** Plain string or pre-built content parts (e.g. for multimodal input with audio). */
  parts: Part[] | string;
  schema: T;
  modelName?: string;
  /** Request timeout in milliseconds. Defaults to the Gemini SDK default. */
  timeout?: number;
  /** Set to false to skip the LangSmith trace for this call. Defaults to true. */
  tracingEnabled?: boolean;
};

/**
 * Generates content with Gemini using a Zod schema for structured output.
 * Accepts either a plain string message or an array of content Parts for multimodal input.
 */
const generateContentWithZodSchemaInternal = async <T extends ZodSchema>({
  client,
  systemInstruction,
  parts,
  schema,
  modelName = "gemini-2.5-flash",
  timeout,
}: ZodGenerateContentOptions<T>): Promise<T["_output"]> => {
  const response = await client.models.generateContent({
    model: modelName,
    contents: typeof parts === "string" ? parts : [{ role: "user", parts }],
    config: {
      systemInstruction,
      // Use a lower temperature for a more deterministic output
      temperature: 0,
      responseMimeType: "application/json",
      responseJsonSchema: zodToGeminiResponseSchema(schema),
      ...(timeout !== undefined ? { httpOptions: { timeout } } : {}),
    },
  });

  const content = response.text;
  if (content === undefined) {
    throw new Error("Gemini returned a response with no text");
  }

  return schema.parse(JSON.parse(content));
};

const generateContentWithZodSchemaTraced = traceable(
  generateContentWithZodSchemaInternal,
  { name: "gemini-generate-content", run_type: "llm" },
);

export const generateContentWithZodSchema = <T extends ZodSchema>(
  options: ZodGenerateContentOptions<T>,
): Promise<T["_output"]> =>
  options.tracingEnabled === false
    ? generateContentWithZodSchemaInternal(options)
    : generateContentWithZodSchemaTraced(options);

/**
 * Returns a content part that points Gemini at meeting audio in Cloud Storage.
 * Vertex AI reads the gs:// object itself, so the bucket must be in the same
 * project as the Vertex request.
 */
export async function audioFilePart(
  bucketName: string,
  filePath: string,
): Promise<Part> {
  const expectedAudioBucket = process.env["AUDIO_RECORDINGS_BUCKET_NAME"];
  if (bucketName !== expectedAudioBucket) {
    throw new Error(
      `Requested audio from bucket ${bucketName}, expected ${expectedAudioBucket}`,
    );
  }

  const [metadata] = await new Storage()
    .bucket(bucketName)
    .file(filePath)
    .getMetadata();

  return {
    fileData: {
      fileUri: `gs://${bucketName}/${filePath}`,
      mimeType: metadata.contentType ?? "audio/mpeg",
    },
  };
}
