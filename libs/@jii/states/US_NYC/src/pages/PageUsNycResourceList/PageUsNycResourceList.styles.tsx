// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { rem } from "polished";
import styled from "styled-components";

import { PageContainer as BasePageContainer } from "~@jii/common-ui";
import { Icon, palette, spacing, typography } from "~design-system";

export const PageContainer = styled(BasePageContainer)`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
`;

export const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const PageTitle = styled.h1`
  ${typography.Sans24}
  color: ${palette.pine1};
  margin: 0;
`;

export const PageSubtitle = styled.p`
  ${typography.Sans14}
  color: ${palette.pine1};
  margin: 0;
`;

export const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  flex-wrap: wrap;
`;

export const ActiveChipsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
  flex-wrap: wrap;
`;

export const ResourceCount = styled.p`
  ${typography.Sans14}
  color: ${palette.slate80};
  margin: 0;
`;

export const AccordionList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: -${rem(spacing.sm)};
`;

export const AccordionItem = styled.div`
  border-bottom: 1px solid ${palette.slate20};

  &:first-child {
    border-top: 1px solid ${palette.slate20};
  }
`;

export const ResourceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  margin-top: ${rem(spacing.md)};
`;

export const SheetTitle = styled.h2`
  ${typography.Sans18}
  color: ${palette.pine1};
  margin: 0 0 ${rem(spacing.sm)};
`;

export const SheetSubtitle = styled.p`
  ${typography.Sans14}
  color: ${palette.pine1};
  margin: 0 0 ${rem(spacing.xl)};
`;

export const FilterGroupLabel = styled.h3`
  ${typography.Sans16}
  color: ${palette.pine1};
  margin: 0 0 ${rem(spacing.sm)};
`;

export const FilterChipsGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.xs)};
  margin-bottom: ${rem(spacing.xl)};
`;

export const SheetComingSoon = styled.p`
  ${typography.Sans14}
  color: ${palette.slate70};
  margin: 0;
`;

export const DismissIcon = styled(Icon).attrs({ kind: "Close", size: 10 })<{
  kind?: never;
}>`
  margin-left: ${rem(spacing.sm)};
  flex-shrink: 0;
`;
