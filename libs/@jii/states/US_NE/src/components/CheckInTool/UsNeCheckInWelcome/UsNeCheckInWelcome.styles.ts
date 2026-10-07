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

import { SlateCopy } from "~@jii/common-ui";
import { spacing, typography } from "~design-system";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};

  padding-top: ${rem(spacing.lg)};
`;

export const WelcomeHeading = styled.h2`
  ${typography.Serif34}
`;

export const Description = styled(SlateCopy)`
  margin-bottom: 0;

  & p:last-child {
    margin-bottom: 0;
  }
`;
