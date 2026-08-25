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
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
`;

export const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
`;

export const SourceAttribution = styled.p`
  ${typography.Sans12}
  color: ${palette.slate80};
  margin: 0;
`;

export const PageTitle = styled.h1`
  ${typography.Sans24}
  color: ${palette.pine1};
  margin: 0;
`;

export const SectionHeading = styled.h2`
  ${typography.Sans16}
  font-weight: 600;
  color: ${palette.pine1};
  margin: 0;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const ChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.sm)};
`;

export const SimilarResourceList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const SeeAllButtonWrapper = styled.div`
  margin: 0 auto;
`;
