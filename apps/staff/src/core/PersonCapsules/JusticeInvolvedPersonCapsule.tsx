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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import useClipboard from "react-use-clipboard";
import styled, { css } from "styled-components/macro";

import copyIcon from "../../assets/static/images/copy.svg";
import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { PersonInitialsAvatar } from "../Avatar";
import { Separator } from "../WorkflowsJusticeInvolvedPersonProfile/styles";

export type JusticeInvolvedPersonCapsuleProps = {
  avatarSize: "md" | "lg";
  person: JusticeInvolvedPerson;
  status: React.ReactNode;
  textSize: "sm" | "lg";
  profileLink?: string;
  hideId?: boolean;
  nameHoverState?: boolean;
};

const PersonName = styled.span`
  color: ${palette.pine2};
`;

const PersonId = styled.span`
  color: ${palette.data.teal1};
  padding: 0 ${rem(spacing.xs)};
  border-radius: ${rem(spacing.xs / 2)};
  transition: all 0.3s ease;

  &::after {
    content: url(${copyIcon});
    margin-left: ${rem(spacing.sm)};
  }
  &:hover {
    background: rgba(53, 83, 98, 0.05);
    cursor: pointer;
  }
  &:active {
    background: ${palette.slate20};
    cursor: pointer;
  }
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
  color: ${palette.slate70};
  text-wrap: balance;
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

const StyledLink = styled(Link)`
  &:hover ${PersonName} {
    text-decoration: underline;
    color: ${palette.signal.links};
  }
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

const ProfileLinkWrapper: React.FC<{
  link: string;
  children: React.ReactElement;
}> = ({ link, children }) => (
  <StyledLink className="PersonProfileLink" to={link}>
    <TooltipTrigger contents="Go to profile">{children}</TooltipTrigger>
  </StyledLink>
);

export const JusticeInvolvedPersonCapsule = observer(
  function JusticeInvolvedPersonCapsule({
    avatarSize,
    person,
    status,
    textSize,
    profileLink,
    hideId = false,
    nameHoverState = true,
  }: JusticeInvolvedPersonCapsuleProps): JSX.Element {
    const [isCopied, copyToClipboard] = useClipboard(person.displayId, {
      successDuration: 5000,
    });

    useEffect(() => {
      if (isCopied) toast("DOC ID copied!", { duration: 5000 });
    }, [isCopied]);

    const IdentityEl = SIZES.identity[textSize];
    const StatusEl = SIZES.status[textSize];

    return (
      <Wrapper nameHoverState={nameHoverState}>
        {profileLink ? (
          <ProfileLinkWrapper link={profileLink}>
            <PersonInitialsAvatar
              name={person.displayPreferredName}
              size={SIZES.avatar[avatarSize]}
            />
          </ProfileLinkWrapper>
        ) : (
          <PersonInitialsAvatar
            name={person.displayPreferredName}
            size={SIZES.avatar[avatarSize]}
          />
        )}
        <PersonInfo>
          <IdentityEl>
            {profileLink ? (
              <ProfileLinkWrapper link={profileLink}>
                <PersonName className="PersonName fs-exclude">
                  {person.displayPreferredName}
                </PersonName>
              </ProfileLinkWrapper>
            ) : (
              <PersonName className="PersonName fs-exclude">
                {person.displayPreferredName}
              </PersonName>
            )}
            {!hideId && (
              <>
                <Separator> </Separator>
                <PersonId
                  title="Copy DOC ID to clipboard"
                  className="fs-exclude"
                  onClick={() => copyToClipboard()}
                >
                  {person.displayId}
                </PersonId>
              </>
            )}
          </IdentityEl>
          <StatusEl
            className={`WorkflowsStatus__${person.externalId} fs-exclude`}
          >
            {status}
          </StatusEl>
        </PersonInfo>
      </Wrapper>
    );
  },
);
