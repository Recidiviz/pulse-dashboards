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

import type { MeetingDetails } from "~@meetings/app/entities/meeting";

import { getFlaggedSections } from "./getFlaggedSections";

type Params = Pick<
  MeetingDetails,
  "llmajGrades" | "caseNoteEditedAt" | "actionItemsEditedAt"
>;

export type FlaggedSections = {
  caseNote: boolean;
  actionItems: boolean;
};

// Which sections of the current notes the LLM judge graded BAD and nobody has
// edited since
export function getUneditedFlaggedSections({
  llmajGrades,
  caseNoteEditedAt,
  actionItemsEditedAt,
}: Params): FlaggedSections {
  const flagged = getFlaggedSections(llmajGrades);

  return {
    caseNote: flagged.caseNote && caseNoteEditedAt === null,
    actionItems: flagged.actionItems && actionItemsEditedAt === null,
  };
}
