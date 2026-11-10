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

import { GoogleGenAI } from "@google/genai";
import { Agent, setGlobalDispatcher } from "undici";
import { ZodType } from "zod";

import { getLogger } from "~@idaho-th/trpc/routes/common/logger";
import { vertexAIConfig } from "~@idaho-th/trpc/routes/vertex/config";
import { VERTEX_HTTP_TIMEOUT_MS } from "~@idaho-th/trpc/routes/vertex/constants";
import { analyzeApplicationPdfWithVertex } from "~@idaho-th/trpc/routes/vertex/vertex.gemini.transport";
import { resolveModelProfile } from "~@idaho-th/trpc/routes/vertex/vertex.models";
import { geminiSchemaToZod } from "~@idaho-th/trpc/routes/vertex/vertex.schema";
import type {
  AnalyzePdfOptions,
  GeminiSchema,
  IVertexAIExtractor,
  ModelProfile,
  VertexAIConfig,
} from "~@idaho-th/trpc/routes/vertex/vertex.types";

export {
  VertexExtractionError,
  VertexExtractionTimeoutError,
  VertexQuotaExceededError,
  VertexResponseValidationError,
  VertexSafetyBlockedError,
} from "~@idaho-th/trpc/routes/vertex/vertex.errors";

setGlobalDispatcher(
  new Agent({
    connections: 100,
    headersTimeout: VERTEX_HTTP_TIMEOUT_MS,
    bodyTimeout: VERTEX_HTTP_TIMEOUT_MS,
    keepAliveTimeout: 30_000,
  }),
);

const clientPool = new Map<string, GoogleGenAI>();

function buildClientKey(config: VertexAIConfig, profile: ModelProfile): string {
  return `${config.project}::${profile.location}`;
}

function getOrCreateClient(
  config: VertexAIConfig,
  profile: ModelProfile,
): GoogleGenAI {
  const key = buildClientKey(config, profile);

  let client = clientPool.get(key);
  if (!client) {
    client = new GoogleGenAI({
      vertexai: true,
      project: config.project,
      location: profile.location,
    });
    clientPool.set(key, client);
  }

  return client;
}

export function getVertexAIClient(
  config: VertexAIConfig,
  profile: ModelProfile,
): GoogleGenAI {
  return getOrCreateClient(config, profile);
}

const validatorCache = new WeakMap<GeminiSchema, ZodType<unknown>>();

function getOrCompileValidator<T>(geminiSchema: GeminiSchema): ZodType<T> {
  let validator = validatorCache.get(geminiSchema);
  if (!validator) {
    validator = geminiSchemaToZod(geminiSchema);
    validatorCache.set(geminiSchema, validator);
  }
  return validator as ZodType<T>;
}

const logger = getLogger("vertex-ai");

export class VertexAIClient implements IVertexAIExtractor {
  constructor(private readonly config: VertexAIConfig) {}

  async analyzeApplicationPdf<T extends object>(
    pdfBase64: string,
    options: AnalyzePdfOptions,
  ): Promise<{ data: T }> {
    const profile = resolveModelProfile(options.modelProfile);
    const client = getOrCreateClient(this.config, profile);
    const responseValidator = getOrCompileValidator<T>(options.responseSchema);

    return analyzeApplicationPdfWithVertex<T>(
      { client, config: this.config, logger, responseValidator },
      pdfBase64,
      options,
    );
  }
}

// Singleton — shared across all concurrent calls in the process.
export const vertexAI: IVertexAIExtractor = new VertexAIClient(vertexAIConfig);
