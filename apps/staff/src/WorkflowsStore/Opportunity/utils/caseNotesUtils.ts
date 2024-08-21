// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { format } from "date-fns";

import { optionalFieldToDate } from "../../utils";
import { OpportunityCaseNote } from "../types";

export function formatNoteDate(date: Date): string {
  return format(date, "MMMM do");
}

export const transformCaseNotes = (
  caseNotes: Record<string, Record<string, string>[]> | undefined,
): Record<string, OpportunityCaseNote[]> => {
  if (!caseNotes) return {};

  return Object.keys(caseNotes).reduce(
    (processedNotes: Record<string, OpportunityCaseNote[]>, section) => {
      return {
        ...processedNotes,
        [section]: caseNotes[section].map((note) => ({
          noteTitle: note.noteTitle,
          noteBody: note.noteBody,
          eventDate: optionalFieldToDate(note.eventDate),
        })),
      };
    },
    {},
  );
};
