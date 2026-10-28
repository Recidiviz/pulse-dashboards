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

import { forwardRef, ReactNode, Ref } from "react";
import styled from "styled-components";

import {
  Radio,
  RadioGroup,
  type RadioGroupProps,
  type RadioProps,
} from "~design-system";

import { type GridColumnsProps, GridLayout, type TileSize } from "./GridLayout";
import { OptionLabel } from "./OptionLabel";
import { tileGroupStyles } from "./tileStyles";

export type RadioGridProps = RadioGroupProps & GridColumnsProps;

const StyledRadioGroup = styled(RadioGroup)<{ $size: TileSize }>`
  ${tileGroupStyles}
`;

/**
 * A grid of radio tiles for single-choice pickers, such as the meeting type,
 * facility and day in Add hearing. It is a ~design-system RadioGroup, so it
 * takes every RadioGroup prop and keeps its native radios and keyboard
 * behavior, with each option drawn as a bordered tile. Matches the facility
 * and day tiles in the Add a hearing dialog in the Calendar Unit Dashboard
 * design. Children are RadioGridItem options.
 */
export const RadioGrid = forwardRef(function RadioGrid(
  { columns, size = "regular", children, ...groupProps }: RadioGridProps,
  ref: Ref<HTMLDivElement>,
) {
  return (
    <StyledRadioGroup ref={ref} $size={size} {...groupProps}>
      <GridLayout $columns={columns} $size={size}>
        {children}
      </GridLayout>
    </StyledRadioGroup>
  );
});

export type RadioGridItemProps = RadioProps & {
  /** A second line under the name. */
  description?: ReactNode;
};

/** One tile in a RadioGrid: a ~design-system Radio with a tile label. */
export function RadioGridItem({
  children,
  description,
  ...radioProps
}: RadioGridItemProps) {
  return (
    <Radio {...radioProps}>
      <OptionLabel description={description}>{children}</OptionLabel>
    </Radio>
  );
}
