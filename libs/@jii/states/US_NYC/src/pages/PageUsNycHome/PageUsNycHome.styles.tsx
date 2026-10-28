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
import { palette, typography } from "~design-system";

export const PageContainer = styled(BasePageContainer)`
  display: flex;
  padding: ${rem(48)} ${rem(66)} ${rem(96)} ${rem(66)};
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(64)};
  align-self: stretch;
`;

export const SpacedSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(20)};
  align-self: stretch;
`;

export const PageHeader = styled.div`
  ${typography.Sans24};
  color: ${palette.pine1};
  font-weight: 500;

  align-self: stretch;
`;
