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

import { hideVisually } from "polished";
import type { ReactNode } from "react";
import styled from "styled-components";

import {
  type CalendarMonthRef,
  RadioGrid,
  RadioGridItem,
} from "~@parole-board/common";

import { formatMonthName, monthDays } from "../model/month";

const VisuallyHidden = styled.span`
  ${hideVisually()}
`;

export interface DayPickerProps {
  month: CalendarMonthRef;
  /** The chosen day as "YYYY-MM-DD", or null when none is chosen. */
  value: string | null;
  onChange: (date: string) => void;
  /**
   * Whether a day, "YYYY-MM-DD", can't be chosen. Callers pass isAllowedDay
   * with the calendar's allowed weekdays.
   */
  isDisabled?: (date: string) => boolean;
  /** The group's accessible name, such as "Day". */
  legend: string;
  /**
   * The id of a visible label that names the group. When set, it names the
   * group in place of legend.
   */
  labelledBy?: string;
  /** Disables every day, for example while an add is in flight. */
  disabled?: boolean;
  /**
   * A visible caption under a day's number, or nothing. "Move to…" uses it
   * to mark the day the hearing is on now.
   */
  renderDayCaption?: (date: string) => ReactNode;
  /**
   * Text that screen readers hear in parentheses after a day's date, or
   * nothing, such as "already has FCF" for a day that can't take the hearing.
   */
  dayNote?: (date: string) => string | undefined;
}

/**
 * Radio tiles for each day of a month, 7 to a row, for choosing a day in the
 * Add hearing and "Move to…" dialogs. Each tile shows the day number and is
 * named with the month too ("September 14"), so a screen reader announces a
 * date rather than a bare number. Arrow keys move between the days that
 * aren't disabled. Matches the day tiles in the Add a hearing dialog in the
 * Calendar Unit Dashboard design, 7 per row to fit the standard Modal width.
 */
export function DayPicker({
  month,
  value,
  onChange,
  isDisabled,
  legend,
  labelledBy,
  disabled,
  renderDayCaption,
  dayNote,
}: DayPickerProps) {
  const monthName = formatMonthName(month);
  return (
    <RadioGrid
      columns={7}
      ariaLabel={legend}
      ariaLabelledBy={labelledBy}
      value={value ?? undefined}
      onChange={onChange}
      disabled={disabled}
    >
      {monthDays(month).map((date) => {
        const note = dayNote?.(date);
        return (
          <RadioGridItem
            key={date}
            value={date}
            disabled={isDisabled?.(date) ?? false}
            description={renderDayCaption?.(date)}
          >
            <VisuallyHidden>{`${monthName} `}</VisuallyHidden>
            {Number(date.slice(-2))}
            {note && <VisuallyHidden>{` (${note})`}</VisuallyHidden>}
          </RadioGridItem>
        );
      })}
    </RadioGrid>
  );
}
