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

import type { GoogleGenAI } from "@google/genai";
import { RunTree } from "langsmith";
import { wrapOpenAI } from "langsmith/wrappers";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type MockInstance,
  test,
  vi,
} from "vitest";
import { z } from "zod";

import { SpecialistCore } from "~@meetings/tasks/llm/agents";
import { generateContentWithZodSchema } from "~@meetings/tasks/llm/clients/gemini";
import { runAllEvaluators } from "~@meetings/tasks/llm/evaluators/orchestrator";
import type { EvaluatorInputs } from "~@meetings/tasks/llm/evaluators/schemas";
import { isTracingEnabledForState } from "~@meetings/tasks/llm/tracing";

vi.mock("langsmith/wrappers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("langsmith/wrappers")>()),
  wrapOpenAI: vi.fn((client: unknown) => client),
}));

// A plain object rather than the shared mockGemini: that mock answers every
// property name, so langsmith mistakes it for a LangChain run config when it is
// a traced function's first argument.
const gemini = {
  models: {
    generateContent: vi
      .fn()
      .mockRejectedValue(new Error("Gemini is offline in tests")),
  },
} as unknown as GoogleGenAI;

const evaluatorInputs: EvaluatorInputs = {
  audioBucket: "test-bucket",
  audioPath: "meetings/final.m4a",
  transcriptsByProvider: { assemblyai: "Speaker A: Hello." },
  bestTranscript: "Speaker A: Hello.",
  caseNote: "Officer met with client.",
  actionItems: [],
};

describe("isTracingEnabledForState", () => {
  test("is false for US_CO only", () => {
    expect(isTracingEnabledForState("US_CO")).toBe(false);
    expect(isTracingEnabledForState("US_NE")).toBe(true);
  });
});

describe("LangSmith tracing by state", () => {
  let postRun: MockInstance<RunTree["postRun"]>;

  beforeEach(() => {
    vi.stubEnv("LANGCHAIN_TRACING_V2", "true");
    postRun = vi
      .spyOn(RunTree.prototype, "postRun")
      .mockResolvedValue(undefined);
    vi.spyOn(RunTree.prototype, "patchRun").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.mocked(wrapOpenAI).mockClear();
  });

  test("SpecialistCore.factory traces OpenAI calls for other states only", () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("GOOGLE_CLOUD_PROJECT", "test-project");
    vi.stubEnv("LANGSMITH_API_KEY", "test-langsmith-key");

    SpecialistCore.factory("US_CO");
    expect(wrapOpenAI).not.toHaveBeenCalled();

    SpecialistCore.factory("US_NE");
    expect(wrapOpenAI).toHaveBeenCalledTimes(1);
  });

  test("SpecialistCore traces its Gemini call only when tracingEnabled", async () => {
    const openai = { baseURL: "https://us.api.openai.com/v1" } as never;
    const transcript = {
      rawText: "Speaker A: Bring your ID next time.",
      startTime: "2025-01-15T15:00:00.000Z",
      durationSeconds: 60,
      poNotes: "",
    };
    const facts = {
      actionItems: [
        {
          assignee: "Client" as const,
          task: "Bring ID",
          deadline: null,
          context: null,
          evidenceQuotes: [],
        },
      ],
      entities: [],
    };
    const person = { pseudonymizedId: "PSEUDO_1", stateCode: "US_XX" } as never;

    await new SpecialistCore({
      openai,
      gemini,
      tracingEnabled: false,
    }).runVerification(transcript, facts, person);
    expect(postRun).not.toHaveBeenCalled();

    await new SpecialistCore({ openai, gemini }).runVerification(
      transcript,
      facts,
      person,
    );
    expect(postRun).toHaveBeenCalledTimes(1);
  });

  test("generateContentWithZodSchema is traced unless tracingEnabled is false", async () => {
    const options = {
      client: gemini,
      systemInstruction: "Return an empty object.",
      parts: "Hello",
      schema: z.object({}),
    };

    await expect(
      generateContentWithZodSchema({ ...options, tracingEnabled: false }),
    ).rejects.toThrow();
    expect(postRun).not.toHaveBeenCalled();

    await expect(generateContentWithZodSchema(options)).rejects.toThrow();
    expect(postRun).toHaveBeenCalledTimes(1);
  });

  test("runAllEvaluators traces nothing at any depth when tracingEnabled is false", async () => {
    await runAllEvaluators({ gemini, tracingEnabled: false }, evaluatorInputs);
    expect(postRun).not.toHaveBeenCalled();

    await runAllEvaluators({ gemini }, evaluatorInputs);
    expect(postRun).toHaveBeenCalled();
  });
});
