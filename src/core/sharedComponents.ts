// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import {
  palette,
  Sans14,
  Sans18,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

export const Heading = styled.div<{ isMobile?: boolean }>`
  ${({ isMobile }) => (isMobile ? typography.Serif24 : typography.Serif34)}
  color: ${palette.pine2};
  padding-bottom: ${rem(spacing.md)};
`;

export const SubHeading = styled(Sans18)`
  color: ${palette.slate70};
  padding-bottom: ${rem(spacing.md)};
`;

export const SectionLabelText = styled(Sans14)`
  color: ${palette.slate60};
  margin-top: ${rem(spacing.xl)};
  border-bottom: 1px solid ${palette.slate20};
  padding-bottom: ${rem(spacing.sm)};
`;
