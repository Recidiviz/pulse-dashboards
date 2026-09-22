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

export const Wrapper = styled(PageContainer)`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  padding-bottom: ${rem(spacing.xl)};
  padding-top: ${rem(spacing.lg)};
`;

export const Greeting = styled.h1`
  ${typography.Serif24}

  color: ${palette.pine1};
  margin: 0;
`;
