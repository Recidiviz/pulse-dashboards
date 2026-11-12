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

import { forwardRef } from "react";

import { ParoleBoardButton } from "~@parole-board/common";
import { pluralize } from "~utils";

import { formatMonthDay } from "../model/month";

/** What "Move to…" moves: one entry, or several selected hearings. */
export type MoveToSelection =
  | {
      /** The selected entry's name as the grid shows it, such as "FCF". */
      label: string;
      /** The selected entry's day, "YYYY-MM-DD". */
      date: string;
    }
  | {
      /** How many hearings are selected, two or more. */
      count: number;
    };

export type MoveToButtonProps = MoveToSelection & {
  /** True while a move is in flight, so a second one can't start. */
  disabled?: boolean;
  /** Opens the "Move to…" dialog. */
  onClick: () => void;
};

/**
 * The action bar's "Move to…" button, the keyboard path for a move that the
 * grid otherwise does by drag. It is its own item in the bar, for one
 * selected entry or several. Its name starts with the visible
 * text, then says what moves, like the bar's other actions: "Move to…: FCF
 * on September 15" or "Move to…: 3 hearings".
 */
export const MoveToButton = forwardRef<HTMLButtonElement, MoveToButtonProps>(
  function MoveToButton({ disabled = false, onClick, ...selection }, ref) {
    const what =
      "count" in selection
        ? pluralize(selection.count, "hearing")
        : `${selection.label} on ${formatMonthDay(selection.date)}`;
    return (
      <ParoleBoardButton
        kind="secondary"
        ref={ref}
        aria-label={`Move to…: ${what}`}
        disabled={disabled}
        onClick={onClick}
      >
        Move to…
      </ParoleBoardButton>
    );
  },
);
