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

/**
 * Minimal Person + AgencyConfig + TranscriptInput stubs for driving
 * `SpecialistCore.runExtraction()` from the eval. Extraction reads only
 * `transcript.rawText` and `agency.rules` (joined into the prompt) plus
 * `person.{pseudonymizedId, stateCode}` for logging — none of these need
 * to reflect real data.
 */

import type { AgencyConfig } from "~@meetings/config/types";
import type { Client } from "~@meetings/prisma/client";
import type { TranscriptInput } from "~@meetings/tasks/llm/schemas";

export function transcriptFromScript(rawText: string): TranscriptInput {
  return {
    rawText,
    recordingDate: "2026-01-01",
    durationSeconds: 900,
    poNotes: "",
  };
}

export const EVAL_PERSON: Client = {
  personId: BigInt(1),
  stablePersonExternalId: "EVAL_EXT",
  stablePersonExternalIdType: "STATE_ID",
  pseudonymizedId: "EVAL_PSEUDO",
  stateCode: "US_NE",
  givenNames: "Eval",
  middleNames: null,
  surname: "Test",
  suffix: null,
  displayPersonExternalId: "EVAL_DISPLAY",
  supervisionType: "PAROLE",
  isActive: true,
  staffEmails: [],
  lastImportedAt: new Date(0),
};

export const EVAL_AGENCY: AgencyConfig = {
  baseVersion: 1,
  name: "Eval",
  stateCode: "US_XX",
  version: 1,
  showTranscriptions: true,
  staffFeedbackEnabled: false,
  audioPlaybackEnabled: false,
  audioTTLDays: 30,
  transcriptTTLDays: 30,
  glossary: {},
  rules: [],
  keywords: [],
  meetingTypes: [],
  labels: { supervisionStaff: "Staff", client: "Client" },
  outputs: [
    {
      id: "case_note",
      label: "Case Note",
      promptGuidance: "Brief summary",
    },
  ],
};
