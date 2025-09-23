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

import {
  animation,
  Pill,
  Sans12,
  Sans14,
  Sans16,
  spacing,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import LocationIcon from "../../assets/static/images/locationPin.svg?react";
import PhoneIcon from "../../assets/static/images/phone.svg?react";
import TagsIcon from "../../assets/static/images/tags.svg?react";
import { Client, SupervisionTask } from "../../WorkflowsStore";
import {
  EmptyStateText,
  EmptyStateWrapper,
} from "../OpportunityCaseloadView/HydratedOpportunityPersonList";
import {
  SectionLabelText,
  TooltipRow,
  TooltipSection,
  TooltipSectionDetails,
  TooltipSectionHeader,
} from "../sharedComponents";
import { WorkflowsTooltip } from "../WorkflowsTooltip";
import { RoutePlannerClientsPresenter } from "./RoutePlannerClientsPresenter";

const ClientsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const OfficerSectionLabel = styled(SectionLabelText)`
  margin-top: 0;
  margin-bottom: ${rem(spacing.md)};
  text-transform: uppercase;
`;

const ClientCardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: ${rem(18)};
  row-gap: ${rem(15)};

  margin-bottom: ${rem(spacing.lg)};
`;

const BorderedClientCard = styled.div<{
  $selected: boolean;
}>`
  border-radius: ${rem(8)};
  padding: ${rem(14)} ${rem(16)};

  display: flex;
  flex-direction: row;

  border: 1px solid;
  border-color: ${({ $selected }) =>
    $selected ? palette.slate50 : palette.slate20};
  background-color: ${({ $selected }) =>
    $selected ? palette.marble3 : palette.marble1};
  transition: all ease ${animation.defaultDurationMs}ms;

  :hover,
  :focus {
    border-color: ${({ $selected }) =>
      $selected ? palette.slate80 : palette.slate50};
    background-color: ${({ $selected }) =>
      $selected ? palette.marble5 : palette.marble2};
    cursor: pointer;
  }
`;

const ClientInfo = styled.div`
  flex: 1;

  display: flex;
  flex-direction: column;
  gap: ${rem(10)};
`;

const NameRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const Name = styled(Sans16)`
  color: ${palette.pine4};
  margin-right: ${rem(6)};
`;

const SupervisionLevel = styled(Sans12)`
  display: flex;
  align-items: center;
  padding: 0 ${rem(spacing.sm)};

  font-weight: 400;
  color: ${palette.pine1};
  background-color: ${palette.slate10};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(2)};
`;

const AdditionalInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
`;

const InfoRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${rem(6)};

  & svg {
    flex-shrink: 0;
  }
`;

const SmallInfoText = styled(Sans14)`
  color: ${palette.pine1};
  font-weight: 400;
`;

const SchedulingBadge = styled(Pill).attrs({
  color: "rgb(244, 233, 215)",
  filled: true,
  textColor: palette.pine1,
})`
  height: ${rem(21)};
  width: fit-content;
  font-size: ${rem(12)};
  font-weight: 400;
`;

const BaseCheckbox = styled.span`
  height: ${rem(16)};
  width: ${rem(16)};
  margin-right: ${rem(10)};
  cursor: pointer;
  border: 1px solid;
  border-radius: ${rem(2)};
`;

const EmptyCheckbox = styled(BaseCheckbox)`
  border-color: ${palette.slate20};
`;

const NumberedCheckbox = styled(BaseCheckbox)`
  border-color: ${palette.pine4};
  background-color: ${palette.pine4};
  color: ${palette.marble1};
`;

const CheckboxContents = styled(Sans12)`
  text-align: center;
`;

function SupervisionLevelTooltip({ copy }: { copy: string }) {
  return (
    <TooltipSection>
      <TooltipSectionHeader>{copy}</TooltipSectionHeader>
      <TooltipRow>
        <TooltipSectionDetails>Supervision Level</TooltipSectionDetails>
      </TooltipRow>
    </TooltipSection>
  );
}

const ClientCard = observer(function ClientCard({
  task,
  presenter,
}: {
  task: SupervisionTask;
  presenter: RoutePlannerClientsPresenter;
}) {
  const person = task.person as Client;

  const { supervisionLevelShort, supervisionTooltip, type, scheduledStatus } =
    presenter.getClientCardCopy(task);

  const isSelected = presenter.isPersonSelected(person);
  const ordinalRank = presenter.indexOfPerson(person) + 1;

  return (
    <BorderedClientCard
      $selected={isSelected}
      onClick={() => {
        if (isSelected) {
          presenter.removePerson(person);
        } else {
          presenter.addPerson(person);
        }
      }}
    >
      {isSelected ? (
        <NumberedCheckbox>
          <CheckboxContents>{ordinalRank}</CheckboxContents>
        </NumberedCheckbox>
      ) : (
        <EmptyCheckbox />
      )}

      <ClientInfo>
        <NameRow>
          <Name>{person.displayPreferredNameLastFirst}</Name>
          <WorkflowsTooltip
            person={person}
            contents={<SupervisionLevelTooltip copy={supervisionTooltip} />}
          >
            <SupervisionLevel>{supervisionLevelShort}</SupervisionLevel>
          </WorkflowsTooltip>
        </NameRow>

        <AdditionalInfo>
          <InfoRow>
            <LocationIcon />
            <SmallInfoText>{person.address}</SmallInfoText>
          </InfoRow>
          <InfoRow>
            <TagsIcon />
            <SmallInfoText>{type}</SmallInfoText>
          </InfoRow>
        </AdditionalInfo>

        <SchedulingBadge>{scheduledStatus}</SchedulingBadge>
      </ClientInfo>

      <PhoneIcon />
    </BorderedClientCard>
  );
});

export const RoutePlannerClients = observer(function RoutePlannerClients({
  presenter,
}: {
  presenter: RoutePlannerClientsPresenter;
}) {
  const { selectedOfficers, contacts } = presenter;

  return (
    <ClientsWrapper>
      {selectedOfficers.length === 0 ? (
        <EmptyStateWrapper>
          <EmptyStateText>Select a caseload to show results.</EmptyStateText>
        </EmptyStateWrapper>
      ) : (
        selectedOfficers.map(({ searchId, searchLabel }) => {
          if (contacts[searchId] && contacts[searchId].length > 0) {
            return (
              <React.Fragment key={searchId}>
                <OfficerSectionLabel>
                  <span className="fs-exclude">{`Suggested contacts for ${searchLabel}`}</span>
                </OfficerSectionLabel>
                <ClientCardGrid>
                  {contacts[searchId].map((task) => (
                    <ClientCard
                      key={`${task.person.pseudonymizedId}-${task.type}`}
                      task={task}
                      presenter={presenter}
                    />
                  ))}
                </ClientCardGrid>
              </React.Fragment>
            );
          } else {
            return null;
          }
        })
      )}
    </ClientsWrapper>
  );
});
