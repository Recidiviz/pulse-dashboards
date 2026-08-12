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

import { FC, ReactNode } from "react";

import { pluralize } from "~utils";

import {
  TileCount,
  TileDisabled,
  TileLabel,
  TileLink,
} from "./CategoryTile.styles";

export type CategoryTileProps = {
  label: string;
  count: number;
  to: string;
  icon?: ReactNode;
  disabled?: boolean;
};

const CATEGORY_TILE_COPY = {
  resourceCount: (n: number) => pluralize(n, "resource"),
};

export const CategoryTile: FC<CategoryTileProps> = ({
  label,
  count,
  to,
  icon,
  disabled = false,
}) => {
  if (disabled) {
    return (
      <TileDisabled>
        {icon}
        <TileLabel>{label}</TileLabel>
      </TileDisabled>
    );
  }

  return (
    <TileLink to={to}>
      {icon}
      <TileLabel>{label}</TileLabel>
      <TileCount>{CATEGORY_TILE_COPY.resourceCount(count)}</TileCount>
    </TileLink>
  );
};
