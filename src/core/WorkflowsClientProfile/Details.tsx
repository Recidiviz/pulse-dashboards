// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { descending } from "d3-array";
import { parseJSON } from "date-fns";
import { mapValues, toUpper } from "lodash";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import * as pathwaysTenants from "../../RootStore/TenantStore/pathwaysTenants";
import { formatAsCurrency, formatWorkflowsDate } from "../../utils";
import { Client, WithCaseNotes } from "../../WorkflowsStore";
import { WORKFLOWS_METHODOLOGY_URL } from "../utils/constants";
import WorkflowsOfficerName from "../WorkflowsOfficerName";
import { InfoButton, InfoTooltipWrapper } from "./common";
import { ClientProfileProps } from "./types";

const DetailsSection = styled.dl``;

const DetailsHeading = styled.dt`
  ${typography.Sans14}
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.sm)};
  margin-top: ${rem(spacing.md)};
`;

const DetailsList = styled.dl``;

const DetailsSubheading = styled.dt`
  ${typography.Sans14}
  color: rgba(53, 83, 98, 0.5);
  margin-bottom: ${rem(spacing.xs)};
`;

const DetailsContent = styled.dd`
  ${typography.Sans14}
  color: rgba(53, 83, 98, 0.9);
`;

const SpecialConditionsCopy = styled.div`
  ${typography.Body12}
`;

const CaseNoteTitle = styled.span`
  font-weight: 700;
`;

const CaseNoteDate = styled.span`
  color: ${palette.slate60};
`;

type EmptySpecialConditionCopy = {
  parole: string;
  probation: string;
};

// Special condition strings to display when a client does not have a special condition set
// If the state opportunity does not support special conditions, it should not have an entry here
const STATE_SPECIFIC_EMPTY_SPECIAL_CONDITION_STRINGS: Record<
  string,
  EmptySpecialConditionCopy
> = {
  [pathwaysTenants.US_TN]: {
    parole: "None according to Board Actions in TOMIS",
    probation: "None according to judgment orders in TOMIS",
  },
};

// TODO(#1735): the real type should be cleaner than this
type ParsedSpecialCondition = {
  // eslint-disable-next-line camelcase
  note_update_date: string;
  // eslint-disable-next-line camelcase
  conditions_on_date: string | null;
};

// TODO(#1735): after data/ETL change we should expect structured data
// rather than a JSON-ish string
function getProbationSpecialConditionsMarkup(
  client: Client,
  emptySpecialConditionString: string
): JSX.Element {
  // we will flatten the nested lists of conditions into this
  const conditionsToDisplay: (
    | NonNullable<ParsedSpecialCondition>
    | string
  )[] = [];

  client.probationSpecialConditions?.forEach((conditionsJson) => {
    try {
      const conditionsForSentence: {
        // eslint-disable-next-line camelcase
        note_update_date: string;
        // eslint-disable-next-line camelcase
        conditions_on_date: string | null;
      }[] = JSON.parse(
        // the specialConditions strings are almost valid JSON,
        // except they may include NULL instead of null as a value;
        // work around this by converting to lowercase
        conditionsJson.toLowerCase()
      );

      conditionsForSentence.forEach(
        // eslint-disable-next-line camelcase
        ({ note_update_date, conditions_on_date }) => {
          // don't display nulls
          // eslint-disable-next-line camelcase
          if (!conditions_on_date) return;

          // note that we have to convert the actual values back to uppercase
          // to display them properly
          conditionsToDisplay.push(
            mapValues({ note_update_date, conditions_on_date }, toUpper)
          );
        }
      );
    } catch (e) {
      // if we couldn't hack our way to valid JSON,
      // display the whole ugly string so there's no data loss
      conditionsToDisplay.push(conditionsJson);
    }
  });

  return (
    <>
      {!conditionsToDisplay.length && emptySpecialConditionString}
      <DetailsList>
        {conditionsToDisplay.map((condition, i) => {
          // can't guarantee uniqueness of anything in the condition,
          // there are lots of duplicates in fact
          const key = i;

          if (typeof condition === "string") {
            return <DetailsContent key={key}>{condition}</DetailsContent>;
          }

          return (
            <React.Fragment key={key}>
              <DetailsSubheading>
                {formatWorkflowsDate(parseJSON(condition.note_update_date))}
              </DetailsSubheading>
              <DetailsContent>
                <SpecialConditionsCopy>
                  {condition.conditions_on_date}
                </SpecialConditionsCopy>
              </DetailsContent>
            </React.Fragment>
          );
        })}
      </DetailsList>
    </>
  );
}

export const SpecialConditions = ({
  client,
}: ClientProfileProps): React.ReactElement | null => {
  const emptySpecialConditionStrings =
    STATE_SPECIFIC_EMPTY_SPECIAL_CONDITION_STRINGS[client.stateCode];
  if (!emptySpecialConditionStrings) return null;

  return (
    <DetailsSection>
      <DetailsHeading>Probation Special Conditions</DetailsHeading>
      <DetailsContent>
        {getProbationSpecialConditionsMarkup(
          client,
          emptySpecialConditionStrings.probation
        )}
      </DetailsContent>

      <DetailsHeading>Parole Special Conditions</DetailsHeading>
      <DetailsContent>
        <>
          {!client.paroleSpecialConditions?.length &&
            emptySpecialConditionStrings.parole}
          <DetailsList>
            {client.paroleSpecialConditions?.map(
              ({ condition, conditionDescription }, i) => {
                return (
                  // can't guarantee uniqueness of anything in the condition,
                  // there are lots of duplicates in fact
                  // eslint-disable-next-line react/no-array-index-key
                  <DetailsContent key={i}>
                    <SpecialConditionsCopy>
                      {condition} ({conditionDescription})
                    </SpecialConditionsCopy>
                  </DetailsContent>
                );
              }
            )}
          </DetailsList>
        </>
      </DetailsContent>
    </DetailsSection>
  );
};

export const Supervision = ({
  client,
}: ClientProfileProps): React.ReactElement => {
  const tooltip = client.detailsCopy?.supervisionStartDate?.tooltip;

  return (
    <DetailsSection>
      <DetailsHeading>Supervision</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Start</DetailsSubheading>
          <DetailsContent>
            {formatWorkflowsDate(client.supervisionStartDate)}{" "}
            {tooltip && (
              <>
                <InfoTooltipWrapper contents={tooltip} maxWidth={340}>
                  <InfoButton
                    infoUrl={WORKFLOWS_METHODOLOGY_URL[client.stateCode]}
                  />
                </InfoTooltipWrapper>
              </>
            )}
          </DetailsContent>

          <DetailsSubheading>Expiration</DetailsSubheading>
          <DetailsContent>
            {formatWorkflowsDate(client.expirationDate)}
          </DetailsContent>

          <DetailsSubheading>Assigned to</DetailsSubheading>
          <DetailsContent>
            <WorkflowsOfficerName officerId={client.assignedStaffId} />
          </DetailsContent>
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
};

export const Contact = ({ client }: ClientProfileProps): React.ReactElement => {
  return (
    <DetailsSection>
      <DetailsHeading>Contact</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Telephone</DetailsSubheading>
          <DetailsContent>{client.phoneNumber}</DetailsContent>
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
};
export const Housing = ({ client }: ClientProfileProps): React.ReactElement => {
  return (
    <DetailsSection>
      <DetailsHeading>Housing</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Address</DetailsSubheading>
          <DetailsContent>{client.address}</DetailsContent>
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
};

export const FinesAndFees = ({
  client,
}: ClientProfileProps): React.ReactElement => {
  return (
    <DetailsSection>
      <DetailsHeading>Fines and Fees</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Remaining for current sentence</DetailsSubheading>
          <DetailsContent>
            {client.currentBalance !== undefined &&
              formatAsCurrency(client.currentBalance)}
          </DetailsContent>

          {client.lastPaymentAmount && client.lastPaymentDate ? (
            <>
              <DetailsSubheading>Last Payment</DetailsSubheading>
              <DetailsContent>
                {formatAsCurrency(client.lastPaymentAmount)},{" "}
                {formatWorkflowsDate(client.lastPaymentDate)}
              </DetailsContent>
            </>
          ) : null}
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
};

export const CaseNotes = ({
  opportunityRecord,
  headingText = "Relevant Contact Notes",
}: {
  opportunityRecord?: WithCaseNotes;
  headingText?: string;
}): React.ReactElement => {
  if (!opportunityRecord) {
    return <div />;
  }

  const { caseNotes } = opportunityRecord;

  if (Object.keys(caseNotes).length === 0) {
    return (
      <DetailsSection>
        <DetailsHeading>{headingText}</DetailsHeading>
        <DetailsContent>None</DetailsContent>
      </DetailsSection>
    );
  }

  return (
    <DetailsSection>
      <DetailsHeading>{headingText}</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          {Object.keys(caseNotes).map((section: string) => {
            const notes = caseNotes[section];
            return (
              <React.Fragment key={section}>
                <DetailsSubheading>{section}</DetailsSubheading>
                <DetailsList>
                  {notes
                    .sort((noteA, noteB) =>
                      descending(noteA.eventDate, noteB.eventDate)
                    )
                    .map((note, index) => {
                      return (
                        // eslint-disable-next-line react/no-array-index-key
                        <DetailsContent key={index}>
                          {note.noteTitle && (
                            <>
                              <CaseNoteTitle>{note.noteTitle}:</CaseNoteTitle>{" "}
                            </>
                          )}
                          {note.noteBody}{" "}
                          <CaseNoteDate>
                            {formatWorkflowsDate(note.eventDate)}
                          </CaseNoteDate>
                        </DetailsContent>
                      );
                    })}
                </DetailsList>
              </React.Fragment>
            );
          })}
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
};
