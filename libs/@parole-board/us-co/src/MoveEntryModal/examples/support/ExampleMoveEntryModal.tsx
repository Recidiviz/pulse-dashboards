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

import { useEffect, useState } from "react";
import ReactModal from "react-modal";

import type { CalendarWeekday, EntryDto } from "~@parole-board/common";

import { isAllowedDay } from "../../../model/isAllowedDay";
import { alreadyOnByDay } from "../../../model/useMoveEntryFlow";
import { MoveEntryModal } from "../../MoveEntryModal";

// This file lives one folder below examples/ and isn't named *.examples.tsx,
// so the examples indexer doesn't read it as a story.

export type ExampleMoveEntryModalProps = {
  /** Every entry in the month, from september2026MonthDetail. */
  entries: readonly EntryDto[];
  /** The calendar's allowed weekdays, from september2026Config. */
  allowedWeekdays: readonly CalendarWeekday[];
  /** The ids of the entries that move, in selection order. */
  movingIds: readonly string[];
  /**
   * Picks this day, "YYYY-MM-DD", once the dialog opens, as an editor's
   * click would. The dialog keeps the chosen day in its form, so it can't be
   * set through a prop.
   */
  chooseDay?: string;
  /** The move the button sends; by default it succeeds at once. */
  send?: () => Promise<void>;
  /** Presses the move button after choosing the day, to show what follows. */
  submitAfterChoosing?: boolean;
};

/**
 * MoveEntryModal over the September 2026 fixture, with its props built as
 * useMoveToDialog builds them from the loaded month and the calendar config.
 */
export function ExampleMoveEntryModal({
  entries,
  allowedWeekdays,
  movingIds,
  chooseDay,
  send = () => Promise.resolve(),
  submitAfterChoosing = false,
}: ExampleMoveEntryModalProps) {
  // The Modal opens on the first render, so the app element is set before
  // it rather than in an effect, which would run after it.
  useState(() =>
    ReactModal.setAppElement(
      document.getElementById("storybook-root") ?? document.body,
    ),
  );
  const [isOpen, setOpen] = useState(true);

  // The Modal renders its contents a frame after it mounts, so the click
  // waits two frames for the day tiles.
  useEffect(() => {
    if (!chooseDay) return undefined;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const radio = document.querySelector<HTMLInputElement>(
          `input[type="radio"][value="${chooseDay}"]`,
        );
        radio?.focus();
        radio?.click();
        if (!submitAfterChoosing) return;
        // The day reaches the form on the click, and the button enables on
        // the render after it.
        frame = requestAnimationFrame(() => {
          document
            .querySelector<HTMLButtonElement>(
              '[role="dialog"] button[type="submit"]',
            )
            ?.click();
        });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [chooseDay, submitAfterChoosing]);

  const moving = movingIds.flatMap(
    (id) => entries.find((entry) => entry.id === id) ?? [],
  );
  const dates = new Set(moving.map(({ date }) => date));

  return (
    <MoveEntryModal
      isOpen={isOpen}
      month={{ year: 2026, month: 9 }}
      labels={moving.map(({ label }) => label)}
      currentDate={dates.size === 1 ? moving[0].date : null}
      isDisabled={(date) => !isAllowedDay(date, allowedWeekdays)}
      alreadyOn={alreadyOnByDay(entries, moving)}
      onCancel={() => setOpen(false)}
      onMove={async () => {
        await send();
        setOpen(false);
      }}
    />
  );
}
