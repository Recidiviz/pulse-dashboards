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

import { FullBleedContainer, PageContainer } from "~@jii/common-ui";
import { palette, spacing, typography } from "~design-system";

export const Wrapper = styled(FullBleedContainer).attrs({ as: "footer" })`
  background: ${palette.marble3};
  margin-top: auto;
`;

export const Content = styled(PageContainer)`
  padding-bottom: ${rem(spacing.lg)};
  padding-top: ${rem(spacing.lg)};
`;

export const Heading = styled.h2`
  ${typography.Sans14}

  color: ${palette.pine4};
  font-weight: 600;
  margin: 0 0 ${rem(spacing.xs)};
`;

export const Body = styled.p`
  ${typography.Sans14}

  color: ${palette.slate85};
  margin: 0;
`;
