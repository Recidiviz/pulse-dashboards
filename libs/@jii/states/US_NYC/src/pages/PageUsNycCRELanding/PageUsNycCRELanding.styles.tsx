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
import { palette, spacing, typography } from "~design-system";

export const PageContainer = styled(BasePageContainer)`
  padding-top: ${rem(spacing.xl)};
  padding-bottom: ${rem(spacing.xl)};
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xxl)};
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

export const GridSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const SectionHeading = styled.h2`
  ${typography.Sans16}
  color: ${palette.pine1};
  margin: 0;
`;

export const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${rem(spacing.sm)};
`;

export const EmptyState = styled.p`
  ${typography.Sans14}
  color: ${palette.slate60};
  margin: 0;
`;
