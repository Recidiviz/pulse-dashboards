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

import { Pill, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { formatWorkflowsDate } from "../../../../utils";
import { WithCaseNotes } from "../../../../WorkflowsStore";
import {
  CaseNoteTitle,
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

const CaseNotePill = styled(Pill)`
  float: right;
  height: ${rem(22)};
  padding: ${rem(8)};
`;

const CaseNoteDivider = styled.hr`
  border-top: 1px solid ${palette.slate10};
  margin: ${rem(spacing.md)} 0;

  :last-child {
    display: none;
  }
`;

export function UsAzAcisInformation({ opportunity }: OpportunityProfileProps) {
  if (!opportunity.record) return null;
  const { caseNotes } = opportunity.record as Partial<WithCaseNotes>;
  if (!caseNotes) {
    return null;
  }

  // TODO(#7305): Work with Nebula to get this data in a more structured form so we
  // don't have to order the unordered case notes sections here?
  const sectionOrder = [
    "Home Plan Information",
    "Agreement Form Signature Status",
    "Mandatory Literacy Enrollment Information",
  ].filter((section) => section in caseNotes);
  const sections = [
    // Pull out the case notes we know how to order
    ...sectionOrder,
    // Then list all others so we'll still show notes with changed or new names
    ...Object.keys(caseNotes).filter(
      (section) => !sectionOrder.includes(section),
    ),
  ];

  return (
    <DetailsSection className="DetailsSection">
      <DetailsHeading>Additional Information from ACIS</DetailsHeading>
      <SecureDetailsContent>
        {sections.length === 0 ? (
          "None"
        ) : (
          <DetailsList>
            {sections.map((section: string) => {
              const note = caseNotes[section]?.[0];
              return (
                <React.Fragment key={section}>
                  <DetailsSubheading>
                    {section}
                    {note && (
                      <CaseNotePill
                        color={palette.marble3}
                        textColor={palette.slate85}
                        filled
                      >
                        {note.noteTitle}
                      </CaseNotePill>
                    )}
                  </DetailsSubheading>

                  <DetailsList className="fs-exclude">
                    <SecureDetailsContent>
                      {note ? (
                        <>
                          <CaseNoteTitle>Last Updated: </CaseNoteTitle>
                          {(note.eventDate ||
                            !opportunity.hideUnknownCaseNoteDates) &&
                            formatWorkflowsDate(note.eventDate)}
                          {note.noteBody?.trim() && (
                            <div>
                              <CaseNoteTitle>More Info: </CaseNoteTitle>
                              {note.noteBody}
                            </div>
                          )}
                        </>
                      ) : (
                        "No Information"
                      )}
                    </SecureDetailsContent>
                  </DetailsList>

                  <CaseNoteDivider />
                </React.Fragment>
              );
            })}
          </DetailsList>
        )}
      </SecureDetailsContent>
    </DetailsSection>
  );
}
