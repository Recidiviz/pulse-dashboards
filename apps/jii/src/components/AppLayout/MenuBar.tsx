// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC, ReactNode } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import logoUrl from "../../assets/images/sunrise.svg";
import { AccountMenu } from "./AccountMenu";
import { HeaderBarContainer } from "./HeaderBarContainer";

const LogoLink = styled(Link)``;

const Header = styled.div`
  align-items: center;
  display: flex;
  gap: ${rem(spacing.lg)};
  justify-content: stretch;
  min-height: ${rem(64)};

  ${LogoLink} {
    margin-right: auto;
  }
`;

export const MenuBar: FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <HeaderBarContainer>
      <Header>
        <LogoLink to="/">
          <img src={logoUrl} alt="Opportunities" width="44" height="24" />
        </LogoLink>
        {children}
        <AccountMenu />
      </Header>
    </HeaderBarContainer>
  );
};
