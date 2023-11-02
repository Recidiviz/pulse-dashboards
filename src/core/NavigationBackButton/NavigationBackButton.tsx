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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC } from "react";
import { Link } from "react-router-dom";
import styled, { css } from "styled-components/macro";

const sharedStyles = css`
  ${typography.Sans14};

  color: ${palette.slate85};
  display: block;
  min-height: 0;
  min-width: 0;
  padding: ${rem(spacing.lg)};
  padding-bottom: 0;
  transition: color ease 500ms;

  &:hover,
  &:focus {
    color: ${palette.pine2};
  }

  & i {
    font-size: 1rem;
    margin-right: ${rem(spacing.md)};
  }
`;

const BackLink = styled(Link)`
  ${sharedStyles}

  text-decoration: none !important;
`;

const BackButton = styled.button`
  ${sharedStyles}

  border: none;
  background: transparent;
`;

type NavigationBackButtonProps = {
  action: { url: string } | { onClick: () => void };
};

export const NavigationBackButton: FC<NavigationBackButtonProps> = ({
  children,
  action,
}) => {
  const buttonContents = (
    <>
      <i className="fa fa-angle-left" />
      {children}
    </>
  );

  if ("url" in action) {
    return <BackLink to={action.url}>{buttonContents}</BackLink>;
  }

  return <BackButton onClick={action.onClick}>{buttonContents}</BackButton>;
};
