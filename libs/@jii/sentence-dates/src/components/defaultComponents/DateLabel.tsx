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
import { FC } from "react";
import styled from "styled-components";

import { spacing, typography } from "~design-system";

import { DefaultProps } from "./types";

export type DateLabelProps = DefaultProps;

const Heading = styled.h3`
  ${typography.Sans18}

  margin: 0 0 ${rem(spacing.sm)};
`;

export const DateLabel: FC<DateLabelProps> = (props) => {
  return <Heading {...props} />;
};
