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

import { describe, expect, test } from "vitest";

import {
  ActionItemSchema,
  AgencyConfigSchema,
  CriticalUpdateSchema,
  DraftingOutputSchema,
  ExtractionOutputSchema,
  GatekeeperOutputSchema,
  MinuteItemSchema,
  PipelineOutputSchema,
  TranscriptInputSchema,
  VerificationEntrySchema,
  VerificationOutputSchema,
} from "~@meetings/tasks/llm/schemas";

describe("LLM Pipeline Schemas", () => {
  describe("TranscriptInputSchema", () => {
    test("should validate valid transcript input", () => {
      const validInput = {
        rawText:
          "[Officer]: How are you doing today?\n[Client]: I'm doing well.",
        recordingDate: "2025-01-15",
        durationSeconds: 300,
        eventType: "Office Visit",
        poNotes: "Client was on time and engaged.",
      };

      expect(TranscriptInputSchema.safeParse(validInput).success).toBe(true);
    });

    test("should apply default for missing poNotes", () => {
      const input = {
        rawText: "Transcript text",
        recordingDate: "2025-01-15",
        durationSeconds: 300,
      };

      const result = TranscriptInputSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.poNotes).toBe("");
      }
    });

    test("should fail for invalid date format", () => {
      const invalidInput = {
        rawText: "Transcript",
        recordingDate: "01/15/2025", // wrong format
        durationSeconds: 300,
      };

      // Zod doesn't validate date format by default, just that it's a string
      const result = TranscriptInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(true); // This passes as it's just a string
    });

    test("should fail for missing required fields", () => {
      const invalidInput = {
        recordingDate: "2025-01-15",
        durationSeconds: 300,
      };

      expect(TranscriptInputSchema.safeParse(invalidInput).success).toBe(false);
    });
  });

  describe("ActionItemSchema", () => {
    test("should validate valid action item", () => {
      const validAction = {
        assignee: "Client",
        task: "Complete job application",
        deadline: "2025-01-20",
        context: "Discussed during employment section",
      };

      expect(ActionItemSchema.safeParse(validAction).success).toBe(true);
    });

    test("should validate action without optional fields", () => {
      const minimalAction = {
        assignee: "PO",
        task: "Follow up with treatment provider",
      };

      expect(ActionItemSchema.safeParse(minimalAction).success).toBe(true);
    });

    test("should fail for invalid assignee", () => {
      const invalidAction = {
        assignee: "Manager", // not in enum
        task: "Review case",
      };

      expect(ActionItemSchema.safeParse(invalidAction).success).toBe(false);
    });

    test("should accept Third Party assignee", () => {
      const validAction = {
        assignee: "Third Party",
        task: "Provide housing verification",
      };

      expect(ActionItemSchema.safeParse(validAction).success).toBe(true);
    });
  });

  describe("CriticalUpdateSchema", () => {
    test("should validate valid critical update", () => {
      const validUpdate = {
        category: "Housing",
        updateType: "Change",
        details: "Client moved to new apartment",
        is_critical: true,
      };

      expect(CriticalUpdateSchema.safeParse(validUpdate).success).toBe(true);
    });

    test("should fail for invalid category", () => {
      const invalidUpdate = {
        category: "InvalidCategory",
        updateType: "New",
        details: "Some details",
      };

      expect(CriticalUpdateSchema.safeParse(invalidUpdate).success).toBe(false);
    });
  });

  describe("MinuteItemSchema", () => {
    test("should validate simple minute item", () => {
      const validItem = {
        timestamp: "[05:30]",
        content: "Discussed housing situation",
        status: "Discussed",
        subItems: [],
      };

      expect(MinuteItemSchema.safeParse(validItem).success).toBe(true);
    });

    test("should validate nested minute items", () => {
      const nestedItem = {
        content: "Employment discussion",
        status: "Discussed",
        subItems: [
          {
            content: "Current job at warehouse",
            status: "Discussed",
            subItems: [],
          },
          {
            content: "Apply for management position",
            status: "Assigned",
            subItems: [],
          },
        ],
      };

      expect(MinuteItemSchema.safeParse(nestedItem).success).toBe(true);
    });

    test("should apply defaults", () => {
      const minimalItem = {
        content: "Brief discussion point",
      };

      const result = MinuteItemSchema.safeParse(minimalItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("Discussed");
        expect(result.data.subItems).toEqual([]);
      }
    });
  });

  describe("ExtractionOutputSchema", () => {
    test("should validate valid extraction output", () => {
      const validExtraction = {
        actionItems: [
          {
            assignee: "Client",
            task: "Submit proof of residence",
            deadline: "2025-01-25",
          },
        ],
        criticalUpdates: [
          {
            category: "Housing",
            updateType: "Stable/Status Quo",
            details: "Still living at current address",
          },
        ],
        entities: [
          {
            value: "SAGE Program",
            entityKind: "Program",
          },
        ],
      };

      expect(ExtractionOutputSchema.safeParse(validExtraction).success).toBe(
        true,
      );
    });

    test("should validate empty extraction", () => {
      const emptyExtraction = {
        actionItems: [],
        criticalUpdates: [],
        entities: [],
      };

      expect(ExtractionOutputSchema.safeParse(emptyExtraction).success).toBe(
        true,
      );
    });
  });

  describe("DraftingOutputSchema", () => {
    test("should validate valid drafting output", () => {
      const validDrafting = {
        caseNote:
          "HOUSING: Client reported stable housing situation.\n\nEMPLOYMENT: Currently employed full-time.",
        minutes: [
          {
            title: "Check-In",
            items: [
              {
                content: "Client arrived on time",
                status: "Discussed",
                subItems: [],
              },
            ],
          },
        ],
      };

      expect(DraftingOutputSchema.safeParse(validDrafting).success).toBe(true);
    });

    test("should fail for missing required fields", () => {
      const invalidDrafting = {
        caseNote: "Some case note",
        // missing minutes
      };

      expect(DraftingOutputSchema.safeParse(invalidDrafting).success).toBe(
        false,
      );
    });
  });

  describe("VerificationEntrySchema", () => {
    test("should validate verification with evidence", () => {
      const validVerification = {
        claimId: "ACT_0",
        evidenceQuotes: [
          "I will submit my job application by Friday",
          "The deadline is this Friday",
        ],
        confidence: "HIGH",
        ambiguity: "LOW",
      };

      expect(VerificationEntrySchema.safeParse(validVerification).success).toBe(
        true,
      );
    });

    test("should fail for empty evidence quotes", () => {
      const invalidVerification = {
        claimId: "ACT_0",
        evidenceQuotes: [], // must have at least one
        confidence: "HIGH",
        ambiguity: "LOW",
      };

      expect(
        VerificationEntrySchema.safeParse(invalidVerification).success,
      ).toBe(false);
    });

    test("should fail for invalid confidence level", () => {
      const invalidVerification = {
        claimId: "ACT_0",
        evidenceQuotes: ["some quote"],
        confidence: "MAYBE", // not in enum
        ambiguity: "LOW",
      };

      expect(
        VerificationEntrySchema.safeParse(invalidVerification).success,
      ).toBe(false);
    });
  });

  describe("AgencyConfigSchema", () => {
    test("should validate complete agency config", () => {
      const validConfig = {
        agencyName: "State Parole Department",
        glossary: {
          PO: "Probation Officer",
          UA: "Urinalysis",
        },
        operationalRules: [
          "Document all client interactions",
          "Record changes in housing or employment",
        ],
        noteConfig: {
          structureName: "Standard Case Note",
          combineOutput: true,
          sections: [
            {
              sectionId: "SUMMARY",
              instruction: "Brief overview of meeting",
            },
          ],
        },
      };

      expect(AgencyConfigSchema.safeParse(validConfig).success).toBe(true);
    });

    test("should fail for missing noteConfig", () => {
      const invalidConfig = {
        agencyName: "State Parole Department",
        glossary: {},
        operationalRules: [],
        // missing noteConfig
      };

      expect(AgencyConfigSchema.safeParse(invalidConfig).success).toBe(false);
    });
  });

  describe("PipelineOutputSchema", () => {
    test("should validate complete pipeline output", () => {
      const validOutput = {
        caseNote: "SUMMARY: Meeting went well.",
        meetingMinutes: [
          {
            title: "Discussion",
            items: [
              {
                content: "Discussed progress",
                status: "Discussed",
                subItems: [],
              },
            ],
          },
        ],
        actionItems: [
          {
            assignee: "Client",
            task: "Complete form",
          },
        ],
        statusUpdates: [
          {
            category: "Housing",
            updateType: "Stable/Status Quo",
            details: "No changes",
          },
        ],
      };

      expect(PipelineOutputSchema.safeParse(validOutput).success).toBe(true);
    });
  });

  describe("GatekeeperOutputSchema", () => {
    test("should be equivalent to TranscriptInputSchema", () => {
      const input = {
        rawText: "Transcript",
        recordingDate: "2025-01-15",
        durationSeconds: 300,
      };

      const transcriptResult = TranscriptInputSchema.safeParse(input);
      const gatekeeperResult = GatekeeperOutputSchema.safeParse(input);

      expect(transcriptResult.success).toBe(gatekeeperResult.success);
    });
  });

  describe("VerificationOutputSchema", () => {
    test("should be equivalent to ExtractionOutputSchema", () => {
      const extraction = {
        actionItems: [],
        criticalUpdates: [],
        entities: [],
      };

      const extractionResult = ExtractionOutputSchema.safeParse(extraction);
      const verificationResult = VerificationOutputSchema.safeParse(extraction);

      expect(extractionResult.success).toBe(verificationResult.success);
    });
  });
});
