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

import { semantics } from "../../theme";

const { space, tile } = semantics;

/**
 * "regular" tiles share the row in equal columns, for months, meeting types
 * and facilities. "compact" tiles are small fixed squares, for days.
 */
export type TileSize = "regular" | "compact";

export type GridColumnsProps = {
  /**
   * Number of tiles per row. A fractional count rounds down, and anything
   * under 1 (or not finite) gives one column.
   */
  columns: number;
  /** Tile size for every option in the group. Defaults to "regular". */
  size?: TileSize;
};

function columnCount(columns: number) {
  return Number.isFinite(columns) && columns >= 1 ? Math.floor(columns) : 1;
}

function gridColumns(columns: number, size: TileSize) {
  const track = size === "compact" ? tile.compactWidth : "minmax(0, 1fr)";
  return `repeat(${columnCount(columns)}, ${track})`;
}

// TODO(CO-935): Waiting on ~design-system to add a columns layout to CheckboxGroup and RadioGroup. Pass columns to the DS group and delete GridLayout once it lands.
/**
 * Lays a ~design-system group's tiles out in columns. It sits inside the
 * group's root, so the group keeps its keyboard handling.
 */
export const GridLayout = styled.div<{ $columns: number; $size: TileSize }>`
  display: grid;
  flex: 1 1 100%;
  grid-template-columns: ${({ $columns, $size }) =>
    gridColumns($columns, $size)};
  align-items: stretch;
  gap: ${({ $size }) =>
    $size === "compact" ? tile.compactGap : rem(space.sm)};
`;
