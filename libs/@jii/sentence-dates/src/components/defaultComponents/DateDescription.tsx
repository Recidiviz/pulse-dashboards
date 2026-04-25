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

import { FC } from "react";
import styled from "styled-components";

import { CopyWrapper } from "~@jii/common-ui";

import { DefaultProps } from "./types";

export type DateDescriptionProps = Omit<DefaultProps, "children"> & {
  children: string | undefined;
};

const StyledCopyWrapper = styled(CopyWrapper)`
  &,
  & > p:last-child {
    // prevents extra space at the bottom of the card
    margin-bottom: 0;
  }
`;

export const DateDescription: FC<DateDescriptionProps> = ({
  children,
  className,
}) => {
  return children ? (
    <StyledCopyWrapper
      {...{ children, className }}
      options={{ forceBlock: true }}
    />
  ) : null;
};
