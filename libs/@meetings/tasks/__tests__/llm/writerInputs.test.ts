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

import { describe, expect, test } from "vitest";

import { AgencyConfig } from "~@meetings/config/types";
import { Client, Resident } from "~@meetings/prisma/client";
import { TranscriptInput } from "~@meetings/tasks/llm/schemas";
import {
  buildWriterUserVariables,
  WriterFacts,
} from "~@meetings/tasks/llm/writerInputs";

describe("buildWriterUserVariables", () => {
  const mockPerson: Client = {
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
    rawText: "[Officer]: Hi\n[Client]: Hello",
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
    rules: [],
    keywords: [],
    outputs: [
      {
        id: "case_note",
        label: "Case Note",
        promptGuidance: "Brief summary",
      },
    ],
    labels: {},
    additionalOutputs: [],
  };

  const mockFacts: WriterFacts = {
    actionItems: [{}, {}],
    entities: [{ value: "123 Main St", entityKind: "Address" }],
  };

  test("passes transcript raw text and poNotes through unchanged", () => {
    const result = buildWriterUserVariables(
      mockTranscript,
      mockFacts,
      mockAgency,
      mockPerson,
    );

    expect(result.transcript).toBe(mockTranscript.rawText);
    expect(result.poNotes).toBe(mockTranscript.poNotes);
  });

  test("formats client as 'Client: givenNames surname'", () => {
    const result = buildWriterUserVariables(
      mockTranscript,
      mockFacts,
      mockAgency,
      mockPerson,
    );

    expect(result.client).toBe("Client: John Doe");
  });

  test("normalizes an all-caps client name", () => {
    const result = buildWriterUserVariables(
      mockTranscript,
      mockFacts,
      mockAgency,
      { ...mockPerson, givenNames: "JEWEL", surname: "HILPERT" },
    );

    expect(result.client).toBe("Client: Jewel Hilpert");
  });

  test("formats glossary as one 'term: definition' line per entry", () => {
    const result = buildWriterUserVariables(
      mockTranscript,
      mockFacts,
      mockAgency,
      mockPerson,
    );

    expect(result.glossary).toBe("PO: Probation Officer\nUA: Urinalysis");
  });

  test("returns an empty glossary string when the agency glossary is empty", () => {
    const result = buildWriterUserVariables(
      mockTranscript,
      mockFacts,
      { ...mockAgency, glossary: {} },
      mockPerson,
    );

    expect(result.glossary).toBe("");
  });

  test("formats extracted as an action-item count plus an entity value->kind dict", () => {
    const result = buildWriterUserVariables(
      mockTranscript,
      mockFacts,
      mockAgency,
      mockPerson,
    );

    expect(result.extracted).toBe(
      'ACTIONS: 2 found\nENTITIES: {"123 Main St":"Address"}',
    );
  });

  test("only counts action items - their field contents are never read", () => {
    // Deliberately ground-truth-shaped, not pipeline-shaped: no evidenceQuotes,
    // assignee isn't restricted to the real ActionItemSchema enum, and one
    // entry isn't even action-item-shaped. This is the whole reason
    // WriterFacts is narrower than ExtractionOutput - see its doc comment.
    const looseFacts: WriterFacts = {
      actionItems: [
        { assignee: "PO", task: "Call the clinic" },
        { notAnActionItemAtAll: true },
      ],
      entities: [],
    };

    const result = buildWriterUserVariables(
      mockTranscript,
      looseFacts,
      mockAgency,
      mockPerson,
    );

    expect(result.extracted).toBe("ACTIONS: 2 found\nENTITIES: {}");
  });

  test("builds one structure line per agency output", () => {
    const agency: AgencyConfig = {
      ...mockAgency,
      outputs: [
        {
          id: "case_note",
          label: "Case Note",
          promptGuidance: "Brief summary",
        },
        {
          id: "minutes",
          label: "Meeting Minutes",
          promptGuidance: "Chronological log",
        },
      ],
    };

    const result = buildWriterUserVariables(
      mockTranscript,
      mockFacts,
      agency,
      mockPerson,
    );

    expect(result.structure).toBe(
      "- (Case Note): Brief summary\n- (Meeting Minutes): Chronological log",
    );
  });

  describe("meeting type case note guidance", () => {
    const agencyWithPromptConfig: AgencyConfig = {
      ...mockAgency,
      meetingTypes: [
        {
          type: "Collateral Contact",
          promptConfig: {
            caseNoteGuidance: "Document what the contact reported.",
          },
          visible: true,
        },
      ],
    };

    test("appends guidance to the case_note output when meetingType matches", () => {
      const result = buildWriterUserVariables(
        { ...mockTranscript, meetingType: "Collateral Contact" },
        mockFacts,
        agencyWithPromptConfig,
        mockPerson,
      );

      expect(result.structure).toBe(
        "- (Case Note): Brief summary\nMeeting Type Context: Document what the contact reported.",
      );
    });

    test("does not append guidance when the transcript has no meetingType", () => {
      const result = buildWriterUserVariables(
        mockTranscript,
        mockFacts,
        agencyWithPromptConfig,
        mockPerson,
      );

      expect(result.structure).not.toContain("Meeting Type Context");
    });

    test("does not append guidance when meetingType has no matching config", () => {
      const result = buildWriterUserVariables(
        { ...mockTranscript, meetingType: "Assessment" },
        mockFacts,
        agencyWithPromptConfig,
        mockPerson,
      );

      expect(result.structure).not.toContain("Meeting Type Context");
    });

    test("only appends guidance to the case_note output, not other outputs", () => {
      const agency: AgencyConfig = {
        ...agencyWithPromptConfig,
        outputs: [
          { id: "case_note", label: "Case Note", promptGuidance: "Write it." },
          {
            id: "minutes",
            label: "Meeting Minutes",
            promptGuidance: "Summarize it.",
          },
        ],
      };

      const result = buildWriterUserVariables(
        { ...mockTranscript, meetingType: "Collateral Contact" },
        mockFacts,
        agency,
        mockPerson,
      );

      const occurrences = (
        result.structure.match(/Document what the contact reported/g) ?? []
      ).length;
      expect(occurrences).toBe(1);
      expect(result.structure).toContain("- (Meeting Minutes): Summarize it.");
    });

    test("does not crash when the agency has no meetingTypes defined", () => {
      const agency: AgencyConfig = { ...mockAgency, meetingTypes: [] };

      const result = buildWriterUserVariables(
        { ...mockTranscript, meetingType: "Collateral Contact" },
        mockFacts,
        agency,
        mockPerson,
      );

      expect(result.structure).toBe("- (Case Note): Brief summary");
    });
  });

  describe("subheaders", () => {
    test("appends subheader instructions when the output defines them", () => {
      const agency: AgencyConfig = {
        ...mockAgency,
        outputs: [
          {
            id: "case_note",
            label: "Case Note",
            promptGuidance: "Brief summary",
            subheaders: ["Housing", "Mental Health"],
          },
        ],
      };

      const result = buildWriterUserVariables(
        mockTranscript,
        mockFacts,
        agency,
        mockPerson,
      );

      expect(result.structure).toBe(
        "- (Case Note): Brief summary\n" +
          "Use these subheaders where relevant:\n" +
          "Housing, Mental Health. Omit any that don't apply,\n" +
          "and add others if they'd better organize the content.",
      );
    });

    test("appends subheader instructions to any output that defines them, not just case_note", () => {
      const agency: AgencyConfig = {
        ...mockAgency,
        outputs: [
          {
            id: "case_note",
            label: "Case Note",
            promptGuidance: "Brief summary",
          },
          {
            id: "minutes",
            label: "Meeting Minutes",
            promptGuidance: "Chronological log",
            subheaders: ["Housing", "Mental Health"],
          },
        ],
      };

      const result = buildWriterUserVariables(
        mockTranscript,
        mockFacts,
        agency,
        mockPerson,
      );

      expect(result.structure).toBe(
        "- (Case Note): Brief summary\n" +
          "- (Meeting Minutes): Chronological log\n" +
          "Use these subheaders where relevant:\n" +
          "Housing, Mental Health. Omit any that don't apply,\n" +
          "and add others if they'd better organize the content.",
      );
    });

    test("omits subheader instructions when the output defines none", () => {
      const result = buildWriterUserVariables(
        mockTranscript,
        mockFacts,
        mockAgency,
        mockPerson,
      );

      expect(result.structure).not.toContain("subheaders");
    });
  });

  test("combines meeting type guidance and subheaders on the same output", () => {
    const agency: AgencyConfig = {
      ...mockAgency,
      meetingTypes: [
        {
          type: "Collateral Contact",
          promptConfig: {
            caseNoteGuidance: "Document what the contact reported.",
          },
          visible: true,
        },
      ],
      outputs: [
        {
          id: "case_note",
          label: "Case Note",
          promptGuidance: "Brief summary",
          subheaders: ["Housing", "Mental Health"],
        },
        {
          id: "minutes",
          label: "Meeting Minutes",
          promptGuidance: "Chronological log",
        },
      ],
    };

    const result = buildWriterUserVariables(
      { ...mockTranscript, meetingType: "Collateral Contact" },
      mockFacts,
      agency,
      mockPerson,
    );

    expect(result.structure).toBe(
      "- (Case Note): Brief summary\n" +
        "Meeting Type Context: Document what the contact reported.\n" +
        "Use these subheaders where relevant:\n" +
        "Housing, Mental Health. Omit any that don't apply,\n" +
        "and add others if they'd better organize the content.\n" +
        "- (Meeting Minutes): Chronological log",
    );
  });

  describe("aliases", () => {
    const structureFor = (
      aliases: AgencyConfig["aliases"],
      person: Client | Resident = mockPerson,
    ) =>
      buildWriterUserVariables(
        mockTranscript,
        mockFacts,
        { ...mockAgency, aliases },
        person,
      ).structure;

    test("appends the staffMember and thirdParty aliases", () => {
      const structure = structureFor({
        staffMember: "Coach",
        thirdParty: "Collateral",
      });

      expect(structure).toContain(
        'Use "Coach" instead of "Staff Member" when referring to the staff member.',
      );
      expect(structure).toContain(
        'Use "Collateral" instead of "Third Party" when referring to a third party.',
      );
    });

    test("does not append an alias rule when its value matches its own default term", () => {
      const structure = structureFor({
        client: "Client",
        resident: "Resident",
      });

      expect(structure).not.toContain('instead of "Client"');
      expect(structure).not.toContain('instead of "Resident"');
    });

    test("appends the resident alias when explicitly set to its own default term", () => {
      // The LLM's default term is always "Client", so setting the resident
      // alias to "Resident" is not a no-op - it should still be injected.
      expect(structureFor({ resident: "Resident" }, mockResident)).toContain(
        'Use "Resident" instead of "Client"',
      );
    });

    test("does not append the resident alias when the person is a Client", () => {
      expect(structureFor({ resident: "Friend" })).not.toContain("Friend");
    });

    test("defaults to the Resident alias for a resident when the agency hasn't configured one", () => {
      expect(structureFor(undefined, mockResident)).toContain(
        'Use "Resident" instead of "Client"',
      );
    });

    test("appends the client alias when the person is a Client", () => {
      expect(structureFor({ client: "Homie" })).toContain(
        'Use "Homie" instead of "Client"',
      );
    });

    test("only appends the resident alias for a resident when both client and resident aliases are set", () => {
      const structure = structureFor(
        { client: "Homie", resident: "Friend" },
        mockResident,
      );

      expect(structure).toContain('Use "Friend" instead of "Client"');
      expect(structure).not.toContain("Homie");
    });

    test("does not append the resident alias when it is explicitly set to the prompt's default term", () => {
      // The prompt already refers to the person as "Client", so this alias is a no-op.
      expect(structureFor({ resident: "Client" }, mockResident)).not.toContain(
        "ALIASES",
      );
    });

    test("does not include an ALIASES section when the agency has no aliases configured", () => {
      expect(structureFor(undefined)).not.toContain("ALIASES");
    });

    test("starts the ALIASES section on its own line after the last output", () => {
      const structure = structureFor({ staffMember: "Coach" });

      expect(structure).toBe(
        "- (Case Note): Brief summary\n" +
          "#### ALIASES\n" +
          "Below are aliases that have been defined for this agency. Use them in place of their default terms.\n" +
          '- Use "Coach" instead of "Staff Member" when referring to the staff member.',
      );
    });
  });
});
