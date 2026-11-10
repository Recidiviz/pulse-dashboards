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

import {
  GenerateContentResponse,
  GoogleGenAI,
  Schema,
  ThinkingLevel,
} from "@google/genai";
import { ZodType } from "zod";

import {
  GEMINI_TYPE_MAP,
  VERTEX_AI_PDF_MIME_TYPE,
} from "~@idaho-th/trpc/routes/vertex/constants";
import {
  handleVertexError,
  VertexExtractionError,
  VertexResponseValidationError,
  VertexSafetyBlockedError,
} from "~@idaho-th/trpc/routes/vertex/vertex.errors";
import {
  resolveModelProfile,
  type VertexThinkingLevel,
} from "~@idaho-th/trpc/routes/vertex/vertex.models";
import { sanitizeNulls } from "~@idaho-th/trpc/routes/vertex/vertex.sanitizeNulls";
import type {
  AnalyzePdfOptions,
  GeminiSchema,
  ModelProfile,
  VertexAIConfig,
  VertexExtractionLogger,
} from "~@idaho-th/trpc/routes/vertex/vertex.types";
import { logVertexResponseValidationFailure } from "~@idaho-th/trpc/routes/vertex/vertex.validationLog";
import { toZodMessage } from "~@idaho-th/trpc/routes/vertex/vertex.zod";

const VALID_FINISH_REASONS = new Set(["STOP"] as const) as ReadonlySet<string>;

type GenerateContentRequest = Parameters<
  GoogleGenAI["models"]["generateContent"]
>[0];

const THINKING_LEVEL_BY_PROFILE: Record<VertexThinkingLevel, ThinkingLevel> = {
  minimal: ThinkingLevel.MINIMAL,
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
};

type VertexTransportDeps<T extends object> = {
  client: GoogleGenAI;
  config: VertexAIConfig;
  logger: VertexExtractionLogger;
  responseValidator: ZodType<T>;
};

function definedEntry<K extends string, V>(
  key: K,
  value: V | undefined,
): Record<K, V> | object {
  return value === undefined ? {} : { [key]: value };
}

function buildModelConfig(profile: ModelProfile): Record<string, unknown> {
  return {
    temperature: profile.temperature,
    ...definedEntry("topP", profile.topP),
    ...definedEntry("topK", profile.topK),
    ...definedEntry("maxOutputTokens", profile.maxOutputTokens),
    ...(profile.thinkingLevel === undefined
      ? {}
      : {
          thinkingConfig: {
            thinkingLevel: THINKING_LEVEL_BY_PROFILE[profile.thinkingLevel],
          },
        }),
  };
}

function toVertexSchema(schema: GeminiSchema): Schema {
  return {
    type: GEMINI_TYPE_MAP[schema.type],
    nullable: schema.nullable,
    required: schema.required,
    enum: schema.enum,
    minimum: schema.minimum,
    maximum: schema.maximum,
    properties: schema.properties
      ? Object.fromEntries(
          Object.entries(schema.properties).map(([k, v]) => [
            k,
            toVertexSchema(v),
          ]),
        )
      : undefined,
    items: schema.items ? toVertexSchema(schema.items) : undefined,
  };
}

function buildGenerateContentRequest(
  pdfBase64: string,
  options: AnalyzePdfOptions,
  profile: ModelProfile,
): GenerateContentRequest {
  const { systemPrompt, userPrompt, responseSchema: schema } = options;
  return {
    model: profile.modelName,
    contents: [
      { inlineData: { mimeType: VERTEX_AI_PDF_MIME_TYPE, data: pdfBase64 } },
      { text: userPrompt },
    ],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: toVertexSchema(schema),
      ...buildModelConfig(profile),
    },
  };
}

function assertValidCandidate(result: GenerateContentResponse): void {
  const candidate = result.candidates?.[0];
  if (!candidate)
    throw new VertexExtractionError("Vertex AI returned no candidates");
  if (
    candidate.finishReason &&
    !VALID_FINISH_REASONS.has(candidate.finishReason)
  ) {
    throw new VertexExtractionError(
      `Unexpected finishReason: ${candidate.finishReason}`,
    );
  }
  const isBlocked = candidate.safetyRatings?.some((r) => r.blocked) ?? false;
  if (isBlocked) throw new VertexSafetyBlockedError();
}

function parseJsonText(responseText: string): Record<string, unknown> {
  let parsedResponse: unknown;
  try {
    parsedResponse = JSON.parse(responseText);
  } catch {
    throw new VertexExtractionError(
      `Vertex AI returned non-JSON response (length=${responseText.length})`,
    );
  }
  if (
    !parsedResponse ||
    typeof parsedResponse !== "object" ||
    Array.isArray(parsedResponse)
  ) {
    throw new VertexExtractionError(
      `Vertex AI response was not a JSON object. Got: ${typeof parsedResponse}`,
    );
  }
  return parsedResponse as Record<string, unknown>;
}

function resolveResponseText(
  result: GenerateContentResponse,
  logger: VertexExtractionLogger,
): string | undefined {
  if (result.text) return result.text;
  const fallback = result.candidates?.[0]?.content?.parts?.find(
    (part): part is { text: string } =>
      "text" in part && typeof part.text === "string",
  )?.text;
  if (fallback) {
    logger.debug(
      "resolveResponseText used candidate fallback — result.text was falsy",
    );
  }
  return fallback;
}

export async function analyzeApplicationPdfWithVertex<T extends object>(
  deps: VertexTransportDeps<T>,
  pdfBase64: string,
  options: AnalyzePdfOptions,
): Promise<{ data: T }> {
  const { client, config, logger, responseValidator } = deps;
  const { systemPrompt, userPrompt, modelProfile } = options;
  const profile = resolveModelProfile(modelProfile);

  const { project } = config;

  logger.info("Starting analyzeApplicationPdf", {
    model: profile.modelName,
    project,
    location: profile.location,
    temperature: profile.temperature,
    thinkingLevel: profile.thinkingLevel ?? null,
  });
  logger.debug("Vertex request metadata", {
    pdfBase64Length: pdfBase64.length,
    systemPromptLength: systemPrompt.length,
    userPromptLength: userPrompt.length,
    modelProfile,
  });

  const request = buildGenerateContentRequest(pdfBase64, options, profile);
  let result: GenerateContentResponse;
  try {
    result = await client.models.generateContent(request);
  } catch (error) {
    return handleVertexError(error);
  }

  assertValidCandidate(result);
  const responseText = resolveResponseText(result, logger);
  if (!responseText) {
    throw new VertexExtractionError("Vertex AI returned an empty response");
  }

  logger.debug("LLM response metadata", {
    responseLength: responseText.length,
    isJsonObject: responseText.trimStart().startsWith("{"),
  });

  const rawParsed = parseJsonText(responseText);
  const sanitizedResponse = sanitizeNulls(rawParsed);
  const validationResult = responseValidator.safeParse(sanitizedResponse);
  if (!validationResult.success) {
    logVertexResponseValidationFailure(
      logger,
      userPrompt,
      rawParsed,
      sanitizedResponse,
      validationResult.error,
    );
    // No cause: the ZodError's own message embeds the received values, which
    // Sentry would send as a linked exception.
    throw new VertexResponseValidationError(
      `Vertex AI response validation failed: ${toZodMessage(validationResult.error)}`,
    );
  }

  return { data: validationResult.data };
}
