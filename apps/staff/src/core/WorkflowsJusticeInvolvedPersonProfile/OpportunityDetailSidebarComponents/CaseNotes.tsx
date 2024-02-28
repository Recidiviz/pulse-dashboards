// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { descending } from "d3-array";
import React from "react";

import { formatWorkflowsDate } from "../../../utils";
import { WithCaseNotes } from "../../../WorkflowsStore";
import {
  CaseNoteDate,
  CaseNoteTitle,
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../styles";
import { OpportunityProfileProps } from "../types";

export function CaseNotes({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  if (!opportunity.record) return null;

  const { caseNotes } = opportunity.record as Partial<WithCaseNotes>;
  if (!caseNotes) {
    return null;
  }

  let { caseNotesTitle } = opportunity;

  caseNotesTitle ??= "Relevant Contact Notes";

  if (Object.keys(caseNotes).length === 0) {
    return (
      <DetailsSection>
        <DetailsHeading>{caseNotesTitle}</DetailsHeading>
        <SecureDetailsContent>None</SecureDetailsContent>
      </DetailsSection>
    );
  }

  return (
    <DetailsSection className="DetailsSection">
      <DetailsHeading>{caseNotesTitle}</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          {Object.keys(caseNotes).map((section: string) => {
            const notes = caseNotes[section];
            return (
              <React.Fragment key={section}>
                <DetailsSubheading>{section}</DetailsSubheading>
                <DetailsList className="fs-exclude">
                  {notes.length > 0 ? (
                    notes
                      .sort((noteA, noteB) =>
                        descending(noteA.eventDate, noteB.eventDate),
                      )
                      .map((note, index) => {
                        return (
                          // eslint-disable-next-line react/no-array-index-key
                          <SecureDetailsContent key={index}>
                            {note.noteTitle && (
                              <CaseNoteTitle>{note.noteTitle}: </CaseNoteTitle>
                            )}
                            {note.noteBody && note.noteBody}{" "}
                            {(note.eventDate ||
                              !opportunity.hideUnknownCaseNoteDates) && (
                              <CaseNoteDate>
                                {formatWorkflowsDate(note.eventDate)}
                              </CaseNoteDate>
                            )}
                          </SecureDetailsContent>
                        );
                      })
                  ) : (
                    <SecureDetailsContent>None</SecureDetailsContent>
                  )}
                </DetailsList>
              </React.Fragment>
            );
          })}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}
