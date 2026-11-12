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

/** About half a second at 60 frames a second. */
const MAX_FRAMES = 30;

/**
 * Moves focus to the first selected chip on date, "YYYY-MM-DD", inside
 * container, after "Move to…" puts the selected entries there. The grid
 * redraws its chips a frame or more after the updated month renders, so it
 * waits for a selected chip in that day's cell, up to MAX_FRAMES frames. The
 * list view has no day cells, so after that it focuses the first selected
 * chip anywhere in container.
 */
export function focusMovedChip(
  container: HTMLElement | null,
  date: string,
): void {
  const selectedChip = '[role="button"][aria-pressed="true"]';
  let frames = 0;
  const attempt = () => {
    if (!container) return;
    const onDay = container.querySelector<HTMLElement>(
      `[data-date="${date}"] ${selectedChip}`,
    );
    if (onDay) {
      onDay.focus();
      return;
    }
    frames += 1;
    if (frames < MAX_FRAMES) {
      requestAnimationFrame(attempt);
      return;
    }
    container.querySelector<HTMLElement>(selectedChip)?.focus();
  };
  requestAnimationFrame(attempt);
}
