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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { CopyWrapper } from "../../../../components/CopyWrapper/CopyWrapper";

export const SectionHeading = styled.h2`
  ${typography.Sans24}

  color: ${palette.pine1};
  margin: ${rem(spacing.xl)} 0 ${rem(spacing.md)};
`;

export const SlateCopy = styled(CopyWrapper)`
  color: ${palette.slate85};
`;

export const CardHeading = styled.h3`
  ${typography.Sans18}

  align-items: center;
  display: flex;
  gap: 1em;
  justify-content: space-between;
  margin-bottom: ${rem(spacing.sm)};
`;

export const CardValue = styled.div`
  ${typography.Sans24};

  font-size: ${rem(34)};
`;
