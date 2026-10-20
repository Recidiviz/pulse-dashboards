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

import { palette, spacing, typography } from "~design-system";

// Rows and their colors follow NYC's ContactInformation.styles.tsx.
export const ContactRowList = styled.dl`
  display: flex;
  flex-direction: column;
  margin: 0;
`;

export const ContactRowWrapper = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${rem(spacing.xs)};
  padding: ${rem(spacing.md)} 0;
  border-bottom: 1px solid ${palette.slate20};
`;

export const ContactRowLabel = styled.dt`
  ${typography.Sans16}

  color: ${palette.slate80};
  flex-shrink: 0;
`;

export const ContactRowText = styled.dd`
  ${typography.Sans16}

  color: ${palette.pine1};
  margin: 0;
  overflow-wrap: anywhere;
`;
