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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

export const Wrapper = styled.div`
  ${typography.Sans14};
`;

const PreviousPage = styled(Link)`
  color: ${palette.signal.links};

  &:hover,
  &:focus {
    color: ${palette.signal.links};
    border-bottom: 1px solid ${palette.signal.links};
  }
`;

const Separator = styled.span`
  color: ${palette.slate85};
  padding: 0 ${rem(spacing.xs)};
`;

const CurrentPage = styled.span`
  color: ${palette.slate85};
`;
type Page = {
  title: string;
  url: string;
};

type InsightsBreadcrumbsProps = {
  previousPages: Page[];
  children?: ReactNode;
};

export const InsightsBreadcrumbs: React.FC<InsightsBreadcrumbsProps> = ({
  previousPages,
  children,
}) => {
  return (
    <Wrapper>
      {previousPages.map((page, index) => (
        // eslint-disable-next-line react/no-array-index-key
        (<React.Fragment key={index}>
          <PreviousPage to={page.url}>{page.title}</PreviousPage>
          {index < previousPages.length - 1 && <Separator>/</Separator>}
        </React.Fragment>)
      ))}
      <Separator>/</Separator>
      <CurrentPage>{children}</CurrentPage>
    </Wrapper>
  );
};
