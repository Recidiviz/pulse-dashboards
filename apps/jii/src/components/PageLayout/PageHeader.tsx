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

import { palette, spacing, zindex } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC, ReactNode } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import logoUrl from "../../assets/images/sunrise.svg";
import { PageContainer, UnpaddedPageContainer } from "../BaseLayout/BaseLayout";
import { AccountMenu } from "./AccountMenu";

const HeaderWrapper = styled(UnpaddedPageContainer)`
  background: ${palette.white};
  border-bottom: 1px solid ${palette.slate20};
  position: sticky;
  top: 0;
  z-index: ${zindex.modal.backdrop - 1};
`;

const LogoLink = styled(Link)``;

const Header = styled(PageContainer).attrs({ as: "header" })`
  align-items: center;
  display: flex;
  gap: ${rem(spacing.lg)};
  justify-content: stretch;
  min-height: ${rem(64)};

  ${LogoLink} {
    margin-right: auto;
  }
`;

export const PageHeader: FC<{ children: ReactNode }> = observer(
  function PageHeader({ children }) {
    return (
      <HeaderWrapper>
        <Header>
          <LogoLink to="/">
            <img src={logoUrl} alt="Opportunities" width="44" height="24" />
          </LogoLink>
          {children}
          <AccountMenu />
        </Header>
      </HeaderWrapper>
    );
  },
);
