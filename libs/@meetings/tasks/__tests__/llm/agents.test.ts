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

import { AgencyConfig } from "~@meetings/config/types";
import { Client, Resident } from "~@meetings/prisma/client";
import { SpecialistCore } from "~@meetings/tasks/llm/agents";
import {
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
    staffEmails: ["fake@fake.com"],
    lastImportedAt: new Date(0),
  };

  const mockResident: Resident = {
    personId: BigInt(67890),
    stablePersonExternalId: "EXT_456",
    stablePersonExternalIdType: "STATE_ID",
    pseudonymizedId: "PSEUDO_456",
    stateCode: "US_NE",
    givenNames: "Jane",
    middleNames: null,
    surname: "Smith",
    suffix: null,
    displayPersonExternalId: "ADC456",
    facilityId: "FACILITY_1",
    isActive: true,
    lastImportedAt: new Date(0),
  };

  const mockTranscript: TranscriptInput = {
    rawText:
      "[Officer]: How are you doing?\n[Client]: Good, I'm staying at my mom's place now.",
    recordingDate: "2025-01-15",
    durationSeconds: 300,
    poNotes: "Client seemed engaged",
  };

  const mockAgency: AgencyConfig = {
    baseVersion: 1,
    name: "Test Agency",
    stateCode: "US_XX",
    version: 1,
    showTranscriptions: true,
    showCNI: false,
    staffFeedbackEnabled: true,
    audioPlaybackEnabled: false,
    mobileAppEnabled: true,
    audioTTLDays: 30,
    transcriptTTLDays: 30,
    meetingTypes: [],
    glossary: {
      PO: "Probation Officer",
      UA: "Urinalysis",
    },
    rules: ["Document all interactions", "Note status changes"],
    keywords: [],
    outputs: [
      {
        id: "case_note",
        label: "Case Note",
        promptGuidance: "Brief summary",
        subheaders: ["Housing", "Mental Health"],
      },
    ],
    additionalOutputs: [],
    labels: {},
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
            deadline: null,
            context: null,
            evidenceQuotes: [],
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

    test("should throw on error", async () => {
      vi.mocked(mockOpenAI.chat.completions.create).mockRejectedValueOnce(
        new Error("API error"),
      );

      await expect(
        core.runExtraction(mockTranscript, mockClient, mockAgency),
      ).rejects.toThrow("API error");
    });

    describe("meeting type promptConfig", () => {
      const agencyWithPromptConfig: AgencyConfig = {
        ...mockAgency,
        meetingTypes: [
          {
            type: "Collateral Contact",
            promptConfig: {
              extractionNote: "The client was NOT present for this meeting.",
            },
            visible: true,
          },
        ],
      };

      const emptyExtractionResponse = {
        actionItems: [],
        entities: [],
      };

      test("should inject extractionNote when meetingType matches a configured type", async () => {
        vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
          id: "test-completion",
          object: "chat.completion",
          created: 0,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify(emptyExtractionResponse),
              },
              finish_reason: "stop",
            },
          ],
        } as never);

        await core.runExtraction(
          { ...mockTranscript, meetingType: "Collateral Contact" },
          mockClient,
          agencyWithPromptConfig,
        );

        expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                role: "user",
                content: expect.stringContaining(
                  "The client was NOT present for this meeting.",
                ),
              }),
            ]),
          }),
        );
      });

      test("should not inject extractionNote when transcript has no meetingType", async () => {
        vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
          id: "test-completion",
          object: "chat.completion",
          created: 0,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify(emptyExtractionResponse),
              },
              finish_reason: "stop",
            },
          ],
        } as never);

        await core.runExtraction(
          mockTranscript,
          mockClient,
          agencyWithPromptConfig,
        );

        const callArg = vi.mocked(mockOpenAI.chat.completions.create).mock
          .calls[0]?.[0] as { messages: { role: string; content: string }[] };
        const userContent =
          callArg.messages.find((m) => m.role === "user")?.content ?? "";
        expect(userContent).not.toContain("Meeting Type Context");
      });

      test("should not inject extractionNote when meetingType has no matching config", async () => {
        vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
          id: "test-completion",
          object: "chat.completion",
          created: 0,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify(emptyExtractionResponse),
              },
              finish_reason: "stop",
            },
          ],
        } as never);

        await core.runExtraction(
          { ...mockTranscript, meetingType: "Assessment" },
          mockClient,
          agencyWithPromptConfig,
        );

        const callArg = vi.mocked(mockOpenAI.chat.completions.create).mock
          .calls[0]?.[0] as { messages: { role: string; content: string }[] };
        const userContent =
          callArg.messages.find((m) => m.role === "user")?.content ?? "";
        expect(userContent).not.toContain("Meeting Type Context");
      });
    });
    describe("aliases", () => {
      const emptyExtractionResponse = {
        actionItems: [],
        entities: [],
      };

      const mockExtractionCompletion = () => {
        vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
          id: "test-completion",
          object: "chat.completion",
          created: 0,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify(emptyExtractionResponse),
              },
              finish_reason: "stop",
            },
          ],
        } as never);
      };

      const getSystemContent = () => {
        const callArg = vi.mocked(mockOpenAI.chat.completions.create).mock
          .calls[0]?.[0] as { messages: { role: string; content: string }[] };
        return callArg.messages.find((m) => m.role === "system")?.content ?? "";
      };

      test("should inject the client alias into the system prompt", async () => {
        mockExtractionCompletion();

        await core.runExtraction(mockTranscript, mockClient, {
          ...mockAgency,
          aliases: { client: "Homie" },
        });

        expect(getSystemContent()).toContain("Homie");
      });

      test("should inject the resident alias when the person is a Resident", async () => {
        mockExtractionCompletion();

        await core.runExtraction(mockTranscript, mockResident, {
          ...mockAgency,
          aliases: { resident: "Friend" },
        });

        expect(getSystemContent()).toContain("Friend");
      });

      test("should not inject the resident alias when the person is a Client", async () => {
        mockExtractionCompletion();

        await core.runExtraction(mockTranscript, mockClient, {
          ...mockAgency,
          aliases: { resident: "Friend" },
        });

        expect(getSystemContent()).not.toContain("Friend");
      });

      test("should inject the resident alias when explicitly set to its own default term", async () => {
        mockExtractionCompletion();

        await core.runExtraction(mockTranscript, mockResident, {
          ...mockAgency,
          aliases: { resident: "Resident" },
        });

        // The LLM's default term is always "Client", so setting the resident
        // alias to "Resident" is not a no-op — it should still be injected.
        expect(getSystemContent()).toContain('instead of "Client"');
      });

      test("should default to the Resident alias for a resident when the agency hasn't configured one", async () => {
        mockExtractionCompletion();

        await core.runExtraction(mockTranscript, mockResident, mockAgency);

        expect(getSystemContent()).toContain(
          'Use "Resident" instead of "Client"',
        );
      });

      test("should inject the staffMember and thirdParty aliases regardless of person type", async () => {
        mockExtractionCompletion();

        await core.runExtraction(mockTranscript, mockClient, {
          ...mockAgency,
          aliases: { staffMember: "Coach", thirdParty: "Collateral" },
        });

        const systemContent = getSystemContent();
        expect(systemContent).toContain("Coach");
        expect(systemContent).toContain("Collateral");
      });

      test("should not inject an alias rule when its value matches its own default term", async () => {
        mockExtractionCompletion();

        await core.runExtraction(mockTranscript, mockClient, {
          ...mockAgency,
          aliases: { client: "Client" },
        });

        // The ALIASES header appears whenever aliases are configured at all,
        // but no per-term bullet should be added for a no-op alias.
        expect(getSystemContent()).not.toContain('instead of "Client"');
      });

      test("should only inject the resident alias for a resident when both client and resident aliases are set", async () => {
        mockExtractionCompletion();

        await core.runExtraction(mockTranscript, mockResident, {
          ...mockAgency,
          aliases: { client: "Homie", resident: "Friend" },
        });

        const systemContent = getSystemContent();
        expect(systemContent).toContain('Use "Friend" instead of "Client"');
        expect(systemContent).not.toContain("Homie");
      });

      test("should not inject the resident alias when it is explicitly set to the prompt's default term", async () => {
        mockExtractionCompletion();

        await core.runExtraction(mockTranscript, mockResident, {
          ...mockAgency,
          aliases: { resident: "Client" },
        });

        // The prompt already refers to the person as "Client", so this alias is a no-op.
        expect(getSystemContent()).not.toContain("ALIASES");
      });

      test("should not include an ALIASES section when the agency has no aliases configured", async () => {
        mockExtractionCompletion();

        await core.runExtraction(mockTranscript, mockClient, mockAgency);

        expect(getSystemContent()).not.toContain("ALIASES");
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
        actionItems: [
          {
            assignee: "Client",
            task: "Submit documentation",
            deadline: null,
            context: null,
            evidenceQuotes: [],
          },
        ],
        entities: [],
      };

      const mockDrafting = {
        caseNote:
          "SUMMARY: Client meeting went well.\n\nHOUSING: Stable at mother's residence.",
        staffFeedback: { whatYouDidWell: [], growthOpportunities: [] },
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
                staffFeedback: { whatYouDidWell: [], growthOpportunities: [] },
              }),
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      await core.runDrafting(
        mockTranscript,
        { actionItems: [], entities: [] },
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
                staffFeedback: { whatYouDidWell: [], growthOpportunities: [] },
              }),
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      await core.runDrafting(
        mockTranscript,
        { actionItems: [], entities: [] },
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

    test("should include subheaders in user message when configured", async () => {
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
                staffFeedback: { whatYouDidWell: [], growthOpportunities: [] },
              }),
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      await core.runDrafting(
        mockTranscript,
        { actionItems: [], entities: [] },
        mockAgency, // has subheaders: ["Housing", "Mental Health"]
        mockClient,
      );

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              content: expect.stringContaining("Housing"),
            }),
          ]),
        }),
      );
    });

    test("should throw on error", async () => {
      vi.mocked(mockOpenAI.chat.completions.create).mockRejectedValueOnce(
        new Error("API error"),
      );

      await expect(
        core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          mockAgency,
          mockClient,
        ),
      ).rejects.toThrow("API error");
    });

    describe("meeting type promptConfig", () => {
      const agencyWithPromptConfig: AgencyConfig = {
        ...mockAgency,
        meetingTypes: [
          {
            type: "Collateral Contact",
            promptConfig: {
              caseNoteGuidance:
                "Document what the contact reported about the client.",
            },
            visible: true,
          },
        ],
      };

      const emptyDraftingResponse = {
        caseNote: "Test note",
        staffFeedback: { whatYouDidWell: [], growthOpportunities: [] },
      };

      test("should inject caseNoteGuidance when meetingType matches a configured type", async () => {
        vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
          id: "test-completion",
          object: "chat.completion",
          created: 0,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify(emptyDraftingResponse),
              },
              finish_reason: "stop",
            },
          ],
        } as never);

        await core.runDrafting(
          { ...mockTranscript, meetingType: "Collateral Contact" },
          { actionItems: [], entities: [] },
          agencyWithPromptConfig,
          mockClient,
        );

        expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                role: "user",
                content: expect.stringContaining(
                  "Document what the contact reported about the client.",
                ),
              }),
            ]),
          }),
        );
      });

      test("should not inject caseNoteGuidance when transcript has no meetingType", async () => {
        vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
          id: "test-completion",
          object: "chat.completion",
          created: 0,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify(emptyDraftingResponse),
              },
              finish_reason: "stop",
            },
          ],
        } as never);

        await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          agencyWithPromptConfig,
          mockClient,
        );

        const callArg = vi.mocked(mockOpenAI.chat.completions.create).mock
          .calls[0]?.[0] as { messages: { role: string; content: string }[] };
        const userContent =
          callArg.messages.find((m) => m.role === "user")?.content ?? "";
        expect(userContent).not.toContain("Meeting Type Context");
      });

      test("should not inject caseNoteGuidance when meetingType has no matching config", async () => {
        vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
          id: "test-completion",
          object: "chat.completion",
          created: 0,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify(emptyDraftingResponse),
              },
              finish_reason: "stop",
            },
          ],
        } as never);

        await core.runDrafting(
          { ...mockTranscript, meetingType: "Assessment" },
          { actionItems: [], entities: [] },
          agencyWithPromptConfig,
          mockClient,
        );

        const callArg = vi.mocked(mockOpenAI.chat.completions.create).mock
          .calls[0]?.[0] as { messages: { role: string; content: string }[] };
        const userContent =
          callArg.messages.find((m) => m.role === "user")?.content ?? "";
        expect(userContent).not.toContain("Meeting Type Context");
      });

      test("should only inject caseNoteGuidance into case_note output, not other outputs", async () => {
        const agencyWithMultipleOutputs: AgencyConfig = {
          ...agencyWithPromptConfig,
          outputs: [
            {
              id: "case_note",
              label: "Case Note",
              promptGuidance: "Write the case note here.",
            },
            {
              id: "minutes",
              label: "Meeting Minutes",
              promptGuidance: "Summarize the meeting.",
            },
          ],
        };

        vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
          id: "test-completion",
          object: "chat.completion",
          created: 0,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify(emptyDraftingResponse),
              },
              finish_reason: "stop",
            },
          ],
        } as never);

        await core.runDrafting(
          { ...mockTranscript, meetingType: "Collateral Contact" },
          { actionItems: [], entities: [] },
          agencyWithMultipleOutputs,
          mockClient,
        );

        const callArg = vi.mocked(mockOpenAI.chat.completions.create).mock
          .calls[0]?.[0] as { messages: { role: string; content: string }[] };
        const userContent =
          callArg.messages.find((m) => m.role === "user")?.content ?? "";

        // Guidance appears once (for case_note), not duplicated into minutes
        const occurrences = (
          userContent.match(/Document what the contact reported/g) ?? []
        ).length;
        expect(occurrences).toBe(1);
      });
    });

    describe("additionalOutputs", () => {
      const agencyWithAdditionalOutput: AgencyConfig = {
        ...mockAgency,
        additionalOutputs: [
          {
            id: "success_plan",
            label: "Suggested Success Plan Updates",
            promptGuidance: "Suggest a success plan if relevant.",
          },
        ],
      };

      test("should include the additional output's guidance in the system prompt", async () => {
        vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
          id: "test-completion",
          object: "chat.completion",
          created: 0,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify({
                  caseNote: "Test note",
                  staffFeedback: {
                    whatYouDidWell: [],
                    growthOpportunities: [],
                  },
                  success_plan: "",
                }),
              },
              finish_reason: "stop",
            },
          ],
        } as never);

        await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          agencyWithAdditionalOutput,
          mockClient,
        );

        expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                role: "system",
                content: expect.stringContaining(
                  "Suggest a success plan if relevant.",
                ),
              }),
            ]),
          }),
        );
      });

      test("should not include an additional outputs section when the agency has none configured", async () => {
        vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
          id: "test-completion",
          object: "chat.completion",
          created: 0,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify({
                  caseNote: "Test note",
                  staffFeedback: {
                    whatYouDidWell: [],
                    growthOpportunities: [],
                  },
                }),
              },
              finish_reason: "stop",
            },
          ],
        } as never);

        await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          mockAgency,
          mockClient,
        );

        const callArg = vi.mocked(mockOpenAI.chat.completions.create).mock
          .calls[0]?.[0] as { messages: { role: string; content: string }[] };
        const systemContent =
          callArg.messages.find((m) => m.role === "system")?.content ?? "";
        expect(systemContent).not.toContain("ADDITIONAL OUTPUTS");
      });

      test("should append non-empty additional output content onto caseNote with a CAPS-LABEL header", async () => {
        vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
          id: "test-completion",
          object: "chat.completion",
          created: 0,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify({
                  caseNote: "SUMMARY: Routine check-in.",
                  staffFeedback: {
                    whatYouDidWell: [],
                    growthOpportunities: [],
                  },
                  success_plan:
                    "Focus Area: HOUSING\nWhat do I want to be different: ...",
                }),
              },
              finish_reason: "stop",
            },
          ],
        } as never);

        const result = await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          agencyWithAdditionalOutput,
          mockClient,
        );

        expect(result.caseNote).toBe(
          "SUMMARY: Routine check-in.\n\nSUGGESTED SUCCESS PLAN UPDATES:\nFocus Area: HOUSING\nWhat do I want to be different: ...",
        );
      });

      test("should not append anything when the model returns an empty string for the additional output", async () => {
        vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
          id: "test-completion",
          object: "chat.completion",
          created: 0,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify({
                  caseNote: "SUMMARY: Routine check-in.",
                  staffFeedback: {
                    whatYouDidWell: [],
                    growthOpportunities: [],
                  },
                  success_plan: "",
                }),
              },
              finish_reason: "stop",
            },
          ],
        } as never);

        const result = await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          agencyWithAdditionalOutput,
          mockClient,
        );

        expect(result.caseNote).toBe("SUMMARY: Routine check-in.");
      });
    });

    describe("aliases", () => {
      const emptyDraftingResponse = {
        caseNote: "Test note",
        staffFeedback: { whatYouDidWell: [], growthOpportunities: [] },
      };

      const mockDraftingCompletion = () => {
        vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
          id: "test-completion",
          object: "chat.completion",
          created: 0,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify(emptyDraftingResponse),
              },
              finish_reason: "stop",
            },
          ],
        } as never);
      };

      const getUserContent = () => {
        const callArg = vi.mocked(mockOpenAI.chat.completions.create).mock
          .calls[0]?.[0] as { messages: { role: string; content: string }[] };
        return callArg.messages.find((m) => m.role === "user")?.content ?? "";
      };

      test("should inject the staffMember and thirdParty aliases into the user message", async () => {
        mockDraftingCompletion();

        await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          {
            ...mockAgency,
            aliases: { staffMember: "Coach", thirdParty: "Collateral" },
          },
          mockClient,
        );

        const userContent = getUserContent();
        expect(userContent).toContain("Coach");
        expect(userContent).toContain("Collateral");
      });

      test("should not inject an alias rule when its value matches its own default term", async () => {
        mockDraftingCompletion();

        await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          {
            ...mockAgency,
            aliases: { client: "Client", resident: "Resident" },
          },
          mockClient,
        );

        // The ALIASES header appears whenever aliases are configured at all,
        // but no per-term bullet should be added for a no-op alias.
        const userContent = getUserContent();
        expect(userContent).not.toContain('instead of "Client"');
        expect(userContent).not.toContain('instead of "Resident"');
      });

      test("should inject the resident alias when explicitly set to its own default term", async () => {
        mockDraftingCompletion();

        await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          { ...mockAgency, aliases: { resident: "Resident" } },
          mockResident,
        );

        // The LLM's default term is always "Client", so setting the resident
        // alias to "Resident" is not a no-op — it should still be injected.
        expect(getUserContent()).toContain('instead of "Client"');
      });

      test("should not inject the resident alias when the person is a Client", async () => {
        mockDraftingCompletion();

        await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          { ...mockAgency, aliases: { resident: "Friend" } },
          mockClient,
        );

        expect(getUserContent()).not.toContain("Friend");
      });

      test("should default to the Resident alias for a resident when the agency hasn't configured one", async () => {
        mockDraftingCompletion();

        await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          mockAgency,
          mockResident,
        );

        expect(getUserContent()).toContain(
          'Use "Resident" instead of "Client"',
        );
      });

      test("should inject the client alias when the person is a Client", async () => {
        mockDraftingCompletion();

        await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          { ...mockAgency, aliases: { client: "Homie" } },
          mockClient,
        );

        expect(getUserContent()).toContain('Use "Homie" instead of "Client"');
      });

      test("should only inject the resident alias for a resident when both client and resident aliases are set", async () => {
        mockDraftingCompletion();

        await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          { ...mockAgency, aliases: { client: "Homie", resident: "Friend" } },
          mockResident,
        );

        const userContent = getUserContent();
        expect(userContent).toContain('Use "Friend" instead of "Client"');
        expect(userContent).not.toContain("Homie");
      });

      test("should not inject the resident alias when it is explicitly set to the prompt's default term", async () => {
        mockDraftingCompletion();

        await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          { ...mockAgency, aliases: { resident: "Client" } },
          mockResident,
        );

        // The prompt already refers to the person as "Client", so this alias is a no-op.
        expect(getUserContent()).not.toContain("ALIASES");
      });

      test("should not include an ALIASES section when the agency has no aliases configured", async () => {
        mockDraftingCompletion();

        await core.runDrafting(
          mockTranscript,
          { actionItems: [], entities: [] },
          mockAgency,
          mockClient,
        );

        expect(getUserContent()).not.toContain("ALIASES");
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
          {
            assignee: "Client",
            task: "Submit proof of residence",
            deadline: null,
            context: null,
            evidenceQuotes: [],
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

      expect(result.actionItems[0]?.evidenceQuotes).toEqual([
        "I'll get that proof to you by Friday",
      ]);
      expect(result.actionItems[0]?.context).toBeNull();
    });

    test("should skip verification when no claims exist", async () => {
      const emptyExtraction: ExtractionOutput = {
        actionItems: [],
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
        actionItems: [
          {
            assignee: "Client",
            task: "Complete form",
            deadline: null,
            context: null,
            evidenceQuotes: [],
          },
        ],
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
        actionItems: [
          {
            assignee: "Staff Member",
            task: "Follow up with provider",
            deadline: null,
            context: null,
            evidenceQuotes: [],
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
    });
  });
});
