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

import type { KeyboardEvent, ReactNode } from "react";

import { Badge } from "../components/Badge";
import { Chip, ChipTarget, VisuallyHidden } from "./CalendarGrid.styles";
import type { CalendarGridEntry } from "./types";

type EntryTargetProps = {
  entry: CalendarGridEntry;
  selected: boolean;
  /** Without it, the chip is plain content: not focusable and not pressable. */
  onToggle?: (entryId: string) => void;
  children: ReactNode;
};

/**
 * Wraps a chip body with its hover title and, when the chip can be selected,
 * makes it a toggle button: focusable, with aria-pressed, toggled by Enter or
 * Space. FullCalendar's eventClick handles mouse clicks, so this adds no click
 * handler of its own and a click toggles once.
 */
export function EntryTarget({
  entry,
  selected,
  onToggle,
  children,
}: EntryTargetProps) {
  const title = entry.title ?? entry.label;
  if (!onToggle) return <ChipTarget title={title}>{children}</ChipTarget>;

  // As a native button does: Enter acts on keydown and Space on keyup, and a
  // held key doesn't repeat the toggle.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " ") {
      // Space would otherwise scroll the page.
      event.preventDefault();
      return;
    }
    if (event.key !== "Enter" || event.repeat) return;
    event.preventDefault();
    onToggle(entry.id);
  };

  const onKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " ") onToggle(entry.id);
  };

  return (
    <ChipTarget
      role="button"
      tabIndex={0}
      title={title}
      aria-pressed={selected}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    >
      {children}
    </ChipTarget>
  );
}

/**
 * The default chip body: the entry's label for every kind, a "Cancelled"
 * badge above it when cancelled, and its flag, if any, as a badge below.
 * Screen readers hear "Full Board, cancelled" rather than the badge first.
 */
export function EntryChip({ entry }: { entry: CalendarGridEntry }) {
  return (
    <Chip $cancelled={entry.cancelled}>
      {entry.cancelled && (
        <span aria-hidden>
          <Badge tone="error" size="sm">
            Cancelled
          </Badge>
        </span>
      )}
      <span>
        {entry.label}
        {entry.cancelled && <VisuallyHidden>, cancelled</VisuallyHidden>}
      </span>
      {entry.flag && (
        <Badge tone="warning" size="sm" uppercase={false}>
          {entry.flag}
        </Badge>
      )}
    </Chip>
  );
}
