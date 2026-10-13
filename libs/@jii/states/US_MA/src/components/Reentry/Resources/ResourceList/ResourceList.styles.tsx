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

import { PageContainer } from "~@jii/common-ui";
import { palette, spacing, typography } from "~design-system";

// UsMaReentryLayout is a flex column, where PageContainer's auto margins would
// otherwise shrink the page to its content and widen it when a section opens.
export const Wrapper = styled(PageContainer)`
  width: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${rem(spacing.xl)};
  padding-bottom: ${rem(spacing.xl)};
  padding-top: ${rem(spacing.lg)};
`;

export const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
`;

export const PageTitle = styled.h1`
  ${typography.Serif34}

  color: ${palette.pine1};
  margin: 0;
`;

export const PageSubtitle = styled.p`
  ${typography.Sans16}

  color: ${palette.pine1};
  margin: 0;
`;

export const ResourceCount = styled.p`
  ${typography.Sans14}

  color: ${palette.slate80};
  margin: 0 0 ${rem(spacing.md)};
`;

export const AccordionList = styled.div`
  display: flex;
  flex-direction: column;
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
`;

export const EmptyState = styled.p`
  ${typography.Sans16}

  color: ${palette.slate80};
  margin: 0;
`;
