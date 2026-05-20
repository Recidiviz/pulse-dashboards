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

import { GoogleGenerativeAI, Part, Schema } from "@google/generative-ai";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";
import { Storage } from "@google-cloud/storage";
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

export type ZodGenerateContentOptions<T extends ZodSchema> = {
  client: GoogleGenerativeAI;
  systemInstruction: string;
  /** Plain string or pre-built content parts (e.g. for multimodal input with audio). */
  parts: Part[] | string;
  schema: T;
  modelName?: string;
  /** Request timeout in milliseconds. Defaults to the Gemini SDK default (~10 minutes). */
  timeout?: number;
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
  const model = client.getGenerativeModel(
    {
      model: modelName,
      systemInstruction,
      generationConfig: {
        // Use a lower temperature for a more deterministic output
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: zodToGeminiResponseSchema(schema),
      },
    },
    timeout !== undefined ? { timeout } : undefined,
  );

  const contents =
    typeof parts === "string" ? parts : { contents: [{ role: "user", parts }] };

  const result = await model.generateContent(contents);
  const content = result.response.text();

  return schema.parse(JSON.parse(content));
};

export const generateContentWithZodSchema = traceable(
  generateContentWithZodSchemaInternal,
  { name: "gemini-generate-content", run_type: "llm" },
);

/**
 * Upload audio from GCS to the Gemini Files API and return the file URI.
 */
export async function uploadAudioToGemini(
  fileManager: GoogleAIFileManager,
  bucketName: string,
  filePath: string,
): Promise<{ uri: string; mimeType: string }> {
  const expectedAudioBucket = process.env["AUDIO_RECORDINGS_BUCKET_NAME"];
  if (bucketName !== expectedAudioBucket) {
    throw new Error(
      `Requested upload from bucket ${bucketName}, expected ${expectedAudioBucket}`,
    );
  }
  const storage = new Storage();
  const gcsFile = storage.bucket(bucketName).file(filePath);

  const [[audioBuffer], [metadata]] = await Promise.all([
    gcsFile.download(),
    gcsFile.getMetadata(),
  ]);

  const mimeType = metadata.contentType ?? "audio/mpeg";

  const uploadResponse = await fileManager.uploadFile(audioBuffer, {
    mimeType,
    displayName: "meeting-audio",
  });

  let geminiFile = uploadResponse.file;
  // Poll for processing completed
  while (geminiFile.state === FileState.PROCESSING) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // eslint-disable-next-line no-await-in-loop
    geminiFile = await fileManager.getFile(geminiFile.name);
  }
  if (geminiFile.state === FileState.FAILED) {
    throw new Error(
      `Gemini file upload failed: ${JSON.stringify(geminiFile.error)}`,
    );
  }

  return { uri: geminiFile.uri, mimeType };
}
