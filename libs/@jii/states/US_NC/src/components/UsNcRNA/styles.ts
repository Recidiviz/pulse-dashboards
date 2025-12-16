// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { palette, spacing } from "~design-system";

export const RNAHeading = styled.h1`
  ${typography.Sans24};

  font-size: ${rem(34)};
`;

export const RNADescription = styled.div`
  color: ${palette.slate85};
  line-height: 1.7;

  margin-top: ${rem(spacing.lg)};
  &:not(:last-child) {
    margin-bottom: ${rem(spacing.lg)};
  }
`;
