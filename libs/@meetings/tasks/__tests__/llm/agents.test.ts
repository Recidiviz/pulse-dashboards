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

import { beforeEach, describe, expect, test, vi } from "vitest";

import { Client } from "~@meetings/prisma/client";
import { SpecialistCore } from "~@meetings/tasks/llm/agents";
import {
  AgencyConfig,
  ExtractionOutput,
  TranscriptInput,
} from "~@meetings/tasks/llm/schemas";
import { mockGemini, mockOpenAI } from "~@meetings/tasks/test/setup";

describe("SpecialistCore", () => {
  const mockClient: Client = {
    personId: BigInt(12345),
    stablePersonExternalId: "EXT_123",
    stablePersonExternalIdType: "STATE_ID",
    pseudonymizedId: "PSEUDO_123",
    stateCode: "US_NE",
    givenNames: "John",
    middleNames: null,
    surname: "Doe",
    suffix: null,
    displayPersonExternalId: "ADC123",
    supervisionType: "PAROLE",
    isActive: true,
  };

  const mockTranscript: TranscriptInput = {
    rawText:
      "[Officer]: How are you doing?\n[Client]: Good, I'm staying at my mom's place now.",
    recordingDate: "2025-01-15",
    durationSeconds: 300,
    poNotes: "Client seemed engaged",
  };

  const mockAgency: AgencyConfig = {
    agencyName: "Test Agency",
    glossary: {
      PO: "Probation Officer",
      UA: "Urinalysis",
    },
    operationalRules: ["Document all interactions", "Note status changes"],
    noteConfig: {
      structureName: "Standard",
      combineOutput: true,
      sections: [{ sectionId: "SUMMARY", instruction: "Brief summary" }],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Factory", () => {
    test("should throw error when OpenAI API key is missing", () => {
      const originalKey = process.env["OPENAI_API_KEY"];
      delete process.env["OPENAI_API_KEY"];

      expect(() => SpecialistCore.factory()).toThrow(
        "Missing API keys. Set OPENAI_API_KEY and GOOGLE_API_KEY environment variables.",
      );

      process.env["OPENAI_API_KEY"] = originalKey;
    });

    test("should throw error when Google API key is missing", () => {
      const originalKey = process.env["GOOGLE_API_KEY"];
      delete process.env["GOOGLE_API_KEY"];

      expect(() => SpecialistCore.factory()).toThrow(
        "Missing API keys. Set OPENAI_API_KEY and GOOGLE_API_KEY environment variables.",
      );

      process.env["GOOGLE_API_KEY"] = originalKey;
    });

    test("should create instance when API keys are present", () => {
      process.env["OPENAI_API_KEY"] = "test-openai-key";
      process.env["GOOGLE_API_KEY"] = "test-google-key";

      const instance = SpecialistCore.factory();

      expect(instance).toBeInstanceOf(SpecialistCore);
    });
  });

  describe("Constructor", () => {
    test("should throw error if OpenAI client is not US-based", () => {
      expect(() => {
        new SpecialistCore({
          openai: {
            ...mockOpenAI,
            baseURL: "https://api.openai.com/v1", // non-US URL
          } as never,
          gemini: mockGemini,
        });
      }).toThrow("Must use US-based OpenAI client");
    });

    test("should accept US-based OpenAI client", () => {
      const instance = new SpecialistCore({
        openai: {
          ...mockOpenAI,
          baseURL: "https://us.api.openai.com/v1",
        } as never,
        gemini: mockGemini,
      });

      expect(instance).toBeInstanceOf(SpecialistCore);
    });
  });

  describe("runExtraction", () => {
    let core: SpecialistCore;

    beforeEach(() => {
      core = new SpecialistCore({
        openai: {
          ...mockOpenAI,
          baseURL: "https://us.api.openai.com/v1",
        } as never,
        gemini: mockGemini,
      });
    });

    test("should successfully extract action items and updates", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [
          {
            assignee: "Client",
            task: "Submit proof of residence",
          },
        ],
        criticalUpdates: [
          {
            category: "Housing",
            updateType: "Change",
            details: "Living with mother",
          },
        ],
        entities: [
          {
            value: "123 Main St",
            entityKind: "Address",
          },
        ],
      };

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: "test-completion",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-4o-mini",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify(mockExtraction),
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      const result = await core.runExtraction(
        mockTranscript,
        mockClient,
        mockAgency,
      );

      expect(result).toEqual(mockExtraction);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "system" }),
            expect.objectContaining({ role: "user" }),
          ]),
        }),
      );
    });

    test("should include agency rules in user message", async () => {
      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: "test-completion",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-4o-mini",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({
                actionItems: [],
                criticalUpdates: [],
                entities: [],
              }),
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      await core.runExtraction(mockTranscript, mockClient, mockAgency);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              content: expect.stringContaining("Document all interactions"),
            }),
          ]),
        }),
      );
    });

    test("should return empty extraction on error", async () => {
      vi.mocked(mockOpenAI.chat.completions.create).mockRejectedValueOnce(
        new Error("API error"),
      );

      const result = await core.runExtraction(
        mockTranscript,
        mockClient,
        mockAgency,
      );

      expect(result).toEqual({
        actionItems: [],
        criticalUpdates: [],
        entities: [],
      });
    });
  });

  describe("runDrafting", () => {
    let core: SpecialistCore;

    beforeEach(() => {
      core = new SpecialistCore({
        openai: {
          ...mockOpenAI,
          baseURL: "https://us.api.openai.com/v1",
        } as never,
        gemini: mockGemini,
      });
    });

    test("should successfully draft case note and minutes", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [{ assignee: "Client", task: "Submit documentation" }],
        criticalUpdates: [],
        entities: [],
      };

      const mockDrafting = {
        caseNote:
          "SUMMARY: Client meeting went well.\n\nHOUSING: Stable at mother's residence.",
        minutes: [
          {
            title: "Check-In",
            items: [
              { content: "Client on time", status: "Discussed", subItems: [] },
            ],
          },
        ],
      };

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: "test-completion",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-4o-mini",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify(mockDrafting),
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      const result = await core.runDrafting(
        mockTranscript,
        mockExtraction,
        mockAgency,
        mockClient,
      );

      expect(result).toEqual(mockDrafting);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    test("should include glossary in user message", async () => {
      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: "test-completion",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-4o-mini",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({
                caseNote: "Test note",
                minutes: [],
              }),
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      await core.runDrafting(
        mockTranscript,
        { actionItems: [], criticalUpdates: [], entities: [] },
        mockAgency,
        mockClient,
      );

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              content: expect.stringContaining("PO: Probation Officer"),
            }),
          ]),
        }),
      );
    });

    test("should include client context in user message", async () => {
      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: "test-completion",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-4o-mini",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({
                caseNote: "Test note",
                minutes: [],
              }),
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      await core.runDrafting(
        mockTranscript,
        { actionItems: [], criticalUpdates: [], entities: [] },
        mockAgency,
        mockClient,
      );

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              content: expect.stringContaining("John Doe"),
            }),
          ]),
        }),
      );
    });

    test("should return error case note on error", async () => {
      vi.mocked(mockOpenAI.chat.completions.create).mockRejectedValueOnce(
        new Error("API error"),
      );

      const result = await core.runDrafting(
        mockTranscript,
        { actionItems: [], criticalUpdates: [], entities: [] },
        mockAgency,
        mockClient,
      );

      expect(result).toEqual({
        caseNote: "[Error]",
        minutes: [],
      });
    });
  });

  describe("runVerification", () => {
    let core: SpecialistCore;

    beforeEach(() => {
      core = new SpecialistCore({
        openai: {
          ...mockOpenAI,
          baseURL: "https://us.api.openai.com/v1",
        } as never,
        gemini: mockGemini,
      });
    });

    test("should successfully verify claims with evidence", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [
          { assignee: "Client", task: "Submit proof of residence" },
        ],
        criticalUpdates: [
          {
            category: "Housing",
            updateType: "Change",
            details: "Living with mother",
          },
        ],
        entities: [],
      };

      const mockVerification = {
        verifications: [
          {
            claimId: "ACT_0",
            evidenceQuotes: ["I'll get that proof to you by Friday"],
            confidence: "HIGH",
            ambiguity: "LOW",
          },
          {
            claimId: "UPD_0",
            evidenceQuotes: ["I'm staying at my mom's place now"],
            confidence: "HIGH",
            ambiguity: "LOW",
          },
        ],
      };

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockVerification),
        },
      });

      vi.mocked(mockGemini.getGenerativeModel).mockReturnValue({
        generateContent: mockGenerateContent,
      } as never);

      const result = await core.runVerification(
        mockTranscript,
        mockExtraction,
        mockClient,
      );

      expect(result.actionItems[0]?.context).toContain("[EVIDENCE]");
      expect(result.actionItems[0]?.context).toContain(
        "I'll get that proof to you by Friday",
      );
      expect(result.criticalUpdates[0]?.details).toContain("[EVIDENCE]");
    });

    test("should skip verification when no claims exist", async () => {
      const emptyExtraction: ExtractionOutput = {
        actionItems: [],
        criticalUpdates: [],
        entities: [],
      };

      const result = await core.runVerification(
        mockTranscript,
        emptyExtraction,
        mockClient,
      );

      expect(result).toEqual(emptyExtraction);
      expect(mockGemini.getGenerativeModel).not.toHaveBeenCalled();
    });

    test("should return unverified facts on error", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [{ assignee: "Client", task: "Complete form" }],
        criticalUpdates: [],
        entities: [],
      };

      const mockGenerateContent = vi
        .fn()
        .mockRejectedValue(new Error("API error"));

      vi.mocked(mockGemini.getGenerativeModel).mockReturnValue({
        generateContent: mockGenerateContent,
      } as never);

      const result = await core.runVerification(
        mockTranscript,
        mockExtraction,
        mockClient,
      );

      // Should return original extraction without evidence
      expect(result).toEqual(mockExtraction);
    });

    test("should format claims list with IDs", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [{ assignee: "PO", task: "Follow up with provider" }],
        criticalUpdates: [
          {
            category: "Employment",
            updateType: "New",
            details: "Started new job",
          },
        ],
        entities: [],
      };

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              verifications: [],
            }),
        },
      });

      vi.mocked(mockGemini.getGenerativeModel).mockReturnValue({
        generateContent: mockGenerateContent,
      } as never);

      await core.runVerification(mockTranscript, mockExtraction, mockClient);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("ID: ACT_0"),
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("ID: UPD_0"),
      );
    });
  });
});
