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

import { GoogleGenAI, Part } from "@google/genai";
import { Storage } from "@google-cloud/storage";
import { traceable } from "langsmith/traceable";
import { ZodSchema } from "zod";

import { zodToGeminiResponseSchema } from "~@meetings/tasks/llm/clients/gemini";

/** The model the LLM judges run on. */
export const VERTEX_JUDGE_MODEL = "gemini-3.8-flash";

// Vertex serves Gemini 3.x only from the "us" and "global" multi-regions, not
// from regional endpoints such as us-central1.
const DEFAULT_VERTEX_LOCATION = "us";

/**
 * Returns a Gemini client that calls Vertex AI in GOOGLE_CLOUD_PROJECT.
 * Throws if GOOGLE_CLOUD_PROJECT is not set.
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

export type VertexGenerateContentOptions<T extends ZodSchema> = {
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

const generateVertexContentInternal = async <T extends ZodSchema>({
  client,
  systemInstruction,
  parts,
  schema,
  modelName = VERTEX_JUDGE_MODEL,
  timeout,
}: VertexGenerateContentOptions<T>): Promise<T["_output"]> => {
  const response = await client.models.generateContent({
    model: modelName,
    contents: typeof parts === "string" ? parts : [{ role: "user", parts }],
    config: {
      systemInstruction,
      // Google recommends the default temperature of 1 for Gemini 3 models;
      // lower values can cause looping or worse reasoning.
      temperature: 1,
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

const generateVertexContentTraced = traceable(generateVertexContentInternal, {
  name: "gemini-generate-content",
  run_type: "llm",
});

/**
 * Generates content with Gemini on Vertex AI, parsed with a Zod schema.
 */
export const generateVertexContentWithZodSchema = <T extends ZodSchema>(
  options: VertexGenerateContentOptions<T>,
): Promise<T["_output"]> =>
  options.tracingEnabled === false
    ? generateVertexContentInternal(options)
    : generateVertexContentTraced(options);

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
