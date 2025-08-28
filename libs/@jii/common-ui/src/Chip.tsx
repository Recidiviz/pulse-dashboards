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
import { rem, rgba } from "polished";
import { FC, ReactNode } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

const Wrapper = styled.span`
  ${typography.Sans14};

  display: inline-block;
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
  border-radius: ${rem(spacing.xs)};
  border-style: solid;
  border-width: ${rem(1)};
`;

const statusStyles = {
  green: {
    color: "#006908",
    backgroundColor: "#EFFFE5",
    borderColor: "#A6EB84",
  },
  yellow: {
    color: "#A82C00",
    backgroundColor: "#FFF8DE",
    borderColor: "#FCD579",
  },
  gray: {
    color: palette.slate85,
    backgroundColor: rgba(palette.slate, 0.05),
    borderColor: palette.slate30,
  },
};

export type ChipColor = keyof typeof statusStyles;

export const Chip: FC<{
  color: ChipColor;
  children: ReactNode;
}> = ({ color, children }) => {
  return <Wrapper style={statusStyles[color]}>{children}</Wrapper>;
};
