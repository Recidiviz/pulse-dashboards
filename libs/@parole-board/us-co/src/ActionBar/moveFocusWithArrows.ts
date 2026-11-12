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

import type { KeyboardEvent } from "react";

/**
 * Moves focus to the next or previous enabled button in the element that
 * handles the event, on ArrowRight or ArrowLeft, wrapping at the ends.
 *
 * The ~design-system Toolbar takes every button inside it out of the tab
 * order and moves between its items with the arrow keys, focusing only the
 * first button of each item. A group of buttons that ActionBar renders as one
 * item, such as the delete question's "Cancel" and "Delete", calls this from
 * its onKeyDown so the arrow keys reach each of its buttons. With fewer than
 * two enabled buttons it leaves the event to the Toolbar.
 */
export function moveFocusWithArrows(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  const buttons = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>(
      "button:not(:disabled)",
    ),
  );
  const index = buttons.findIndex(
    (button) => button === document.activeElement,
  );
  if (buttons.length < 2 || index === -1) return;
  event.preventDefault();
  event.stopPropagation();
  const step = event.key === "ArrowRight" ? 1 : -1;
  buttons[(index + step + buttons.length) % buttons.length].focus();
}
