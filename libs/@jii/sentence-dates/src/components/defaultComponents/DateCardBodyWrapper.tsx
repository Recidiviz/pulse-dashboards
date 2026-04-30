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

import { spacing } from "~design-system";

import { DateComponentDefaultProps } from "./types";
import { Wrapper } from "./Wrapper";

export type DateCardBodyWrapperProps = DateComponentDefaultProps;

/**
 * provides some default spacing between elements, mostly for common override scenarios
 * where we are appending extra elements below the description
 */
const StyledWrapper = styled(Wrapper)`
  display: grid;
  row-gap: ${rem(spacing.md)};
`;

export const DateCardBodyWrapper: FC<DateCardBodyWrapperProps> = ({
  children,
  className,
}) => {
  return children ? <StyledWrapper {...{ children, className }} /> : null;
};
