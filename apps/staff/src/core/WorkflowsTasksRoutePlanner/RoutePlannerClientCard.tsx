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
  Pill,
  Sans12,
  Sans14,
  Sans16,
  spacing,
  TooltipTrigger,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import LocationIcon from "../../assets/static/images/locationPin.svg?react";
import PhoneIcon from "../../assets/static/images/phone.svg?react";
import TagsIcon from "../../assets/static/images/tags.svg?react";
import { Client, SupervisionTask } from "../../WorkflowsStore";
import {
  TooltipRow,
  TooltipSection,
  TooltipSectionDetails,
  TooltipSectionHeader,
} from "../sharedComponents";
import { InfoButton } from "../WorkflowsJusticeInvolvedPersonProfile/InfoButton";
import { WorkflowsTooltip } from "../WorkflowsTooltip";
import { RoutePlannerClientsPresenter } from "./RoutePlannerClientsPresenter";

const BorderedClientCard = styled.div<{
  $selected: boolean;
  $selectable: boolean;
}>`
  border-radius: ${rem(8)};
  padding: ${rem(14)} ${rem(16)};

  display: flex;
  flex-direction: row;

  border: 1px solid;

  ${({ $selectable, $selected }) =>
    $selectable &&
    `border-color: ${$selected ? palette.slate50 : palette.slate20};
      background-color: ${$selected ? palette.marble3 : palette.marble1};
      transition: all ease 200ms;

      :hover,
      :focus {
        border-color: ${$selected ? palette.slate80 : palette.slate50};
        background-color: ${$selected ? palette.marble5 : palette.marble2};
        cursor: pointer;
      }`}

  ${({ $selectable }) =>
    !$selectable &&
    `
      border-color: ${palette.slate50};
      background-color: ${palette.slate20};
      cursor: not-allowed;
    `}
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

const SmallInfoLink = styled(Sans14)`
  color: ${palette.signal.links};
  text-decoration: underline;
`;

const SchedulingBadge = styled(Pill).attrs({
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

const EmptyCheckbox = styled(BaseCheckbox)<{
  $selectable: boolean;
}>`
  border-color: ${palette.slate20};

  ${({ $selectable }) => !$selectable && `cursor: not-allowed;`}
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

export const ClientCard = observer(function ClientCard({
  task,
  presenter,
}: {
  task: SupervisionTask;
  presenter: RoutePlannerClientsPresenter;
}) {
  const person = task.person as Client;

  const {
    supervisionLevelShort,
    supervisionTooltip,
    type,
    scheduledStatus,
    isScheduled,
  } = presenter.getClientCardCopy(task);

  const isSelected = presenter.isPersonSelected(person);
  const ordinalRank = presenter.indexOfPerson(person) + 1;

  const hasAddress = person.formattedAddress !== undefined;
  const hasBadAddress = presenter.hasBadAddress(person);
  const isSelectable = hasAddress && !hasBadAddress;

  return (
    <BorderedClientCard
      $selectable={isSelectable}
      $selected={isSelected}
      onClick={async () => {
        if (!isSelectable) return;

        if (isSelected) {
          presenter.removePerson(person);
        } else {
          await presenter.addPerson(person);
        }
      }}
    >
      {isSelected ? (
        <NumberedCheckbox>
          <CheckboxContents>{ordinalRank}</CheckboxContents>
        </NumberedCheckbox>
      ) : (
        <EmptyCheckbox $selectable={isSelectable} />
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

            {person.formattedAddress ? (
              <>
                <a
                  href={presenter.mapsAddressLink(person.formattedAddress)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    // Prevent link clicks from also selecting the person's card
                    e.stopPropagation();
                  }}
                >
                  <SmallInfoLink>{person.address}</SmallInfoLink>
                </a>
                {hasBadAddress && (
                  <TooltipTrigger
                    contents={presenter.badAddressCopy}
                    maxWidth={340}
                  >
                    <InfoButton infoUrl={undefined} />
                  </TooltipTrigger>
                )}
              </>
            ) : (
              <SmallInfoText>No address on file</SmallInfoText>
            )}
          </InfoRow>
          <InfoRow>
            <TagsIcon />
            <SmallInfoText>{type}</SmallInfoText>
          </InfoRow>
        </AdditionalInfo>

        <SchedulingBadge
          color={isScheduled ? palette.slate10 : "rgb(244, 233, 215)"}
        >
          {scheduledStatus}
        </SchedulingBadge>
      </ClientInfo>

      {person.phoneNumber && (
        <TooltipTrigger contents={`Phone number: ${person.phoneNumber}`}>
          <PhoneIcon />
        </TooltipTrigger>
      )}
    </BorderedClientCard>
  );
});
