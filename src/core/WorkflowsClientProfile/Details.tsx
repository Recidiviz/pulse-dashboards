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
import { differenceInDays, parseJSON } from "date-fns";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { ReactComponent as GoldStar } from "../../assets/static/images/goldStar.svg";
import * as pathwaysTenants from "../../RootStore/TenantStore/pathwaysTenants";
import { formatAsCurrency, formatWorkflowsDate } from "../../utils";
import { Client, WithCaseNotes } from "../../WorkflowsStore";
import { UsMoRestrictiveHousingStatusHearingReferralRecord } from "../../WorkflowsStore/Opportunity/UsMoRestrictiveHousingStatusHearingReferralRecord";
import { Resident } from "../../WorkflowsStore/Resident";
import { middleDateBetweenTwoDates } from "../../WorkflowsStore/utils";
import { WORKFLOWS_METHODOLOGY_URL } from "../utils/constants";
import WorkflowsOfficerName from "../WorkflowsOfficerName";
import { InfoButton, InfoTooltipWrapper } from "./common";
import {
  ClientProfileProps,
  OpportunityProfileProps,
  PersonProfileProps,
  ResidentProfileProps,
} from "./types";

const DetailsSection = styled.dl``;

const DetailsHeading = styled.dt`
  ${typography.Sans14}
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.sm)};
  margin-top: ${rem(spacing.md)};
`;

const DetailsList = styled.dl``;

const MilestonesList = styled.dl`
  align-items: center;
  display: flex;
  gap: ${rem(spacing.sm)};
  margin-bottom: ${rem(spacing.xs)};
`;

const MilestonesItem = styled.span``;

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

// TODO(#1735): after data/ETL change we should expect structured data
// rather than a JSON-ish string
function getProbationSpecialConditionsMarkup(
  client: Client,
  emptySpecialConditionString: string
): JSX.Element {
  const conditionsToDisplay = client.formattedProbationSpecialConditions;

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

export function SpecialConditions({
  client,
}: ClientProfileProps): React.ReactElement | null {
  const emptySpecialConditionStrings =
    STATE_SPECIFIC_EMPTY_SPECIAL_CONDITION_STRINGS[client.stateCode];
  if (!emptySpecialConditionStrings) return null;

  return (
    <DetailsSection className="DetailsSection">
      <DetailsHeading>Probation Special Conditions</DetailsHeading>
      <DetailsContent className="fs-exclude">
        {getProbationSpecialConditionsMarkup(
          client,
          emptySpecialConditionStrings.probation
        )}
      </DetailsContent>

      <DetailsHeading>Parole Special Conditions</DetailsHeading>
      <DetailsContent className="fs-exclude">
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
}

export function Supervision({
  client,
}: ClientProfileProps): React.ReactElement {
  const tooltip = client.detailsCopy?.supervisionStartDate?.tooltip;
  const halftime = client.stateCode === "US_ME";

  return (
    <DetailsSection>
      <DetailsHeading>Supervision</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Start</DetailsSubheading>
          <DetailsContent>
            {formatWorkflowsDate(client.supervisionStartDate)}{" "}
            {tooltip && (
              <InfoTooltipWrapper contents={tooltip} maxWidth={340}>
                <InfoButton
                  infoUrl={WORKFLOWS_METHODOLOGY_URL[client.stateCode]}
                />
              </InfoTooltipWrapper>
            )}
          </DetailsContent>
          {halftime && (
            <>
              <DetailsSubheading>Half Time Date</DetailsSubheading>
              <DetailsContent>
                {formatWorkflowsDate(
                  middleDateBetweenTwoDates(
                    client.supervisionStartDate,
                    client.expirationDate
                  )
                )}
              </DetailsContent>
            </>
          )}
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
}

export function Incarceration({
  resident,
}: ResidentProfileProps): React.ReactElement {
  const halftime = resident.stateCode === "US_ME";

  return (
    <DetailsSection>
      <DetailsHeading>Incarceration</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Start</DetailsSubheading>
          <DetailsContent>
            {formatWorkflowsDate(resident.admissionDate)}
          </DetailsContent>
          {halftime && (
            <>
              <DetailsSubheading>Half Time Date</DetailsSubheading>
              <DetailsContent>
                {formatWorkflowsDate(
                  middleDateBetweenTwoDates(
                    resident.admissionDate,
                    resident.releaseDate
                  )
                )}
              </DetailsContent>
            </>
          )}
          <DetailsSubheading>Release</DetailsSubheading>
          <DetailsContent>
            {formatWorkflowsDate(resident.releaseDate)}
          </DetailsContent>
          <DetailsSubheading>Case Manager</DetailsSubheading>
          <DetailsContent>
            <WorkflowsOfficerName officerId={resident.assignedStaffId} />
          </DetailsContent>
          <DetailsSubheading>Facility</DetailsSubheading>
          <DetailsContent>{resident.facilityId}</DetailsContent>
          <DetailsSubheading>Unit</DetailsSubheading>
          <DetailsContent>{resident.unitId}</DetailsContent>
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
}

export function Contact({ client }: ClientProfileProps): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Contact</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Telephone</DetailsSubheading>
          <DetailsContent className="fs-exclude">
            {client.phoneNumber}
          </DetailsContent>
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
}
export function ClientHousing({
  client,
}: ClientProfileProps): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Housing</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Address</DetailsSubheading>
          <DetailsContent className="fs-exclude">
            {client.address}
          </DetailsContent>
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
}

export function ResidentHousing({
  resident,
}: ResidentProfileProps): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Housing</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Facility</DetailsSubheading>
          <DetailsContent>{resident.facilityId}</DetailsContent>
          <DetailsSubheading>Unit</DetailsSubheading>
          <DetailsContent>{resident.unitId}</DetailsContent>
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
}

export function ClientEmployer({
  client,
}: ClientProfileProps): React.ReactElement | null {
  const employers = client.currentEmployers;
  if (!employers || employers.length < 1) return null;

  return (
    <DetailsSection>
      <DetailsHeading>Employment</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          {employers.map((employer) => {
            return (
              <>
                <DetailsSubheading>Employer</DetailsSubheading>
                <DetailsContent className="fs-exclude">
                  {employer.name}
                  <br />
                  {employer.address}
                </DetailsContent>
              </>
            );
          })}
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
}

export function FinesAndFees({
  client,
}: ClientProfileProps): React.ReactElement {
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
}

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
        <DetailsContent>None</DetailsContent>
      </DetailsSection>
    );
  }

  return (
    <DetailsSection className="DetailsSection">
      <DetailsHeading>{caseNotesTitle}</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          {Object.keys(caseNotes).map((section: string) => {
            const notes = caseNotes[section];
            return (
              <React.Fragment key={section}>
                <DetailsSubheading>{section}</DetailsSubheading>
                <DetailsList className="fs-exclude">
                  {notes
                    .sort((noteA, noteB) =>
                      descending(noteA.eventDate, noteB.eventDate)
                    )
                    .map((note, index) => {
                      return (
                        // eslint-disable-next-line react/no-array-index-key
                        <DetailsContent key={index}>
                          {note.noteTitle && (
                            <CaseNoteTitle>{note.noteTitle}</CaseNoteTitle>
                          )}
                          {note.noteBody && `: ${note.noteBody}`}{" "}
                          {(note.eventDate ||
                            !opportunity.hideUnknownCaseNoteDates) && (
                            <CaseNoteDate>
                              {formatWorkflowsDate(note.eventDate)}
                            </CaseNoteDate>
                          )}
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
}

export function Milestones({ client }: ClientProfileProps): React.ReactElement {
  if (client.milestones && client.milestones.length > 0) {
    return (
      <DetailsSection>
        <DetailsHeading>Milestones</DetailsHeading>
        <DetailsContent>
          {client.milestones?.map((milestone) => {
            return (
              <MilestonesList
                key={`${client.pseudonymizedId}-${milestone.type}`}
              >
                <GoldStar height="12" width="12" />
                <MilestonesItem>{milestone.text}</MilestonesItem>
              </MilestonesList>
            );
          })}
        </DetailsContent>
      </DetailsSection>
    );
  }

  return <div />;
}

export function HalfTime({ person }: PersonProfileProps): React.ReactElement {
  let halftimeDate;

  if (person instanceof Client) {
    const { supervisionStartDate, expirationDate } = person;
    halftimeDate = middleDateBetweenTwoDates(
      supervisionStartDate,
      expirationDate
    );
  }

  if (person instanceof Resident) {
    const { admissionDate, releaseDate } = person;
    halftimeDate = middleDateBetweenTwoDates(admissionDate, releaseDate);
  }

  if (halftimeDate) {
    return (
      <DetailsSection>
        <DetailsHeading>Half Time Date</DetailsHeading>
        <DetailsContent>{formatWorkflowsDate(halftimeDate)}</DetailsContent>
      </DetailsSection>
    );
  }

  return <div />;
}

// We haven't decided yet what end dates we want to show for MO individuals. To keep the sidebar
// simple, we've opted not to hydrate start or end dates in the MO resident record.
// MO workflows also currently treat facilities as staff, so we don't want to show a heading for
// case manager (since our record will actually show the facility ID there). Since this is different
// enough from other facilities workflows, add a separate component for MO Incarceration instead of
// the generic Incarceration one.
export function UsMoIncarceration({
  resident,
}: ResidentProfileProps): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Incarceration</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Facility</DetailsSubheading>
          <DetailsContent>{resident.facilityId}</DetailsContent>
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
}

export function UsMoRestrictiveHousingPlacement({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  const opportunityRecord =
    opportunity.record as UsMoRestrictiveHousingStatusHearingReferralRecord;
  if (!opportunityRecord) return null;

  return (
    <DetailsSection>
      <DetailsHeading>Current Restrictive Housing Placement</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Type</DetailsSubheading>
          <DetailsContent className="fs-exclude">
            {opportunityRecord?.metadata.housingUseCode}
          </DetailsContent>

          <DetailsSubheading>Length of Stay</DetailsSubheading>
          <DetailsContent className="fs-exclude">
            {formatWorkflowsDate(
              opportunityRecord.metadata.restrictiveHousingStartDate
            )}{" "}
            to {formatWorkflowsDate(new Date())}
            <CaseNoteDate>
              {" "}
              –{" "}
              {differenceInDays(
                new Date(),
                opportunityRecord.metadata.restrictiveHousingStartDate
              )}{" "}
              days
            </CaseNoteDate>
          </DetailsContent>

          <DetailsSubheading>Current Location</DetailsSubheading>
          <DetailsContent className="fs-exclude">
            Building {opportunityRecord.metadata.buildingNumber}, Complex{" "}
            {opportunityRecord.metadata.complexNumber}, Room{" "}
            {opportunityRecord.metadata.roomNumber}, Bed{" "}
            {opportunityRecord.metadata.bedNumber}
          </DetailsContent>

          <DetailsSubheading>
            Last Restrictive Housing Status Hearing
          </DetailsSubheading>
          <DetailsContent className="fs-exclude">
            {formatWorkflowsDate(
              opportunityRecord.metadata.mostRecentHearingDate
            )}{" "}
            (
            {differenceInDays(
              new Date(),
              opportunityRecord.metadata.mostRecentHearingDate
            )}{" "}
            days ago)
          </DetailsContent>

          <DetailsSubheading>Last Hearing Facility</DetailsSubheading>
          <DetailsContent className="fs-exclude">
            {opportunityRecord?.metadata.mostRecentHearingFacility}
          </DetailsContent>
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
}

export function ClientProfileDetails({
  client,
}: ClientProfileProps): React.ReactElement {
  return (
    <>
      <Supervision client={client} />
      <Milestones client={client} />
      <Contact client={client} />
    </>
  );
}
