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

import { FC, ReactNode } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { Icon, palette } from "~design-system";

/**
 * A text-styled link with an arrow icon, for inline "go to" links
 * as opposed to GoButton which is button-styled
 */
const StyledGoLink = styled(Link)`
  display: flex;
  align-items: center;
  column-gap: 4px;
  color: ${palette.signal.links};
  text-decoration: none;

  &:hover,
  &:focus {
    text-decoration: underline;
  }
`;

export const GoLink: FC<{ children: ReactNode; to: string }> = ({
  children,
  to,
}) => {
  return (
    <StyledGoLink to={to}>
      <span>{children}</span>
      <Icon kind="Arrow" size={16} />
    </StyledGoLink>
  );
};
