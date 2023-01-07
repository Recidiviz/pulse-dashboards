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
import {
  palette,
  Sans14,
  Sans16,
  Sans18,
  Sans24,
  spacing,
  TooltipTrigger,
} from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import styled, { css } from "styled-components/macro";

import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { JusticeInvolvedPersonAvatar } from "../Avatar";
import { Separator } from "../WorkflowsClientProfile/common";

export type JusticeInvolvedPersonCapsuleProps = {
  avatarSize: "md" | "lg";
  person: JusticeInvolvedPerson;
  status: React.ReactNode;
  textSize: "sm" | "lg";
  hideId?: boolean;
  hideTooltip?: boolean;
  nameHoverState?: boolean;
};

const PersonName = styled.span`
  color: ${palette.pine2};
`;

const PersonId = styled.span`
  color: ${palette.data.teal1};
`;

const Wrapper = styled.div<{ nameHoverState: boolean }>`
  align-items: center;
  column-gap: ${rem(spacing.sm)};
  display: grid;
  grid-template-columns: auto 1fr;
  ${(props) =>
    props.nameHoverState
      ? `&:hover {
          ${PersonName} {
            text-decoration: underline;
            color: ${palette.signal.links};
          }
        }`
      : ""}
`;

const PersonInfo = styled.div``;

const personStatusStyles = css`
  color: ${palette.slate60};
`;

const PersonStatusSm = styled(Sans14)`
  ${personStatusStyles}
  width: ${rem(288)};

  @media (max-width: 1372px) {
    width: ${rem(240)};
  }
`;

const PersonStatusLg = styled(Sans16)`
  ${personStatusStyles}
`;

const SIZES = {
  avatar: {
    md: 40,
    lg: 56,
  },
  identity: {
    sm: Sans18,
    lg: Sans24,
  },
  status: {
    sm: PersonStatusSm,
    lg: PersonStatusLg,
  },
};

export const JusticeInvolvedPersonCapsule: React.FC<
  JusticeInvolvedPersonCapsuleProps
> = ({
  avatarSize,
  person,
  status,
  textSize,
  hideId = false,
  hideTooltip = false,
  nameHoverState = true,
}) => {
  const IdentityEl = SIZES.identity[textSize];
  const StatusEl = SIZES.status[textSize];

  return (
    <Wrapper nameHoverState={nameHoverState}>
      <JusticeInvolvedPersonAvatar
        name={person.displayName}
        size={SIZES.avatar[avatarSize]}
      />
      <PersonInfo>
        <IdentityEl>
          <TooltipTrigger contents={!hideTooltip && "Go to profile"}>
            <PersonName className="PersonName fs-exclude">
              {person.displayName}
            </PersonName>
          </TooltipTrigger>
          {!hideId && (
            <React.Fragment key="personExternalId">
              <Separator> • </Separator>
              <PersonId className="fs-exclude">{person.externalId}</PersonId>
            </React.Fragment>
          )}
        </IdentityEl>
        <StatusEl className="WorkflowsStatus fs-exclude">{status}</StatusEl>
      </PersonInfo>
    </Wrapper>
  );
};
