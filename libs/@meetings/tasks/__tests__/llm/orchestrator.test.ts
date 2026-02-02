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

import { beforeEach, describe, expect, MockInstance, test, vi } from "vitest";

import type { PrismaClient } from "~@meetings/prisma/client";
import { Client } from "~@meetings/prisma/client";
import { SpecialistCore } from "~@meetings/tasks/llm/agents";
import * as evaluationStore from "~@meetings/tasks/llm/evaluation-store";
import { ProductionPipeline } from "~@meetings/tasks/llm/orchestrator";
import {
  AgencyConfig,
  DraftingOutput,
  ExtractionOutput,
  TranscriptInput,
} from "~@meetings/tasks/llm/schemas";
import { mockGemini, mockOpenAI } from "~@meetings/tasks/test/setup";

describe("ProductionPipeline", () => {
  let mockCore: SpecialistCore;
  let mockPrisma: PrismaClient;

  const mockClient: Client = {
    personId: BigInt(67890),
    stablePersonExternalId: "EXT_456",
    stablePersonExternalIdType: "STATE_ID",
    pseudonymizedId: "PSEUDO_123",
    stateCode: "US_NE",
    givenNames: "Jane",
    middleNames: null,
    surname: "Smith",
    suffix: null,
    displayPersonExternalId: "ADC456",
    supervisionType: "PROBATION",
    isActive: true,
  };

  const mockAgency: AgencyConfig = {
    agencyName: "Test Probation Department",
    glossary: {
      PO: "Probation Officer",
      UA: "Urinalysis",
    },
    operationalRules: [
      "Document all client interactions",
      "Note changes in housing or employment",
    ],
    noteConfig: {
      structureName: "Standard Case Note",
      combineOutput: true,
      sections: [
        { sectionId: "SUMMARY", instruction: "Brief overview" },
        { sectionId: "DISCUSSION", instruction: "Detailed points" },
      ],
    },
  };

  const mockTranscript: TranscriptInput = {
    rawText:
      "[Officer]: Good morning, how are you?\n[Client]: I'm doing well. I started a new job last week.\n[Officer]: That's great! Tell me more about it.\n[Client]: It's at a local restaurant, working as a line cook. The hours are good and it pays $15 per hour.\n[Officer]: Excellent. How about your housing situation?\n[Client]: Still living with my sister. It's stable.\n[Officer]: Good. Make sure to bring proof of employment to our next meeting.\n[Client]: I will, I'll get a letter from my manager.",
    recordingDate: "2025-01-15",
    durationSeconds: 420,
    poNotes: "Client seemed positive about new employment",
  };

  beforeEach(() => {
    // Create a mock SpecialistCore instance for testing
    mockCore = new SpecialistCore({ openai: mockOpenAI, gemini: mockGemini });
    // Create mock Prisma client with methods we need
    mockPrisma = {
      notetakingPipelineRun: {
        create: vi.fn().mockResolvedValue({
          id: "pipeline-run-123",
          createdAt: new Date(),
          meetingId: "test-meeting",
          langsmithTraceId: "trace-789",
          personPseudonymizedId: "PSEUDO_123",
          status: "IN_PROGRESS",
          errorDetails: null,
        }),
        update: vi.fn().mockResolvedValue({
          id: "pipeline-run-123",
          createdAt: new Date(),
          meetingId: "test-meeting",
          langsmithTraceId: "trace-789",
          personPseudonymizedId: "PSEUDO_123",
          status: "SUCCESS",
          errorDetails: null,
        }),
      },
      notetakingAgentExecution: {
        create: vi.fn().mockResolvedValue({
          id: "agent-exec-123",
          createdAt: new Date(),
          pipelineRunId: "pipeline-run-123",
          agentType: "EXTRACTION",
          attemptNumber: 1,
          outputData: {},
          validationResult: {},
        }),
      },
    } as unknown as PrismaClient;
  });

  describe("Pipeline Execution", () => {
    test("should successfully run complete pipeline", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [
          {
            assignee: "Client",
            task: "Bring proof of employment",
          },
        ],
        criticalUpdates: [
          {
            category: "Employment",
            updateType: "New",
            details: "Started job at local restaurant as line cook",
          },
          {
            category: "Housing",
            updateType: "Stable/Status Quo",
            details: "Living with sister",
          },
        ],
        entities: [],
      };

      const mockDrafting: DraftingOutput = {
        caseNote:
          "EMPLOYMENT: Client reported starting new position as line cook at local restaurant earning $15/hour.\n\nHOUSING: Client remains in stable housing with sister.\n\nACTION ITEMS: Client to provide employment verification at next meeting.".repeat(
            5,
          ),
        minutes: [
          {
            title: "Check-In",
            items: [
              {
                content: "Client reported doing well",
                status: "Discussed",
                subItems: [],
              },
            ],
          },
          {
            title: "Discussion Log",
            items: [
              {
                content: "New employment at restaurant",
                status: "Discussed",
                subItems: [],
              },
              {
                content: "Housing remains stable",
                status: "Discussed",
                subItems: [],
              },
            ],
          },
          {
            title: "Logistics & Plan",
            items: [
              {
                content: "Bring proof of employment",
                status: "Assigned",
                subItems: [],
              },
            ],
          },
        ],
      };

      const mockVerifiedExtraction: ExtractionOutput = {
        ...mockExtraction,
        actionItems: [
          {
            ...(mockExtraction.actionItems[0] ?? {
              assignee: "Client" as const,
              task: "",
            }),
            context: `\n\n[EVIDENCE]:\n> "Make sure to bring proof of employment to our next meeting"`,
          },
        ],
      };

      // Mock the SpecialistCore methods
      vi.spyOn(SpecialistCore.prototype, "runExtraction").mockResolvedValue(
        mockExtraction,
      );
      vi.spyOn(SpecialistCore.prototype, "runDrafting").mockResolvedValue(
        mockDrafting,
      );
      vi.spyOn(SpecialistCore.prototype, "runVerification").mockResolvedValue(
        mockVerifiedExtraction,
      );

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);
      const result = await pipeline.run(
        mockAgency,
        mockClient,
        mockTranscript,
        "test-meeting-1",
      );

      expect(result).toEqual({
        caseNote: mockDrafting.caseNote,
        meetingMinutes: mockDrafting.minutes,
        actionItems: mockVerifiedExtraction.actionItems,
        statusUpdates: mockVerifiedExtraction.criticalUpdates,
      });
    });

    test("should fail gatekeeper check for insufficient word count", async () => {
      const shortTranscript: TranscriptInput = {
        rawText: "Too short",
        recordingDate: "2025-01-15",
        durationSeconds: 10,
        poNotes: "",
      };

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);

      await expect(
        pipeline.run(mockAgency, mockClient, shortTranscript, "test-meeting-2"),
      ).rejects.toThrow();
    });

    test("should retry drafting on validation failure", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [],
        criticalUpdates: [],
        entities: [],
      };

      // First drafting attempt fails validation (too short)
      const badDrafting: DraftingOutput = {
        caseNote: "Too short",
        minutes: [],
      };

      // Second attempt passes validation
      const goodDrafting: DraftingOutput = {
        caseNote:
          "SUMMARY: Client meeting conducted. Discussion covered multiple topics including housing, employment, and future planning.\n\nDISCUSSION: Client reported stable housing situation and recent employment changes. Planning was discussed for next steps.",
        minutes: [
          {
            title: "Check-In",
            items: [
              {
                content: "Opening discussion",
                status: "Discussed",
                subItems: [],
              },
            ],
          },
          {
            title: "Discussion",
            items: [
              { content: "Housing update", status: "Discussed", subItems: [] },
              {
                content: "Employment update",
                status: "Discussed",
                subItems: [],
              },
              {
                content: "Future planning",
                status: "Discussed",
                subItems: [],
              },
              {
                content: "Benefits discussion",
                status: "Discussed",
                subItems: [],
              },
              { content: "Next meeting", status: "Assigned", subItems: [] },
            ],
          },
        ],
      };

      vi.spyOn(SpecialistCore.prototype, "runExtraction").mockResolvedValue(
        mockExtraction,
      );
      const runDraftingSpy = vi
        .spyOn(SpecialistCore.prototype, "runDrafting")
        .mockResolvedValueOnce(badDrafting)
        .mockResolvedValueOnce(badDrafting)
        .mockResolvedValueOnce(goodDrafting);
      vi.spyOn(SpecialistCore.prototype, "runVerification").mockResolvedValue(
        mockExtraction,
      );

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);
      const result = await pipeline.run(
        mockAgency,
        mockClient,
        mockTranscript,
        "test-meeting-3",
      );

      // Should have been called 3 times (initial + 2 retries)
      expect(runDraftingSpy).toHaveBeenCalledTimes(3);
      expect(result.caseNote).toBe(goodDrafting.caseNote);
    });

    test("should use last draft after max retries exceeded", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [],
        criticalUpdates: [],
        entities: [],
      };

      // All drafting attempts fail validation
      const badDrafting: DraftingOutput = {
        caseNote: "Short",
        minutes: [],
      };

      vi.spyOn(SpecialistCore.prototype, "runExtraction").mockResolvedValue(
        mockExtraction,
      );
      const runDraftingSpy = vi
        .spyOn(SpecialistCore.prototype, "runDrafting")
        .mockResolvedValue(badDrafting)
        .mockResolvedValue(badDrafting)
        .mockResolvedValue(badDrafting);
      vi.spyOn(SpecialistCore.prototype, "runVerification").mockResolvedValue(
        mockExtraction,
      );

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);
      const result = await pipeline.run(
        mockAgency,
        mockClient,
        mockTranscript,
        "test-meeting-4",
      );

      // Should have been called: initial attempt + 2 retries
      expect(runDraftingSpy).toHaveBeenCalledTimes(3);
      expect(result.caseNote).toBe(badDrafting.caseNote);
    });

    test("should handle extraction with no action items", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [], // No action items found
        criticalUpdates: [
          {
            category: "Housing",
            updateType: "Stable/Status Quo",
            details: "No changes",
          },
        ],
        entities: [],
      };

      const mockDrafting: DraftingOutput = {
        caseNote:
          "SUMMARY: Routine check-in meeting conducted.\n\nHOUSING: Client housing remains stable with no changes reported.",
        minutes: [
          {
            title: "Discussion",
            items: Array(5).fill({
              content: "Discussion point",
              status: "Discussed",
              subItems: [],
            }),
          },
        ],
      };

      vi.spyOn(SpecialistCore.prototype, "runExtraction").mockResolvedValue(
        mockExtraction,
      );
      vi.spyOn(SpecialistCore.prototype, "runDrafting").mockResolvedValue(
        mockDrafting,
      );
      vi.spyOn(SpecialistCore.prototype, "runVerification").mockResolvedValue(
        mockExtraction,
      );

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);
      const result = await pipeline.run(
        mockAgency,
        mockClient,
        mockTranscript,
        "test-meeting-5",
      );

      expect(result.actionItems).toHaveLength(0);
      expect(result.statusUpdates).toHaveLength(1);
    });

    test("should handle verification failure gracefully", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [{ assignee: "Client", task: "Complete form" }],
        criticalUpdates: [],
        entities: [],
      };

      const mockDrafting: DraftingOutput = {
        caseNote: "Case note content with sufficient length. ".repeat(30),
        minutes: [
          {
            title: "Discussion",
            items: Array(10).fill({
              content: "Item",
              status: "Discussed",
              subItems: [],
            }),
          },
        ],
      };

      vi.spyOn(SpecialistCore.prototype, "runExtraction").mockResolvedValue(
        mockExtraction,
      );
      vi.spyOn(SpecialistCore.prototype, "runDrafting").mockResolvedValue(
        mockDrafting,
      );
      // Verification fails but returns original extraction
      vi.spyOn(SpecialistCore.prototype, "runVerification").mockResolvedValue(
        mockExtraction,
      );

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);
      const result = await pipeline.run(
        mockAgency,
        mockClient,
        mockTranscript,
        "test-meeting-6",
      );

      // Should still complete successfully
      expect(result.actionItems).toEqual(mockExtraction.actionItems);
      expect(result.caseNote).toBe(mockDrafting.caseNote);
    });

    test("should skip verification when no claims exist", async () => {
      const emptyExtraction: ExtractionOutput = {
        actionItems: [],
        criticalUpdates: [],
        entities: [],
      };

      const mockDrafting: DraftingOutput = {
        caseNote: "Brief check-in meeting conducted. No action items. ".repeat(
          20,
        ),
        minutes: [
          {
            title: "Check-In",
            items: Array(6).fill({
              content: "Discussion",
              status: "Discussed",
              subItems: [],
            }),
          },
        ],
      };

      vi.spyOn(SpecialistCore.prototype, "runExtraction").mockResolvedValue(
        emptyExtraction,
      );
      vi.spyOn(SpecialistCore.prototype, "runDrafting").mockResolvedValue(
        mockDrafting,
      );
      const verificationSpy = vi
        .spyOn(SpecialistCore.prototype, "runVerification")
        .mockResolvedValue(emptyExtraction);

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);
      await pipeline.run(
        mockAgency,
        mockClient,
        mockTranscript,
        "test-meeting-7",
      );

      // Verification should still be called, it just won't call the LLM internally
      expect(verificationSpy).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    test("should propagate extraction errors", async () => {
      vi.spyOn(SpecialistCore.prototype, "runExtraction").mockRejectedValue(
        new Error("Extraction failed"),
      );

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);

      await expect(
        pipeline.run(mockAgency, mockClient, mockTranscript, "test-meeting-8"),
      ).rejects.toThrow("Extraction failed");
    });

    test("should handle drafting errors after all retries", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [],
        criticalUpdates: [],
        entities: [],
      };

      vi.spyOn(SpecialistCore.prototype, "runExtraction").mockResolvedValue(
        mockExtraction,
      );
      vi.spyOn(SpecialistCore.prototype, "runDrafting").mockRejectedValue(
        new Error("Drafting failed"),
      );

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);

      await expect(
        pipeline.run(mockAgency, mockClient, mockTranscript, "test-meeting-9"),
      ).rejects.toThrow("Drafting failed");
    });
  });

  describe("Evaluation Tracking", () => {
    let mockPrisma: PrismaClient;
    let createPipelineRunSpy: MockInstance;
    let createAgentExecutionSpy: MockInstance;
    let updatePipelineRunStatusSpy: MockInstance;

    beforeEach(() => {
      // Create mock Prisma client with methods we need
      mockPrisma = {
        notetakingPipelineRun: {
          create: vi.fn(),
          update: vi.fn(),
        },
        notetakingAgentExecution: {
          create: vi.fn(),
        },
      } as unknown as PrismaClient;

      // Spy on evaluation store functions
      createPipelineRunSpy = vi
        .spyOn(evaluationStore, "createPipelineRun")
        .mockResolvedValue({
          id: "pipeline-run-123",
          createdAt: new Date(),
          meetingId: "meeting-456",
          langsmithTraceId: "trace-789",
          personPseudonymizedId: "PSEUDO_123",
          status: "SUCCESS",
          errorDetails: null,
        });

      createAgentExecutionSpy = vi
        .spyOn(evaluationStore, "createAgentExecution")
        .mockResolvedValue({
          id: "agent-exec-123",
          createdAt: new Date(),
          pipelineRunId: "pipeline-run-123",
          agentType: "EXTRACTION",
          attemptNumber: 1,
          outputData: {},
          validationResult: {},
        });

      updatePipelineRunStatusSpy = vi
        .spyOn(evaluationStore, "updatePipelineRunStatus")
        .mockResolvedValue({
          id: "pipeline-run-123",
          createdAt: new Date(),
          meetingId: "meeting-456",
          langsmithTraceId: "trace-789",
          personPseudonymizedId: "PSEUDO_123",
          status: "FAILURE",
          errorDetails: null,
        });
    });

    test("should create pipeline run on successful execution", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [],
        criticalUpdates: [],
        entities: [],
      };

      const mockDrafting: DraftingOutput = {
        caseNote: "Case note content. ".repeat(50),
        minutes: [
          {
            title: "Discussion",
            items: Array(5).fill({
              content: "Item",
              status: "Discussed",
              subItems: [],
            }),
          },
        ],
      };

      vi.spyOn(SpecialistCore.prototype, "runExtraction").mockResolvedValue(
        mockExtraction,
      );
      vi.spyOn(SpecialistCore.prototype, "runDrafting").mockResolvedValue(
        mockDrafting,
      );
      vi.spyOn(SpecialistCore.prototype, "runVerification").mockResolvedValue(
        mockExtraction,
      );

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);
      await pipeline.run(mockAgency, mockClient, mockTranscript, "meeting-456");

      // Verify pipeline run was created
      expect(createPipelineRunSpy).toHaveBeenCalledTimes(1);
      expect(createPipelineRunSpy).toHaveBeenCalledWith(mockPrisma, {
        meetingId: "meeting-456",
        personPseudonymizedId: "PSEUDO_123",
        status: "IN_PROGRESS",
      });
    });

    test("should store all agent executions on successful run", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [{ assignee: "Client", task: "Complete form" }],
        criticalUpdates: [],
        entities: [],
      };

      const mockDrafting: DraftingOutput = {
        caseNote: "Case note content. ".repeat(50),
        minutes: [
          {
            title: "Discussion",
            items: Array(5).fill({
              content: "Item",
              status: "Discussed",
              subItems: [],
            }),
          },
        ],
      };

      vi.spyOn(SpecialistCore.prototype, "runExtraction").mockResolvedValue(
        mockExtraction,
      );
      vi.spyOn(SpecialistCore.prototype, "runDrafting").mockResolvedValue(
        mockDrafting,
      );
      vi.spyOn(SpecialistCore.prototype, "runVerification").mockResolvedValue(
        mockExtraction,
      );

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);
      await pipeline.run(mockAgency, mockClient, mockTranscript, "meeting-456");

      // Should create 3 agent executions: extraction, drafting (1 attempt), verification
      expect(createAgentExecutionSpy).toHaveBeenCalledTimes(3);

      // Verify extraction execution
      expect(createAgentExecutionSpy).toHaveBeenNthCalledWith(1, mockPrisma, {
        pipelineRunId: "pipeline-run-123",
        agentType: "EXTRACTION",
        outputData: mockExtraction,
        validationResult: expect.objectContaining({ valid: true }),
      });

      // Verify drafting execution
      expect(createAgentExecutionSpy).toHaveBeenNthCalledWith(2, mockPrisma, {
        pipelineRunId: "pipeline-run-123",
        agentType: "DRAFTING",
        attemptNumber: 1,
        outputData: mockDrafting,
        validationResult: expect.objectContaining({ valid: true }),
      });

      // Verify verification execution
      expect(createAgentExecutionSpy).toHaveBeenNthCalledWith(3, mockPrisma, {
        pipelineRunId: "pipeline-run-123",
        agentType: "VERIFICATION",
        outputData: mockExtraction,
        validationResult: { valid: true },
      });
    });

    test("should store all drafting attempts with correct attempt numbers", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [],
        criticalUpdates: [],
        entities: [],
      };

      const badDrafting: DraftingOutput = {
        caseNote: "Too short",
        minutes: [],
      };

      const goodDrafting: DraftingOutput = {
        caseNote: "Sufficient content for validation. ".repeat(50),
        minutes: [
          {
            title: "Discussion",
            items: Array(5).fill({
              content: "Item",
              status: "Discussed",
              subItems: [],
            }),
          },
        ],
      };

      vi.spyOn(SpecialistCore.prototype, "runExtraction").mockResolvedValue(
        mockExtraction,
      );
      vi.spyOn(SpecialistCore.prototype, "runDrafting")
        .mockResolvedValueOnce(badDrafting)
        .mockResolvedValueOnce(badDrafting)
        .mockResolvedValueOnce(goodDrafting);
      vi.spyOn(SpecialistCore.prototype, "runVerification").mockResolvedValue(
        mockExtraction,
      );

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);
      await pipeline.run(mockAgency, mockClient, mockTranscript, "meeting-456");

      // Should create 5 agent executions: extraction, 3 drafting attempts, verification
      expect(createAgentExecutionSpy).toHaveBeenCalledTimes(5);

      // Verify all three drafting attempts were stored with correct attempt numbers
      expect(createAgentExecutionSpy).toHaveBeenNthCalledWith(2, mockPrisma, {
        pipelineRunId: "pipeline-run-123",
        agentType: "DRAFTING",
        attemptNumber: 1,
        outputData: badDrafting,
        validationResult: expect.objectContaining({ valid: false }),
      });

      expect(createAgentExecutionSpy).toHaveBeenNthCalledWith(3, mockPrisma, {
        pipelineRunId: "pipeline-run-123",
        agentType: "DRAFTING",
        attemptNumber: 2,
        outputData: badDrafting,
        validationResult: expect.objectContaining({ valid: false }),
      });

      expect(createAgentExecutionSpy).toHaveBeenNthCalledWith(4, mockPrisma, {
        pipelineRunId: "pipeline-run-123",
        agentType: "DRAFTING",
        attemptNumber: 3,
        outputData: goodDrafting,
        validationResult: expect.objectContaining({ valid: true }),
      });
    });

    test("should update pipeline status to FAILURE on gatekeeper error", async () => {
      const shortTranscript: TranscriptInput = {
        rawText: "Too short",
        recordingDate: "2025-01-15",
        durationSeconds: 10,
        poNotes: "",
      };

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);

      await expect(
        pipeline.run(mockAgency, mockClient, shortTranscript, "meeting-456"),
      ).rejects.toThrow();

      // Verify pipeline run was created
      expect(createPipelineRunSpy).toHaveBeenCalledTimes(1);

      // Verify status was updated to FAILURE with error details
      expect(updatePipelineRunStatusSpy).toHaveBeenCalledWith(
        mockPrisma,
        "pipeline-run-123",
        "FAILURE",
        expect.objectContaining({
          message: expect.stringContaining("Transcript too short"),
          stack: expect.any(String),
        }),
      );

      // Should not create any agent executions
      expect(createAgentExecutionSpy).not.toHaveBeenCalled();
    });

    test("should update pipeline status to FAILURE on extraction error", async () => {
      vi.spyOn(SpecialistCore.prototype, "runExtraction").mockRejectedValue(
        new Error("Extraction API error"),
      );

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);

      await expect(
        pipeline.run(mockAgency, mockClient, mockTranscript, "meeting-456"),
      ).rejects.toThrow("Extraction API error");

      // Verify pipeline run was created
      expect(createPipelineRunSpy).toHaveBeenCalledTimes(1);

      // Verify status was updated to FAILURE
      expect(updatePipelineRunStatusSpy).toHaveBeenCalledTimes(1);
      expect(updatePipelineRunStatusSpy).toHaveBeenCalledWith(
        mockPrisma,
        "pipeline-run-123",
        "FAILURE",
        expect.objectContaining({
          message: "Extraction API error",
          stack: expect.any(String),
        }),
      );
    });

    test("should update pipeline status to FAILURE on drafting error", async () => {
      const mockExtraction: ExtractionOutput = {
        actionItems: [],
        criticalUpdates: [],
        entities: [],
      };

      vi.spyOn(SpecialistCore.prototype, "runExtraction").mockResolvedValue(
        mockExtraction,
      );
      vi.spyOn(SpecialistCore.prototype, "runDrafting").mockRejectedValue(
        new Error("Drafting timeout"),
      );

      const pipeline = new ProductionPipeline(mockPrisma, mockCore);

      await expect(
        pipeline.run(mockAgency, mockClient, mockTranscript, "meeting-456"),
      ).rejects.toThrow("Drafting timeout");

      // Verify extraction was stored before error
      expect(createAgentExecutionSpy).toHaveBeenCalledWith(mockPrisma, {
        pipelineRunId: "pipeline-run-123",
        agentType: "EXTRACTION",
        outputData: mockExtraction,
        validationResult: expect.objectContaining({ valid: true }),
      });

      // Verify status was updated to FAILURE
      expect(updatePipelineRunStatusSpy).toHaveBeenCalledTimes(1);
      expect(updatePipelineRunStatusSpy).toHaveBeenCalledWith(
        mockPrisma,
        "pipeline-run-123",
        "FAILURE",
        expect.objectContaining({
          message: "Drafting timeout",
        }),
      );
    });
  });
});
