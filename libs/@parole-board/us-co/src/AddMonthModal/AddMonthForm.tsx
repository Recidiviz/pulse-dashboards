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

import type { ChoiceField } from "~@parole-board/common";
import { ModalHeading } from "~design-system";

import type { AddMonthTile } from "../model/addMonthTiles";
import { NoOptionsMessage, Subtitle } from "./AddMonthModal.styles";
import { type FacilityPatternRow, FacilityPatterns } from "./FacilityPatterns";
import { MonthTiles } from "./MonthTiles";

export type AddMonthFormProps = {
  /** The month tiles in order, as addMonthTiles builds them. */
  tiles: AddMonthTile[];
  /** The form.Field that holds the selected months as "YYYY-MM" keys. */
  field: ChoiceField<readonly string[], string[]>;
  /** The Facility patterns rows, locations first. */
  patterns: FacilityPatternRow[];
  /** The number of locations among the patterns rows. */
  locationCount: number;
  /** Starts the Facility patterns list open. */
  patternsDefaultOpen?: boolean;
  /** Disables the tiles, such as while the months are being created. */
  disabled?: boolean;
};

/**
 * The fields of the Add a month dialog: the heading and subtitle, the month
 * tiles and the Facility patterns list. ModalForm adds the error and the
 * Cancel and Generate buttons below them. It renders from props only; its
 * container builds the tiles and creates the months. Matches the Add a month
 * dialog in the Calendar Unit Dashboard design, inside the standard
 * ~design-system Modal.
 */
export function AddMonthForm({
  tiles,
  field,
  patterns,
  locationCount,
  patternsDefaultOpen = false,
  disabled = false,
}: AddMonthFormProps) {
  const hasOptions = tiles.some(({ alreadyAdded }) => !alreadyAdded);
  const lastTile = tiles.at(-1);

  return (
    <>
      <ModalHeading>Add a month</ModalHeading>
      <Subtitle>
        Select one or more months to draft. You can adjust the default facility
        patterns later.
      </Subtitle>

      <MonthTiles tiles={tiles} field={field} disabled={disabled} />
      {!hasOptions && lastTile && (
        <NoOptionsMessage>
          {`Every month through ${lastTile.label} ${lastTile.year} already exists.`}
        </NoOptionsMessage>
      )}

      <FacilityPatterns
        patterns={patterns}
        locationCount={locationCount}
        defaultOpen={patternsDefaultOpen}
      />
    </>
  );
}
