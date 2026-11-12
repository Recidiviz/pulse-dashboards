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

import {
  CheckboxGridField,
  CheckboxGridItem,
  type ChoiceField,
} from "~@parole-board/common";

import type { AddMonthTile } from "../model/addMonthTiles";
import { toYearMonthParam } from "../model/month";
import { TilesScroll } from "./AddMonthModal.styles";

export type MonthTilesProps = {
  /** The tiles in order, as addMonthTiles builds them. */
  tiles: AddMonthTile[];
  /**
   * The form.Field that holds the selected months as "YYYY-MM" keys. Each
   * toggle writes the next keys back to it.
   */
  field: ChoiceField<readonly string[], string[]>;
  /** Disables every tile, such as while the months are being created. */
  disabled?: boolean;
};

/**
 * The month tiles in the Add a month dialog, four to a row: each month's name
 * with its year under it. A month that already exists reads "Already added"
 * in place of the year and can't be selected. Clicking a selected month
 * deselects it. Matches the month tiles in the Add a month dialog in the
 * Calendar Unit Dashboard design.
 */
export function MonthTiles({
  tiles,
  field,
  disabled = false,
}: MonthTilesProps) {
  return (
    <TilesScroll>
      <CheckboxGridField
        field={field}
        columns={4}
        ariaLabel="Months to draft"
        disabled={disabled}
      >
        {tiles.map((tile) => {
          const key = toYearMonthParam(tile);
          return (
            <CheckboxGridItem
              key={key}
              value={key}
              disabled={tile.alreadyAdded}
              description={tile.alreadyAdded ? "Already added" : tile.year}
            >
              {tile.label}
            </CheckboxGridItem>
          );
        })}
      </CheckboxGridField>
    </TilesScroll>
  );
}
