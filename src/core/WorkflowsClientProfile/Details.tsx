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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { ReactComponent as GoldStar } from "../../assets/static/images/goldStar.svg";
import { useRootStore } from "../../components/StoreProvider";
import * as pathwaysTenants from "../../RootStore/TenantStore/pathwaysTenants";
import {
  formatAsCurrency,
  formatCurrentAddress,
  formatWorkflowsDate,
} from "../../utils";
import { Client, WithCaseNotes } from "../../WorkflowsStore";
import {
  INTERSTATE_COPY,
  UsMiClassificationReviewReferralRecord,
  UsMiEarlyDischargeReferralRecord,
} from "../../WorkflowsStore/Opportunity/UsMi";
import {
  UsMoClassInfo,
  UsMoConductViolationInfo,
  UsMoRestrictiveHousingStatusHearingReferralRecord,
} from "../../WorkflowsStore/Opportunity/UsMo";
import { Resident } from "../../WorkflowsStore/Resident";
import { WORKFLOWS_METHODOLOGY_URL } from "../utils/constants";
import WorkflowsOfficerName from "../WorkflowsOfficerName";
import { Divider, InfoButton, InfoTooltipWrapper } from "./common";
import {
  ClientProfileProps,
  OpportunityProfileProps,
  ResidentProfileProps,
} from "./types";

const DetailsSection = styled.dl``;

const DetailsBorderedSection = styled(DetailsSection)`
  border-top: 1px solid ${palette.slate10};
  border-bottom: 1px solid ${palette.slate10};
  margin: 0 -${rem(spacing.md)};
  padding: 0 ${rem(spacing.md)};
  background: ${palette.marble2};

  & + hr {
    display: none;
  }
`;

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

const SecureDetailsContent = styled(DetailsContent).attrs({
  className: "fs-exclude",
})``;

const SecureDetailsList = styled(DetailsList).attrs({
  className: "fs-exclude",
})``;

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
            return (
              <SecureDetailsContent key={key}>{condition}</SecureDetailsContent>
            );
          }

          return (
            <React.Fragment key={key}>
              <DetailsSubheading>
                {formatWorkflowsDate(parseJSON(condition.note_update_date))}
              </DetailsSubheading>
              <SecureDetailsContent>
                <SpecialConditionsCopy>
                  {condition.conditions_on_date}
                </SpecialConditionsCopy>
              </SecureDetailsContent>
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
  const {
    workflowsStore: { featureVariants },
  } = useRootStore();

  const emptySpecialConditionStrings =
    STATE_SPECIFIC_EMPTY_SPECIAL_CONDITION_STRINGS[client.stateCode];
  if (!emptySpecialConditionStrings) return null;

  return (
    <DetailsSection className="DetailsSection">
      <DetailsHeading>Probation Special Conditions</DetailsHeading>
      <SecureDetailsContent>
        {getProbationSpecialConditionsMarkup(
          client,
          emptySpecialConditionStrings.probation
        )}
      </SecureDetailsContent>
      {featureVariants.responsiveRevamp && <Divider />}
      <DetailsHeading>Parole Special Conditions</DetailsHeading>
      <SecureDetailsContent>
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
                  <SecureDetailsContent key={i}>
                    <SpecialConditionsCopy>
                      {condition} ({conditionDescription})
                    </SpecialConditionsCopy>
                  </SecureDetailsContent>
                );
              }
            )}
          </DetailsList>
        </>
      </SecureDetailsContent>
    </DetailsSection>
  );
}

export const PartialTime = observer(function PartialTime({
  person,
}: {
  person: Resident | Client;
}) {
  const dates = person.portionServedDates;
  const partialDates = dates.map((requirement) => (
    <React.Fragment key={requirement.heading}>
      <DetailsSubheading>{requirement.heading}</DetailsSubheading>
      <SecureDetailsContent>
        {formatWorkflowsDate(requirement.date)}
      </SecureDetailsContent>
    </React.Fragment>
  ));

  return <>{partialDates}</>;
});

export function Supervision({
  client,
}: ClientProfileProps): React.ReactElement {
  const tooltip = client.detailsCopy?.supervisionStartDate?.tooltip;

  return (
    <DetailsSection>
      <DetailsHeading>Supervision</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          <DetailsSubheading>Start</DetailsSubheading>
          <SecureDetailsContent>
            {formatWorkflowsDate(client.supervisionStartDate)}{" "}
            {tooltip && (
              <InfoTooltipWrapper contents={tooltip} maxWidth={340}>
                <InfoButton
                  infoUrl={WORKFLOWS_METHODOLOGY_URL[client.stateCode]}
                />
              </InfoTooltipWrapper>
            )}
          </SecureDetailsContent>
          <PartialTime person={client} />
          <DetailsSubheading>Expiration</DetailsSubheading>
          <SecureDetailsContent>
            {formatWorkflowsDate(client.expirationDate)}
          </SecureDetailsContent>

          <DetailsSubheading>Assigned to</DetailsSubheading>
          <SecureDetailsContent>
            <WorkflowsOfficerName officerId={client.assignedStaffId} />
          </SecureDetailsContent>
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}

export function Incarceration({
  resident,
}: ResidentProfileProps): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Incarceration</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          <DetailsSubheading>Start</DetailsSubheading>
          <SecureDetailsContent>
            {formatWorkflowsDate(resident.admissionDate)}
          </SecureDetailsContent>
          <PartialTime person={resident} />
          <DetailsSubheading>Release</DetailsSubheading>
          <SecureDetailsContent>
            {formatWorkflowsDate(resident.releaseDate)}
          </SecureDetailsContent>
          <DetailsSubheading>Case Manager</DetailsSubheading>
          <SecureDetailsContent>
            <WorkflowsOfficerName officerId={resident.assignedStaffId} />
          </SecureDetailsContent>
          <DetailsSubheading>Facility</DetailsSubheading>
          <SecureDetailsContent>{resident.facilityId}</SecureDetailsContent>
          <DetailsSubheading>Unit</DetailsSubheading>
          <SecureDetailsContent>{resident.unitId}</SecureDetailsContent>
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}

export function Contact({ client }: ClientProfileProps): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Contact</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          <DetailsSubheading>Telephone</DetailsSubheading>
          <SecureDetailsContent>{client.phoneNumber}</SecureDetailsContent>
          {client.emailAddress && (
            <>
              <DetailsSubheading>Email</DetailsSubheading>
              <SecureDetailsContent>{client.emailAddress}</SecureDetailsContent>
            </>
          )}
          {client.address && (
            <>
              <DetailsSubheading>Address</DetailsSubheading>
              <SecureDetailsContent>
                {formatCurrentAddress(client.address, client.stateCode)}
              </SecureDetailsContent>
            </>
          )}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}

export function ClientHousing({
  client,
}: ClientProfileProps): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Housing</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          <DetailsSubheading>Address</DetailsSubheading>
          <SecureDetailsContent>{client.address}</SecureDetailsContent>
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}

export function ResidentHousing({
  resident,
}: ResidentProfileProps): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Housing</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          <DetailsSubheading>Facility</DetailsSubheading>
          <SecureDetailsContent>{resident.facilityId}</SecureDetailsContent>
          <DetailsSubheading>Unit</DetailsSubheading>
          <SecureDetailsContent>{resident.unitId}</SecureDetailsContent>
        </DetailsList>
      </SecureDetailsContent>
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
      <SecureDetailsContent>
        <DetailsList>
          {employers.map((employer) => {
            return (
              <div key={employer.name}>
                <DetailsSubheading>Employer</DetailsSubheading>
                <SecureDetailsContent>
                  {employer.name}
                  <br />
                  {employer.address}
                </SecureDetailsContent>
              </div>
            );
          })}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}

export function FinesAndFees({
  client,
}: ClientProfileProps): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Fines and Fees</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          <DetailsSubheading>Remaining for current sentence</DetailsSubheading>
          <SecureDetailsContent>
            {client.currentBalance !== undefined &&
              formatAsCurrency(client.currentBalance)}
          </SecureDetailsContent>

          {client.lastPaymentAmount && client.lastPaymentDate ? (
            <>
              <DetailsSubheading>Last Payment</DetailsSubheading>
              <SecureDetailsContent>
                {formatAsCurrency(client.lastPaymentAmount)},{" "}
                {formatWorkflowsDate(client.lastPaymentDate)}
              </SecureDetailsContent>
            </>
          ) : null}
        </DetailsList>
      </SecureDetailsContent>
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
                        descending(noteA.eventDate, noteB.eventDate)
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

export function Milestones({ client }: ClientProfileProps): React.ReactElement {
  if (client.profileMilestones.length > 0) {
    return (
      <DetailsSection>
        <DetailsHeading>Milestones</DetailsHeading>
        <SecureDetailsContent>
          {client.profileMilestones?.map((milestone) => {
            return (
              <MilestonesList
                key={`${client.pseudonymizedId}-${milestone.type}`}
              >
                <GoldStar height="12" width="12" />
                <MilestonesItem>{milestone.text}</MilestonesItem>
              </MilestonesList>
            );
          })}
        </SecureDetailsContent>
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
      <SecureDetailsContent>
        <DetailsList>
          <DetailsSubheading>Facility</DetailsSubheading>
          <SecureDetailsContent>{resident.facilityId}</SecureDetailsContent>
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}

export function UsMoClassesList({
  classes,
}: {
  classes: UsMoClassInfo[];
}): React.ReactElement {
  return (
    <>
      {classes && classes.length > 0 ? (
        <DetailsList>
          {classes.map(
            ({
              startDate,
              endDate,
              classTitle,
              classExitReason,
            }: UsMoClassInfo) => {
              return (
                <SecureDetailsContent key={`${classTitle}-${startDate}`}>
                  <CaseNoteTitle>
                    {classTitle || "CLASS TITLE UNAVAILABLE"}
                  </CaseNoteTitle>
                  <br />
                  <CaseNoteDate>
                    {formatWorkflowsDate(startDate)} -{" "}
                    {endDate ? formatWorkflowsDate(endDate) : "current"}
                  </CaseNoteDate>
                  <br />
                  Exit Reason: {classExitReason || "N/A"}
                </SecureDetailsContent>
              );
            }
          )}
        </DetailsList>
      ) : (
        "None"
      )}
    </>
  );
}

export function UsMoConductViolationsList({
  cdvs,
}: {
  cdvs: UsMoConductViolationInfo[];
}): React.ReactElement {
  return (
    <>
      {cdvs.length > 0 && cdvs ? (
        <DetailsList>
          {cdvs.map(({ cdvDate, cdvRule }: UsMoConductViolationInfo) => {
            return (
              <SecureDetailsContent key={cdvRule}>
                <CaseNoteTitle>{cdvRule}:</CaseNoteTitle>{" "}
                {formatWorkflowsDate(cdvDate)}
              </SecureDetailsContent>
            );
          })}
        </DetailsList>
      ) : (
        "None"
      )}
    </>
  );
}

export function UsMoRestrictiveHousing({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  const opportunityRecord =
    opportunity.record as UsMoRestrictiveHousingStatusHearingReferralRecord;
  if (!opportunityRecord) return null;

  const {
    housingUseCode,
    restrictiveHousingStartDate,
    buildingNumber,
    complexNumber,
    roomNumber,
    bedNumber,
    mostRecentHearingDate,
    mostRecentHearingFacility,
    aicScore,
    unwaivedEnemies,
    majorCdvs,
    cdvsSinceLastHearing,
    numMinorCdvsBeforeLastHearing,
    classesRecent,
    mentalHealthAssessmentScore,
    mostRecentHearingComments,
  } = opportunityRecord.metadata;

  return (
    <>
      <DetailsSection>
        <DetailsHeading>Current Restrictive Housing Placement</DetailsHeading>
        <SecureDetailsContent>
          <SecureDetailsList>
            <DetailsSubheading>Type</DetailsSubheading>
            <SecureDetailsContent>{housingUseCode}</SecureDetailsContent>

            <DetailsSubheading>Length of Stay</DetailsSubheading>
            <SecureDetailsContent>
              {formatWorkflowsDate(restrictiveHousingStartDate)} to{" "}
              {formatWorkflowsDate(new Date())}
              <CaseNoteDate>
                {" "}
                – {differenceInDays(
                  new Date(),
                  restrictiveHousingStartDate
                )}{" "}
                days
              </CaseNoteDate>
            </SecureDetailsContent>

            <DetailsSubheading>Current Location</DetailsSubheading>
            <SecureDetailsContent>
              Building {buildingNumber}, Complex {complexNumber}, Room{" "}
              {roomNumber}, Bed {bedNumber}
            </SecureDetailsContent>

            <DetailsSubheading>
              Last Restrictive Housing Status Hearing
            </DetailsSubheading>
            {mostRecentHearingDate ? (
              <SecureDetailsContent>
                {formatWorkflowsDate(mostRecentHearingDate)} (
                {differenceInDays(new Date(), mostRecentHearingDate)} days ago)
              </SecureDetailsContent>
            ) : (
              "None"
            )}

            <DetailsSubheading>Last Hearing Facility</DetailsSubheading>
            <SecureDetailsContent>
              {mostRecentHearingFacility}
            </SecureDetailsContent>
            <DetailsSubheading>Adult in Custody (AIC) Score</DetailsSubheading>
            <SecureDetailsContent>{aicScore}</SecureDetailsContent>
            <DetailsSubheading>
              Mental Health Assessment Score
            </DetailsSubheading>
            <SecureDetailsContent>
              {mentalHealthAssessmentScore}
            </SecureDetailsContent>
            <DetailsSubheading>Unwaived Enemies</DetailsSubheading>
            <SecureDetailsContent>
              {unwaivedEnemies && unwaivedEnemies.length > 0
                ? unwaivedEnemies.map(
                    ({
                      enemyExternalId,
                      enemyHousingUseCode,
                      enemyBuildingNumber,
                      enemyComplexNumber,
                      enemyRoomNumber,
                      enemyBedNumber,
                    }) => (
                      <span className="fs-exclude" key={`${enemyExternalId}`}>
                        <CaseNoteTitle>[ID# {enemyExternalId}] </CaseNoteTitle>
                        Housing Use Code: <b>{enemyHousingUseCode}</b>
                        <br />
                        Building {enemyBuildingNumber}, Complex{" "}
                        {enemyComplexNumber}, Room {enemyRoomNumber}, Bed{" "}
                        {enemyBedNumber}
                      </span>
                    )
                  )
                : "None"}
            </SecureDetailsContent>
          </SecureDetailsList>
        </SecureDetailsContent>
      </DetailsSection>

      <DetailsSection>
        <DetailsHeading>Conduct Violations (CDVs)</DetailsHeading>
        <SecureDetailsList>
          <DetailsSubheading>
            Major Conduct Violations, Past 12 Months
          </DetailsSubheading>
          <UsMoConductViolationsList cdvs={majorCdvs} />
          <DetailsSubheading>
            Conduct Violations, Since Last Hearing
          </DetailsSubheading>
          <UsMoConductViolationsList cdvs={cdvsSinceLastHearing} />
          <DetailsSubheading>
            Minor Conduct Violations, Past 6 Months
          </DetailsSubheading>
          {numMinorCdvsBeforeLastHearing || "None"}
        </SecureDetailsList>
      </DetailsSection>

      <DetailsSection>
        <DetailsHeading>Most Recent 10 Classes</DetailsHeading>
        <SecureDetailsContent>
          <UsMoClassesList
            classes={(classesRecent || [])
              .sort(
                (a, b) =>
                  new Date(b.startDate).getTime() -
                  new Date(a.startDate).getTime()
              )
              .slice(0, 10)}
          />
        </SecureDetailsContent>
      </DetailsSection>

      <DetailsSection>
        <DetailsHeading>Previous Hearing Comments</DetailsHeading>
        <SecureDetailsContent>
          <DetailsList>
            <SecureDetailsContent>
              {mostRecentHearingComments}
            </SecureDetailsContent>
          </DetailsList>
        </SecureDetailsContent>
      </DetailsSection>
    </>
  );
}

export function UsMiEarlyDischargeIcDetails({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  const opportunityRecord =
    opportunity.record as UsMiEarlyDischargeReferralRecord;
  if (!opportunityRecord) return null;

  const {
    metadata: { interstateFlag, supervisionType },
  } = opportunityRecord;

  if (!interstateFlag) return null;

  return (
    <DetailsBorderedSection>
      <DetailsHeading>{interstateFlag}</DetailsHeading>
      <DetailsList>
        <SecureDetailsContent>
          {interstateFlag === "IC-IN"
            ? INTERSTATE_COPY[interstateFlag].text
            : INTERSTATE_COPY[interstateFlag][supervisionType].text}
        </SecureDetailsContent>
      </DetailsList>
    </DetailsBorderedSection>
  );
}

export function RecommendedSupervisionLevel({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  const opportunityRecord =
    opportunity.record as UsMiClassificationReviewReferralRecord;
  if (!opportunityRecord) return null;

  const {
    metadata: { recommendedSupervisionLevel },
  } = opportunityRecord;

  if (!recommendedSupervisionLevel) return null;

  return (
    <DetailsSection>
      <DetailsHeading>Recommended Supervision Level</DetailsHeading>
      <DetailsList>
        <SecureDetailsContent>
          {recommendedSupervisionLevel}
        </SecureDetailsContent>
      </DetailsList>
    </DetailsSection>
  );
}

export function UsTnCommonlyUsedOverrideCodes(): React.ReactElement | null {
  const overrideCodes = {
    C1DEC: "Maximum to Close decrease",
    C2DEC: "Non-assaultive disciplinary",
    C3DEC: "Parole grant / SAIU / TCWC",
    C4DEC: "Medium to Minimum-R w/ detainer",
    C5DEC: "Revise sev. of offense scale",
    C6DEC: "Close to medium decrease",
    C7DEC: "Close to medium decrease",
  };

  const overrideCodesList = Object.entries(overrideCodes).map(
    ([key, value]) => (
      <SecureDetailsContent key={key}>
        <CaseNoteTitle>{key}: </CaseNoteTitle>
        {value}
      </SecureDetailsContent>
    )
  );

  return (
    <DetailsSection>
      <DetailsHeading>Commonly Used Override Codes</DetailsHeading>
      <SecureDetailsList>{overrideCodesList}</SecureDetailsList>
    </DetailsSection>
  );
}

export function ClientProfileDetails({
  client,
}: ClientProfileProps): React.ReactElement {
  const {
    workflowsStore: { featureVariants },
  } = useRootStore();

  return (
    <>
      <Supervision client={client} />
      {featureVariants.responsiveRevamp && <Divider />}
      {client.profileMilestones.length > 0 && (
        <>
          <Milestones client={client} />
          {featureVariants.responsiveRevamp && <Divider />}
        </>
      )}
      <Contact client={client} />
    </>
  );
}
