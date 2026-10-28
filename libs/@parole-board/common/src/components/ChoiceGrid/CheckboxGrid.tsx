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
  Checkbox,
  CheckboxGroup,
  type CheckboxGroupProps,
  type CheckboxProps,
} from "~design-system";

import { type GridColumnsProps, GridLayout, type TileSize } from "./GridLayout";
import { OptionLabel } from "./OptionLabel";
import { tileGroupStyles } from "./tileStyles";

export type CheckboxGridProps = CheckboxGroupProps & GridColumnsProps;

const StyledCheckboxGroup = styled(CheckboxGroup)<{ $size: TileSize }>`
  ${tileGroupStyles}
`;

/**
 * A grid of checkbox tiles for multi-select pickers, such as the months in Add
 * month. It is a ~design-system CheckboxGroup, so it takes every CheckboxGroup
 * prop and keeps its native checkboxes and keyboard behavior, with each option
 * drawn as a bordered tile. Matches the month tiles in the Add a month dialog
 * in the Calendar Unit Dashboard design. Children are CheckboxGridItem options.
 */
export const CheckboxGrid = forwardRef(function CheckboxGrid(
  { columns, size = "regular", children, ...groupProps }: CheckboxGridProps,
  ref: Ref<HTMLDivElement>,
) {
  return (
    <StyledCheckboxGroup ref={ref} $size={size} {...groupProps}>
      <GridLayout $columns={columns} $size={size}>
        {children}
      </GridLayout>
    </StyledCheckboxGroup>
  );
});

export type CheckboxGridItemProps = Omit<CheckboxProps, "children"> & {
  /** The option's name, such as "October". */
  children: ReactNode;
  /** A second line under the name, such as "2026". */
  description?: ReactNode;
};

/** One tile in a CheckboxGrid: a ~design-system Checkbox with a tile label. */
export function CheckboxGridItem({
  children,
  description,
  ...checkboxProps
}: CheckboxGridItemProps) {
  return (
    <Checkbox {...checkboxProps}>
      <OptionLabel description={description}>{children}</OptionLabel>
    </Checkbox>
  );
}
