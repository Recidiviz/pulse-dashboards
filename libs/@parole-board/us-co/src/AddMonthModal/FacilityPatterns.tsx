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

import { useId, useState } from "react";

import { semantics } from "~@parole-board/common";
import { Icon } from "~design-system";
import { pluralize } from "~utils";

import {
  PatternDays,
  PatternList,
  PatternName,
  PatternRow,
  ToggleButton,
  ToggleLabel,
  ToggleState,
} from "./AddMonthModal.styles";

const { space } = semantics;

export type FacilityPatternRow = {
  /** A stable key for the row, such as the pattern's slot key. */
  id: string;
  /**
   * The row's name as shown: a location's label and full name, such as
   * "FCF — Fremont", or a meeting kind's label, such as "Full Board".
   */
  fullName: string;
  /** The standing days, such as "1st and 2nd Monday", or null for none. */
  days: string | null;
};

export type FacilityPatternsProps = {
  /** The rows in display order: locations first, then meeting kinds. */
  patterns: FacilityPatternRow[];
  /** The number of locations, which leaves out the meeting kinds' rows. */
  locationCount: number;
  /** Starts the list open. It starts collapsed otherwise. */
  defaultOpen?: boolean;
};

/**
 * The read-only Facility patterns list in the Add a month dialog, behind a
 * disclosure button that reads "Facility patterns · [N] locations". Open, it
 * lists each row's name and standing days, with no times. Matches the
 * Facility patterns section of the Add a month dialog in the Calendar Unit
 * Dashboard design.
 */
export function FacilityPatterns({
  patterns,
  locationCount,
  defaultOpen = false,
}: FacilityPatternsProps) {
  const [open, setOpen] = useState(defaultOpen);
  const listId = useId();

  return (
    <>
      <ToggleButton
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <ToggleLabel>
          <b>Facility patterns</b> · {pluralize(locationCount, "location")}
        </ToggleLabel>
        {/* aria-expanded already says whether the list is open, so the
            button's name stays the same either way. */}
        <ToggleState aria-hidden>
          {open ? "Hide" : "Show"}
          <Icon kind="Caret" size={space.sm} />
        </ToggleState>
      </ToggleButton>
      {open && (
        // The list scrolls past about eight rows, so it takes focus for
        // keyboard scrolling.
        <PatternList id={listId} aria-label="Facility patterns" tabIndex={0}>
          {patterns.map(({ id, fullName, days }) => (
            <PatternRow key={id}>
              <PatternName>{fullName}</PatternName>
              <PatternDays>{days ?? "No pattern"}</PatternDays>
            </PatternRow>
          ))}
        </PatternList>
      )}
    </>
  );
}
