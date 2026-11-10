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

import { Type } from "@google/genai";
import { z } from "zod";

import { GEMINI_TYPE_MAP } from "~@idaho-th/trpc/routes/vertex/constants";
import {
  VertexExtractionError,
  VertexQuotaExceededError,
  VertexResponseValidationError,
  VertexSafetyBlockedError,
} from "~@idaho-th/trpc/routes/vertex/vertex.errors";
import type {
  AnalyzePdfOptions,
  GeminiSchema,
  ModelProfile,
} from "~@idaho-th/trpc/routes/vertex/vertex.types";

const modelMocks = vi.hoisted(() => ({
  profileOverride: undefined as ModelProfile | undefined,
}));

// resolveModelProfile is data, not behaviour — overriding it is the only way to
// reach the optional-field branches of buildModelConfig from the public API.
vi.mock(
  "~@idaho-th/trpc/routes/vertex/vertex.models",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("~@idaho-th/trpc/routes/vertex/vertex.models")
      >();
    return {
      ...actual,
      resolveModelProfile: (
        key?: Parameters<typeof actual.resolveModelProfile>[0],
      ) => modelMocks.profileOverride ?? actual.resolveModelProfile(key),
    };
  },
);

const { analyzeApplicationPdfWithVertex } = await import(
  "~@idaho-th/trpc/routes/vertex/vertex.gemini.transport"
);

const PDF_BASE64 = Buffer.from("%PDF-1.7 fake").toString("base64");

const RESPONSE_SCHEMA: GeminiSchema = {
  type: "object",
  properties: {
    clientFullName: { type: "string", nullable: true },
    pages: { type: "array", items: { type: "integer", minimum: 1 } },
  },
  required: ["clientFullName"],
};

const OPTIONS: AnalyzePdfOptions = {
  systemPrompt: "system prompt",
  userPrompt: "first line of the user prompt\nsecond line",
  responseSchema: RESPONSE_SCHEMA,
};

const validator = z.object({
  clientFullName: z.string().nullable(),
  pages: z.array(z.number()).optional(),
});

function buildDeps(
  generateContent: ReturnType<typeof vi.fn>,
  responseValidator: typeof validator | z.ZodType<object> = validator,
) {
  const logger = { info: vi.fn(), debug: vi.fn() };
  return {
    deps: {
      client: { models: { generateContent } } as never,
      config: { project: "test-project" },
      logger,
      responseValidator: responseValidator as never,
    },
    logger,
  };
}

function textResponse(text: string) {
  return { text, candidates: [{ finishReason: "STOP" }] };
}

async function run(
  response: unknown,
  responseValidator?: z.ZodType<object>,
  options: AnalyzePdfOptions = OPTIONS,
) {
  const generateContent = vi.fn().mockResolvedValue(response);
  const { deps, logger } = buildDeps(generateContent, responseValidator);
  return {
    generateContent,
    logger,
    result: analyzeApplicationPdfWithVertex(deps, PDF_BASE64, options),
  };
}

beforeEach(() => {
  modelMocks.profileOverride = undefined;
});

describe("candidate validation", () => {
  it("rejects a response with no candidates", async () => {
    const { result } = await run({ text: "{}", candidates: [] });

    await expect(result).rejects.toThrow(VertexExtractionError);
    await expect(result).rejects.toThrow("returned no candidates");
  });

  it("rejects a missing candidates field", async () => {
    const { result } = await run({ text: "{}" });

    await expect(result).rejects.toThrow("returned no candidates");
  });

  it.each(["MAX_TOKENS", "RECITATION", "OTHER"])(
    "rejects the %s finish reason",
    async (finishReason) => {
      const { result } = await run({
        text: '{"clientFullName":"Jane Doe"}',
        candidates: [{ finishReason }],
      });

      await expect(result).rejects.toThrow(
        `Unexpected finishReason: ${finishReason}`,
      );
    },
  );

  it("rejects a safety-blocked candidate", async () => {
    const { result } = await run({
      text: '{"clientFullName":"Jane Doe"}',
      candidates: [
        { finishReason: "STOP", safetyRatings: [{ blocked: true }] },
      ],
    });

    await expect(result).rejects.toThrow(VertexSafetyBlockedError);
  });

  it("accepts unblocked safety ratings", async () => {
    const { result } = await run({
      text: '{"clientFullName":"Jane Doe"}',
      candidates: [
        { finishReason: "STOP", safetyRatings: [{ blocked: false }] },
      ],
    });

    await expect(result).resolves.toEqual({
      data: { clientFullName: "Jane Doe" },
    });
  });
});

describe("response text resolution", () => {
  it("prefers result.text", async () => {
    const { result, logger } = await run({
      text: '{"clientFullName":"Jane Doe"}',
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: '{"clientFullName":"John Doe"}' }] },
        },
      ],
    });

    await expect(result).resolves.toEqual({
      data: { clientFullName: "Jane Doe" },
    });
    expect(logger.debug).not.toHaveBeenCalledWith(
      expect.stringContaining("candidate fallback"),
    );
  });

  it("falls back to the first text part and says so in the log", async () => {
    const { result, logger } = await run({
      text: "",
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [
              { inlineData: { data: "not-text" } },
              { text: '{"clientFullName":"Jane Doe"}' },
              { text: '{"clientFullName":"John Doe"}' },
            ],
          },
        },
      ],
    });

    // The resolver takes the first text part; it does not concatenate them.
    await expect(result).resolves.toEqual({
      data: { clientFullName: "Jane Doe" },
    });
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining("candidate fallback"),
    );
  });

  it.each([
    ["no parts at all", { finishReason: "STOP" }],
    ["an empty parts array", { finishReason: "STOP", content: { parts: [] } }],
    [
      "no text part",
      {
        finishReason: "STOP",
        content: { parts: [{ inlineData: { data: "x" } }] },
      },
    ],
  ])("rejects a response with %s", async (_label, candidate) => {
    const { result } = await run({ text: "", candidates: [candidate] });

    await expect(result).rejects.toThrow("returned an empty response");
  });
});

describe("JSON parsing", () => {
  it("accepts a valid JSON object", async () => {
    const { result } = await run(
      textResponse('{"clientFullName":"Jane Doe","pages":[1,2]}'),
    );

    await expect(result).resolves.toEqual({
      data: { clientFullName: "Jane Doe", pages: [1, 2] },
    });
  });

  it.each([
    ["a fenced code block", '```json\n{"clientFullName":"Jane Doe"}\n```'],
    ["leading prose", 'Here is the data: {"clientFullName":"Jane Doe"}'],
    ["plain prose", "I cannot read this document."],
    ["truncated JSON", '{"clientFullName":"Jane D'],
    ["an empty object literal string", "{"],
  ])(
    "rejects %s rather than returning a partial object",
    async (_label, text) => {
      const { result } = await run(textResponse(text));

      await expect(result).rejects.toThrow("non-JSON response");
    },
  );

  it.each([
    ["an array", "[1,2,3]"],
    ["a bare string", '"just a string"'],
    ["a number", "42"],
    ["null", "null"],
  ])("rejects %s as not a JSON object", async (_label, text) => {
    const { result } = await run(textResponse(text));

    await expect(result).rejects.toThrow(/not a JSON object|non-JSON response/);
  });
});

describe("request construction", () => {
  it("sends the model, prompts, PDF part and mapped schema", async () => {
    const { generateContent, result } = await run(
      textResponse('{"clientFullName":"Jane Doe"}'),
    );
    await result;

    expect(generateContent).toHaveBeenCalledTimes(1);
    const request = generateContent.mock.calls[0]?.[0];

    expect(request.model).toBe("gemini-3.1-pro-preview");
    expect(request.contents).toEqual([
      { inlineData: { mimeType: "application/pdf", data: PDF_BASE64 } },
      { text: OPTIONS.userPrompt },
    ]);
    expect(request.config.systemInstruction).toBe(OPTIONS.systemPrompt);
    expect(request.config.responseMimeType).toBe("application/json");
  });

  it("maps nested properties and array items to Gemini types", async () => {
    const { generateContent, result } = await run(
      textResponse('{"clientFullName":"Jane Doe"}'),
    );
    await result;

    const schema = generateContent.mock.calls[0]?.[0].config.responseSchema;
    expect(schema.type).toBe(GEMINI_TYPE_MAP.object);
    expect(schema.required).toEqual(["clientFullName"]);
    expect(schema.properties.clientFullName).toMatchObject({
      type: Type.STRING,
      nullable: true,
    });
    expect(schema.properties.pages.type).toBe(Type.ARRAY);
    expect(schema.properties.pages.items).toMatchObject({
      type: Type.INTEGER,
      minimum: 1,
    });
  });

  it("omits undefined model config entries instead of sending them", async () => {
    const { generateContent, result } = await run(
      textResponse('{"clientFullName":"Jane Doe"}'),
    );
    await result;

    const config = generateContent.mock.calls[0]?.[0].config;
    expect(config.temperature).toBe(0);
    expect(config.thinkingConfig).toEqual({ thinkingLevel: "LOW" });
    // Sending an explicit `undefined` would override the model's own default.
    for (const key of ["topP", "topK", "maxOutputTokens"]) {
      expect(config).not.toHaveProperty(key);
    }
  });

  it("forwards every optional model config entry that is set", async () => {
    modelMocks.profileOverride = {
      modelName: "test-model",
      location: "us-central1",
      temperature: 0.4,
      topP: 0.9,
      topK: 20,
      maxOutputTokens: 2_048,
    };

    const { generateContent, result } = await run(
      textResponse('{"clientFullName":"Jane Doe"}'),
    );
    await result;

    expect(generateContent.mock.calls[0]?.[0].config).toMatchObject({
      temperature: 0.4,
      topP: 0.9,
      topK: 20,
      maxOutputTokens: 2_048,
    });
    // No thinkingLevel on the profile means no thinkingConfig at all.
    expect(generateContent.mock.calls[0]?.[0].config).not.toHaveProperty(
      "thinkingConfig",
    );
  });
});

describe("transport failures", () => {
  it("maps a 429 from the SDK to a quota error", async () => {
    const generateContent = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error("rate limited"), { status: 429 }),
      );
    const { deps } = buildDeps(generateContent);

    await expect(
      analyzeApplicationPdfWithVertex(deps, PDF_BASE64, OPTIONS),
    ).rejects.toThrow(VertexQuotaExceededError);
  });

  it("maps a 403 from the SDK to a safety error", async () => {
    const generateContent = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error("forbidden"), { status: 403 }),
      );
    const { deps } = buildDeps(generateContent);

    await expect(
      analyzeApplicationPdfWithVertex(deps, PDF_BASE64, OPTIONS),
    ).rejects.toThrow(VertexSafetyBlockedError);
  });

  it("wraps any other SDK failure as a Vertex extraction error", async () => {
    const generateContent = vi
      .fn()
      .mockRejectedValue(new Error("socket hang up"));
    const { deps } = buildDeps(generateContent);

    await expect(
      analyzeApplicationPdfWithVertex(deps, PDF_BASE64, OPTIONS),
    ).rejects.toThrow("Vertex AI call failed: socket hang up");
  });

  it("reports a validation failure and logs it once", async () => {
    const strict = z.object({ clientFullName: z.string() });
    const { result, logger } = await run(
      textResponse('{"clientFullName":null}'),
      strict,
    );

    await expect(result).rejects.toThrow(VertexResponseValidationError);
    expect(logger.info).toHaveBeenCalledWith(
      "Vertex AI response validation failed",
      expect.objectContaining({ userPromptPreview: expect.any(String) }),
    );
  });

  it("leaves the value the model returned out of the error, its cause chain and the log", async () => {
    const relationValidator = z.object({
      relation: z.enum(["Parent", "Sibling"]),
    });
    const { result, logger } = await run(
      textResponse('{"relation":"Jane Q Public"}'),
      relationValidator,
    );

    const error = await result.catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(VertexResponseValidationError);
    // A ZodError's own message embeds the received value, so it must not be
    // attached anywhere Sentry follows `cause`.
    expect((error as Error).cause).toBeUndefined();
    const everywhere = JSON.stringify([
      (error as Error).message,
      logger.info.mock.calls,
    ]);
    expect(everywhere).not.toContain("Jane Q Public");
  });
});
