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

import type {
  GeminiSchema,
  ModelProfile,
  VertexAIConfig,
} from "~@idaho-th/trpc/routes/vertex/vertex.types";

const sdk = vi.hoisted(() => ({ constructorArgs: [] as unknown[] }));

// Only the constructor is stubbed: the Type/ThinkingLevel enums this subtree
// also imports must stay real. Plain class, not vi.fn, because the config-level
// mockReset would empty a mocked constructor's implementation between tests.
vi.mock("@google/genai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@google/genai")>()),
  GoogleGenAI: class {
    constructor(options: unknown) {
      sdk.constructorArgs.push(options);
    }
  },
}));

// setGlobalDispatcher runs at module load and would reconfigure undici globally.
vi.mock("undici", () => ({
  Agent: class {},
  setGlobalDispatcher: () => undefined,
}));

const transportMocks = vi.hoisted(() => ({
  analyzeApplicationPdfWithVertex: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/routes/vertex/vertex.gemini.transport", () => ({
  ...transportMocks,
}));

const { getVertexAIClient, VertexAIClient } = await import(
  "~@idaho-th/trpc/routes/clients/vertexAI"
);

const CONFIG: VertexAIConfig = { project: "test-project" };

const PROFILE: ModelProfile = {
  modelName: "gemini-3.1-pro-preview",
  location: "global",
  temperature: 0,
};

const SCHEMA: GeminiSchema = {
  type: "object",
  properties: { clientFullName: { type: "string", nullable: true } },
};

const OPTIONS = {
  systemPrompt: "system",
  userPrompt: "user",
  responseSchema: SCHEMA,
};

beforeEach(() => {
  sdk.constructorArgs.length = 0;
  transportMocks.analyzeApplicationPdfWithVertex.mockResolvedValue({
    data: { clientFullName: "Jane Doe" },
  });
});

describe("getVertexAIClient", () => {
  it("reuses one client for an identical project and location", () => {
    const first = getVertexAIClient(CONFIG, PROFILE);
    const second = getVertexAIClient({ ...CONFIG }, { ...PROFILE });

    expect(second).toBe(first);
  });

  it.each([
    ["project", { config: { project: "other-project" } }],
    ["location", { profile: { location: "us-central1" } }],
  ])("hands out a distinct client for a differing %s", (_label, overrides) => {
    const base = getVertexAIClient(CONFIG, PROFILE);

    const other = getVertexAIClient(
      { ...CONFIG, ...(overrides as { config?: VertexAIConfig }).config },
      { ...PROFILE, ...(overrides as { profile?: ModelProfile }).profile },
    );

    // A wrong cache key would hand one configuration's client to another caller.
    expect(other).not.toBe(base);
  });

  it("ignores model fields that do not affect the connection", () => {
    const base = getVertexAIClient(CONFIG, PROFILE);

    expect(
      getVertexAIClient(CONFIG, {
        ...PROFILE,
        modelName: "some-other-model",
        temperature: 0.9,
      }),
    ).toBe(base);
  });

  it("configures the SDK for Vertex with the project and location", () => {
    getVertexAIClient({ project: "fresh-project" }, PROFILE);

    expect(sdk.constructorArgs.at(-1)).toEqual({
      vertexai: true,
      project: "fresh-project",
      location: PROFILE.location,
    });
  });
});

describe("VertexAIClient.analyzeApplicationPdf", () => {
  it("compiles the response validator once per schema object", async () => {
    const client = new VertexAIClient(CONFIG);

    await client.analyzeApplicationPdf("pdf", OPTIONS);
    await client.analyzeApplicationPdf("pdf", { ...OPTIONS });

    const [first, second] =
      transportMocks.analyzeApplicationPdfWithVertex.mock.calls;
    expect(second?.[0].responseValidator).toBe(first?.[0].responseValidator);
  });

  it("does not share a validator across different schemas", async () => {
    const client = new VertexAIClient(CONFIG);
    const otherSchema: GeminiSchema = {
      type: "object",
      properties: { idocNumber: { type: "string", nullable: true } },
    };

    await client.analyzeApplicationPdf("pdf", OPTIONS);
    await client.analyzeApplicationPdf("pdf", {
      ...OPTIONS,
      responseSchema: otherSchema,
    });

    const [first, second] =
      transportMocks.analyzeApplicationPdfWithVertex.mock.calls;
    expect(second?.[0].responseValidator).not.toBe(
      first?.[0].responseValidator,
    );
  });

  it("hands the transport the pooled client and its own config", async () => {
    const client = new VertexAIClient(CONFIG);

    await expect(client.analyzeApplicationPdf("pdf", OPTIONS)).resolves.toEqual(
      { data: { clientFullName: "Jane Doe" } },
    );

    const [deps, pdfBase64, options] =
      transportMocks.analyzeApplicationPdfWithVertex.mock.calls[0] ?? [];
    expect(deps.client).toBe(getVertexAIClient(CONFIG, PROFILE));
    expect(deps.config).toBe(CONFIG);
    expect(pdfBase64).toBe("pdf");
    expect(options).toBe(OPTIONS);
  });
});
