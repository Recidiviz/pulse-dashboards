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

import { palette, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC, ReactNode } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { PageContainer, UnpaddedPageContainer } from "../BaseLayout/BaseLayout";
import { Wordmark } from "../Wordmark/Wordmark";

const HeaderWrapper = styled(UnpaddedPageContainer)`
  border-bottom: 1px solid ${palette.slate20};
`;

const Header = styled(PageContainer).attrs({ as: "header" })`
  align-items: flex-start;
  display: flex;
  gap: ${rem(spacing.md)};
  padding-bottom: ${rem(spacing.md)};
  padding-top: ${rem(spacing.md)};
`;

const HeaderContent = styled.div`
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: ${rem(spacing.md)};

  > a {
    margin-right: auto;
  }
`;

export const PageHeader: FC<{ children: ReactNode }> = observer(
  function PageHeader({ children }) {
    return (
      <HeaderWrapper>
        <Header>
          <HeaderContent>
            <Link to="/">
              <Wordmark />
            </Link>
          </HeaderContent>
          {children}
        </Header>
      </HeaderWrapper>
    );
  },
);
