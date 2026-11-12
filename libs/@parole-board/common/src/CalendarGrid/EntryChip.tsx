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
import {
  CancelledText,
  Chip,
  ChipTarget,
  VisuallyHidden,
} from "./CalendarGrid.styles";
import type { CalendarGridEntry, CalendarGridProps } from "./types";

type EntryTargetProps = {
  entry: CalendarGridEntry;
  /** The text the chip shows, which is also the hover title without entry.title. */
  label: string;
  selected: boolean;
  /** A move is saving the entry: aria-busy, and toggles are ignored. */
  busy?: boolean;
  /** Toggles are ignored, as on a day a move is saving. */
  disabled?: boolean;
  /** Without it, the chip is plain content: not focusable and not pressable. */
  onToggle?: (entryId: string) => void;
  children: ReactNode;
};

/**
 * Wraps a chip body with its hover title and, when the chip can be selected,
 * makes it a toggle button: focusable, with aria-pressed, toggled by Enter or
 * Space. FullCalendar's eventClick handles mouse clicks, so this adds no click
 * handler of its own and a click toggles once. A busy or disabled chip stays
 * focusable but says so with aria-disabled, and ignores the keys.
 */
export function EntryTarget({
  entry,
  label,
  selected,
  busy = false,
  disabled = false,
  onToggle,
  children,
}: EntryTargetProps) {
  const title = entry.title ?? label;
  const ariaBusy = busy || undefined;
  if (!onToggle) {
    return (
      <ChipTarget title={title} aria-busy={ariaBusy}>
        {children}
      </ChipTarget>
    );
  }
  const inert = busy || disabled;

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
    if (!inert) onToggle(entry.id);
  };

  const onKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " " && !inert) onToggle(entry.id);
  };

  return (
    <ChipTarget
      role="button"
      tabIndex={0}
      title={title}
      aria-pressed={selected}
      aria-busy={ariaBusy}
      aria-disabled={inert || undefined}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    >
      {children}
    </ChipTarget>
  );
}

/**
 * The default chip body: its label for every kind, "Cancelled" above it when
 * cancelled (a badge, or plain text when cancelledTag is "text"), and its
 * flag, if any, as a badge below. Screen readers hear "Full Board, cancelled"
 * rather than the tag first.
 */
export function EntryChip({
  entry,
  label,
  cancelledTag = "badge",
}: {
  entry: CalendarGridEntry;
  label: string;
  cancelledTag?: CalendarGridProps["cancelledTag"];
}) {
  return (
    <Chip $cancelled={entry.cancelled}>
      {entry.cancelled &&
        (cancelledTag === "text" ? (
          <CancelledText aria-hidden>Cancelled</CancelledText>
        ) : (
          <span aria-hidden>
            <Badge tone="error" size="sm">
              Cancelled
            </Badge>
          </span>
        ))}
      <span>
        {label}
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
