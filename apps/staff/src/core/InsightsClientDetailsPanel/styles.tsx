// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

export const Wrapper = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
  border-top: ${rem(1)} solid ${palette.slate10};
  overflow-y: hidden;
`;

export const Title = styled.div`
  ${typography.Sans16};
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.md)};
`;

export const Code = styled.span`
  color: ${palette.slate85};
`;

export const Separator = styled.span`
  color: ${palette.slate85};
`;

export const Description = styled.span`
  color: ${palette.slate60};
`;
