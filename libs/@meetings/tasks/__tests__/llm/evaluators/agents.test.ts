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

import type { MockInstance } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ZodSchema } from "zod";

import type { ZodGenerateContentOptions } from "~@meetings/tasks/llm/clients/gemini";
import * as geminiClient from "~@meetings/tasks/llm/clients/gemini";
import {
  runActionItems,
  runCaseNote,
  runOverall,
  runTranscriptComparison,
} from "~@meetings/tasks/llm/evaluators/agents";
import type {
  EvaluatorInputs,
  TextEvaluatorOutput,
  TranscriptComparisonOutput,
} from "~@meetings/tasks/llm/evaluators/schemas";
import { mockGemini } from "~@meetings/tasks/test/setup";

// Make traceable a passthrough so we can call the wrapped agents in tests
// without a LangSmith client being configured.
vi.mock("langsmith/traceable", () => ({
  traceable: (fn: (...args: unknown[]) => unknown) => fn,
}));

type GenerateSpy = MockInstance<
  (opts: ZodGenerateContentOptions<ZodSchema>) => Promise<unknown>
>;

function spyOnGenerate() {
  return vi.spyOn(
    geminiClient,
    "generateContentWithZodSchema",
  ) as unknown as GenerateSpy;
}

const mockFileManager = {
  uploadFile: vi.fn(),
  getFile: vi.fn(),
} as never;

const GOOD_TEXT_RESULT: TextEvaluatorOutput = {
  rationale: "Accurate and complete.",
  grade: "GOOD",
  hallucinations: [],
  omissions: [],
};

const baseInputs: EvaluatorInputs = {
  audioBucket: "test-bucket",
  audioPath: "meetings/final.m4a",
  transcriptsByProvider: {
    assemblyai: "Speaker A: Hello.\nSpeaker B: Hi.",
    deepgram: "A: Hello.\nB: Hi.",
  },
  bestTranscript: "Speaker A: Hello.\nSpeaker B: Hi.",
  caseNote: "Client greeted officer warmly.",
  actionItems: [{ assignee: "Client", task: "Submit proof of address" }],
};

describe("Evaluator Agents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runTranscriptComparison", () => {
    test("should return SINGLE_PROVIDER when assemblyai transcript is missing", async () => {
      const result = await runTranscriptComparison(
        mockGemini,
        mockFileManager,
        {
          audioBucket: "test-bucket",
          audioPath: "meetings/final.m4a",
          transcriptsByProvider: { deepgram: "Deepgram transcript only." },
        },
      );

      expect(result.winner).toBe("SINGLE_PROVIDER");
      expect(result.assemblyAiGrade).toBe("NONE");
      expect(result.deepgramGrade).toBe("NONE");
    });

    test("should return SINGLE_PROVIDER when deepgram transcript is missing", async () => {
      const result = await runTranscriptComparison(
        mockGemini,
        mockFileManager,
        {
          audioBucket: "test-bucket",
          audioPath: "meetings/final.m4a",
          transcriptsByProvider: { assemblyai: "AssemblyAI transcript only." },
        },
      );

      expect(result.winner).toBe("SINGLE_PROVIDER");
    });

    test("should return SINGLE_PROVIDER when both transcripts are missing", async () => {
      const result = await runTranscriptComparison(
        mockGemini,
        mockFileManager,
        {
          audioBucket: "test-bucket",
          audioPath: "meetings/final.m4a",
          transcriptsByProvider: {},
        },
      );

      expect(result.winner).toBe("SINGLE_PROVIDER");
    });

    test("should call uploadAudioToGemini and generateContentWithZodSchema when both transcripts are present", async () => {
      const expectedComparison: TranscriptComparisonOutput = {
        rationale: "AssemblyAI was more accurate.",
        winner: "ASSEMBLYAI",
        assemblyAiGrade: "GOOD",
        deepgramGrade: "PARTIAL",
      };

      vi.spyOn(geminiClient, "uploadAudioToGemini").mockResolvedValue({
        uri: "gs://gemini-files/audio-123",
        mimeType: "audio/m4a",
      });
      spyOnGenerate().mockResolvedValue(expectedComparison);

      const result = await runTranscriptComparison(
        mockGemini,
        mockFileManager,
        {
          audioBucket: baseInputs.audioBucket,
          audioPath: baseInputs.audioPath,
          transcriptsByProvider: baseInputs.transcriptsByProvider,
        },
      );

      expect(geminiClient.uploadAudioToGemini).toHaveBeenCalledWith(
        mockFileManager,
        baseInputs.audioBucket,
        baseInputs.audioPath,
      );
      expect(geminiClient.generateContentWithZodSchema).toHaveBeenCalled();
      expect(result).toEqual(expectedComparison);
    });

    test("should forward the timeout to generateContentWithZodSchema", async () => {
      vi.spyOn(geminiClient, "uploadAudioToGemini").mockResolvedValue({
        uri: "gs://gemini-files/audio-123",
        mimeType: "audio/m4a",
      });
      const generateSpy = spyOnGenerate().mockResolvedValue({
        rationale: "ok",
        winner: "ABOUT_THE_SAME",
        assemblyAiGrade: "GOOD",
        deepgramGrade: "GOOD",
      } satisfies TranscriptComparisonOutput);

      await runTranscriptComparison(
        mockGemini,
        mockFileManager,
        {
          audioBucket: baseInputs.audioBucket,
          audioPath: baseInputs.audioPath,
          transcriptsByProvider: baseInputs.transcriptsByProvider,
        },
        30000,
      );

      expect(generateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 30000 }),
      );
    });

    test("should include both transcript texts in the user prompt parts", async () => {
      vi.spyOn(geminiClient, "uploadAudioToGemini").mockResolvedValue({
        uri: "gs://files/audio",
        mimeType: "audio/mp4",
      });
      const generateSpy = spyOnGenerate().mockResolvedValue({
        rationale: "ok",
        winner: "DEEPGRAM",
        assemblyAiGrade: "PARTIAL",
        deepgramGrade: "GOOD",
      } satisfies TranscriptComparisonOutput);

      await runTranscriptComparison(mockGemini, mockFileManager, {
        audioBucket: "bucket",
        audioPath: "path.m4a",
        transcriptsByProvider: {
          assemblyai: "AssemblyAI text here",
          deepgram: "Deepgram text here",
        },
      });

      const callArgs = generateSpy.mock.calls[0]?.[0];
      const parts = callArgs?.parts;
      expect(Array.isArray(parts)).toBe(true);
      // second part should be the text prompt containing both transcripts
      const textPart = (parts as Array<{ text?: string }>).find(
        (p) => p.text !== undefined,
      );
      expect(textPart?.text).toContain("AssemblyAI text here");
      expect(textPart?.text).toContain("Deepgram text here");
    });
  });

  describe("runCaseNote", () => {
    test("should call generateContentWithZodSchema with transcript and case note", async () => {
      const generateSpy = spyOnGenerate().mockResolvedValue(GOOD_TEXT_RESULT);

      const result = await runCaseNote(mockGemini, {
        bestTranscript: baseInputs.bestTranscript,
        caseNote: baseInputs.caseNote,
        meetingContext: undefined,
      });

      expect(generateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          client: mockGemini,
          schema: expect.any(Object),
        }),
      );
      expect(result).toEqual(GOOD_TEXT_RESULT);
    });

    test("should pass meeting context to the prompt", async () => {
      const generateSpy = spyOnGenerate().mockResolvedValue(GOOD_TEXT_RESULT);

      await runCaseNote(mockGemini, {
        bestTranscript: baseInputs.bestTranscript,
        caseNote: baseInputs.caseNote,
        meetingContext: {
          personName: "John Doe",
          staffEmail: "officer@agency.gov",
        },
      });

      const callArgs = generateSpy.mock.calls[0]?.[0];
      expect(String(callArgs?.parts)).toContain("John Doe");
    });

    test("should forward timeout", async () => {
      const generateSpy = spyOnGenerate().mockResolvedValue(GOOD_TEXT_RESULT);

      await runCaseNote(
        mockGemini,
        {
          bestTranscript: baseInputs.bestTranscript,
          caseNote: baseInputs.caseNote,
        },
        5000,
      );

      expect(generateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 5000 }),
      );
    });
  });

  describe("runActionItems", () => {
    test("should call generateContentWithZodSchema with JSON-serialized action items", async () => {
      const generateSpy = spyOnGenerate().mockResolvedValue(GOOD_TEXT_RESULT);

      await runActionItems(mockGemini, {
        bestTranscript: baseInputs.bestTranscript,
        actionItems: baseInputs.actionItems,
        meetingContext: undefined,
      });

      const callArgs = generateSpy.mock.calls[0]?.[0];
      expect(String(callArgs?.parts)).toContain("Submit proof of address");
    });

    test("should forward timeout", async () => {
      const generateSpy = spyOnGenerate().mockResolvedValue(GOOD_TEXT_RESULT);

      await runActionItems(
        mockGemini,
        {
          bestTranscript: baseInputs.bestTranscript,
          actionItems: [],
        },
        8000,
      );

      expect(generateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 8000 }),
      );
    });
  });

  describe("runOverall", () => {
    test("should call generateContentWithZodSchema with all output sections", async () => {
      const generateSpy = spyOnGenerate().mockResolvedValue(GOOD_TEXT_RESULT);

      await runOverall(mockGemini, {
        bestTranscript: baseInputs.bestTranscript,
        caseNote: baseInputs.caseNote,
        actionItems: baseInputs.actionItems,
        meetingContext: undefined,
      });

      const callArgs = generateSpy.mock.calls[0]?.[0];
      const partsStr = String(callArgs?.parts);
      expect(partsStr).toContain(baseInputs.caseNote);
      expect(partsStr).toContain("Submit proof of address");
    });

    test("should forward timeout", async () => {
      const generateSpy = spyOnGenerate().mockResolvedValue(GOOD_TEXT_RESULT);

      await runOverall(
        mockGemini,
        {
          bestTranscript: "transcript",
          caseNote: "note",
          actionItems: [],
        },
        20000,
      );

      expect(generateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 20000 }),
      );
    });

    test("should include meeting context in prompt when provided", async () => {
      const generateSpy = spyOnGenerate().mockResolvedValue(GOOD_TEXT_RESULT);

      await runOverall(mockGemini, {
        bestTranscript: "transcript",
        caseNote: "note",
        actionItems: [],
        meetingContext: { staffNotes: "Client was late." },
      });

      const callArgs = generateSpy.mock.calls[0]?.[0];
      expect(String(callArgs?.parts)).toContain("Client was late.");
    });
  });
});
