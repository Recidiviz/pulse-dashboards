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

import { beforeEach, describe, expect, test, vi } from "vitest";

import * as agents from "~@meetings/tasks/llm/evaluators/agents";
import {
  createEvaluatorClients,
  runAllEvaluators,
} from "~@meetings/tasks/llm/evaluators/orchestrator";
import type {
  EvaluationScores,
  EvaluatorClients,
  EvaluatorInputs,
  TextEvaluatorOutput,
  TranscriptComparisonOutput,
} from "~@meetings/tasks/llm/evaluators/schemas";
import { mockGemini } from "~@meetings/tasks/test/setup";

// Make traceable a passthrough so runAllEvaluators can be called in tests
// without a LangSmith client being configured.
vi.mock("langsmith/traceable", () => ({
  traceable: (fn: (...args: unknown[]) => unknown) => fn,
}));

const mockFileManager = { uploadFile: vi.fn(), getFile: vi.fn() } as never;

const mockClients: EvaluatorClients = {
  gemini: mockGemini,
  fileManager: mockFileManager,
  timeout: 1000,
};

const baseInputs: EvaluatorInputs = {
  audioBucket: "test-bucket",
  audioPath: "meetings/final.m4a",
  transcriptsByProvider: {
    assemblyai: "Speaker A: Hello.",
    deepgram: "A: Hello.",
  },
  bestTranscript: "Speaker A: Hello.",
  caseNote: "Officer met with client.",
  actionItems: [{ assignee: "Client", task: "Bring ID" }],
};

const GOOD_TEXT: TextEvaluatorOutput = {
  rationale: "Looks accurate.",
  grade: "GOOD",
  hallucinations: [],
  omissions: [],
};

const GOOD_COMPARISON: TranscriptComparisonOutput = {
  rationale: "AssemblyAI was better.",
  winner: "ASSEMBLYAI",
  assemblyAiGrade: "GOOD",
  deepgramGrade: "PARTIAL",
};

describe("runAllEvaluators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should return all scores when every evaluator succeeds", async () => {
    vi.spyOn(agents, "runTranscriptComparison").mockResolvedValue(
      GOOD_COMPARISON,
    );
    vi.spyOn(agents, "runCaseNote").mockResolvedValue(GOOD_TEXT);
    vi.spyOn(agents, "runActionItems").mockResolvedValue(GOOD_TEXT);
    vi.spyOn(agents, "runOverall").mockResolvedValue(GOOD_TEXT);

    const { scores } = await runAllEvaluators(mockClients, baseInputs);

    const expected: EvaluationScores = {
      transcriptComparison: GOOD_COMPARISON,
      caseNote: GOOD_TEXT,
      actionItems: GOOD_TEXT,
      overall: GOOD_TEXT,
    };

    expect(scores).toEqual(expected);
  });

  test("should return null for transcriptComparison when it fails", async () => {
    vi.spyOn(agents, "runTranscriptComparison").mockRejectedValue(
      new Error("audio upload failed"),
    );
    vi.spyOn(agents, "runCaseNote").mockResolvedValue(GOOD_TEXT);
    vi.spyOn(agents, "runActionItems").mockResolvedValue(GOOD_TEXT);
    vi.spyOn(agents, "runOverall").mockResolvedValue(GOOD_TEXT);

    const { scores } = await runAllEvaluators(mockClients, baseInputs);

    expect(scores.transcriptComparison).toBeNull();
    expect(scores.caseNote).toEqual(GOOD_TEXT);
    expect(scores.actionItems).toEqual(GOOD_TEXT);
    expect(scores.overall).toEqual(GOOD_TEXT);
  });

  test("should return null for caseNote when it fails", async () => {
    vi.spyOn(agents, "runTranscriptComparison").mockResolvedValue(
      GOOD_COMPARISON,
    );
    vi.spyOn(agents, "runCaseNote").mockRejectedValue(
      new Error("Gemini timeout"),
    );
    vi.spyOn(agents, "runActionItems").mockResolvedValue(GOOD_TEXT);
    vi.spyOn(agents, "runOverall").mockResolvedValue(GOOD_TEXT);

    const { scores } = await runAllEvaluators(mockClients, baseInputs);

    expect(scores.transcriptComparison).toEqual(GOOD_COMPARISON);
    expect(scores.caseNote).toBeNull();
    expect(scores.actionItems).toEqual(GOOD_TEXT);
  });

  test("should return null for all scores when all evaluators fail", async () => {
    vi.spyOn(agents, "runTranscriptComparison").mockRejectedValue(
      new Error("fail"),
    );
    vi.spyOn(agents, "runCaseNote").mockRejectedValue(new Error("fail"));
    vi.spyOn(agents, "runActionItems").mockRejectedValue(new Error("fail"));
    vi.spyOn(agents, "runOverall").mockRejectedValue(new Error("fail"));

    const { scores } = await runAllEvaluators(mockClients, baseInputs);

    expect(scores).toEqual({
      transcriptComparison: null,
      caseNote: null,
      actionItems: null,
      overall: null,
    });
  });

  test("should still run remaining evaluators after an earlier one fails", async () => {
    vi.spyOn(agents, "runTranscriptComparison").mockRejectedValue(
      new Error("fail"),
    );
    const caseNoteSpy = vi
      .spyOn(agents, "runCaseNote")
      .mockResolvedValue(GOOD_TEXT);
    const actionItemsSpy = vi
      .spyOn(agents, "runActionItems")
      .mockResolvedValue(GOOD_TEXT);
    const overallSpy = vi
      .spyOn(agents, "runOverall")
      .mockResolvedValue(GOOD_TEXT);

    await runAllEvaluators(mockClients, baseInputs);

    expect(caseNoteSpy).toHaveBeenCalledTimes(1);
    expect(actionItemsSpy).toHaveBeenCalledTimes(1);
    expect(overallSpy).toHaveBeenCalledTimes(1);
  });

  test("should pass timeout from clients to each agent call", async () => {
    const transcriptSpy = vi
      .spyOn(agents, "runTranscriptComparison")
      .mockResolvedValue(GOOD_COMPARISON);
    const caseNoteSpy = vi
      .spyOn(agents, "runCaseNote")
      .mockResolvedValue(GOOD_TEXT);
    vi.spyOn(agents, "runActionItems").mockResolvedValue(GOOD_TEXT);
    vi.spyOn(agents, "runOverall").mockResolvedValue(GOOD_TEXT);

    const clientsWithTimeout: EvaluatorClients = {
      ...mockClients,
      timeout: 99000,
    };

    await runAllEvaluators(clientsWithTimeout, baseInputs);

    // Fourth argument to runTranscriptComparison is the timeout
    expect(transcriptSpy.mock.calls[0]?.[3]).toBe(99000);
    // Third argument to runCaseNote is the timeout
    expect(caseNoteSpy.mock.calls[0]?.[2]).toBe(99000);
  });

  test("should pass inputs correctly to runTranscriptComparison", async () => {
    const transcriptSpy = vi
      .spyOn(agents, "runTranscriptComparison")
      .mockResolvedValue(GOOD_COMPARISON);
    vi.spyOn(agents, "runCaseNote").mockResolvedValue(GOOD_TEXT);
    vi.spyOn(agents, "runActionItems").mockResolvedValue(GOOD_TEXT);
    vi.spyOn(agents, "runOverall").mockResolvedValue(GOOD_TEXT);

    await runAllEvaluators(mockClients, baseInputs);

    expect(transcriptSpy).toHaveBeenCalledWith(
      mockGemini,
      mockFileManager,
      {
        audioBucket: baseInputs.audioBucket,
        audioPath: baseInputs.audioPath,
        transcriptsByProvider: baseInputs.transcriptsByProvider,
      },
      mockClients.timeout,
    );
  });
});

describe("createEvaluatorClients", () => {
  const originalKey = process.env["GOOGLE_API_KEY"];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should throw when GOOGLE_API_KEY is not set", () => {
    delete process.env["GOOGLE_API_KEY"];

    expect(() => createEvaluatorClients()).toThrow(
      "Missing GOOGLE_API_KEY environment variable",
    );

    process.env["GOOGLE_API_KEY"] = originalKey;
  });

  test("should return clients when GOOGLE_API_KEY is set", () => {
    process.env["GOOGLE_API_KEY"] = "test-key";

    const clients = createEvaluatorClients();

    expect(clients.gemini).toBeDefined();
    expect(clients.fileManager).toBeDefined();
    expect(clients.timeout).toBe(1800000);

    process.env["GOOGLE_API_KEY"] = originalKey;
  });
});
