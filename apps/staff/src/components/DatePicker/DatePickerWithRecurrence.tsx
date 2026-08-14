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

import * as React from "react";

import { DatePicker, DatePickerProps } from "./DatePicker";
import {
  buildRecurrenceRule,
  getRecurrenceCustomFields,
  getRecurrenceFreq,
  Recurrence,
  RecurrenceFreq,
  RecurrenceUnit,
  resolveRecurrenceRule,
} from "./recurrence";
import { RecurrenceFooter } from "./RecurrenceFooter";

export type DateWithRecurrence = {
  date: Date | null;
  recurrence: Recurrence;
};

export interface DatePickerWithRecurrenceProps
  extends Omit<
    DatePickerProps,
    "selected" | "onChange" | "calendarContainer" | "value"
  > {
  value: DateWithRecurrence;
  onChange: (next: DateWithRecurrence) => void;
}

/**
 * Date + recurrence picker. Wraps `DatePicker`, injects the "Repeat" footer
 * via the `children` slot, and bundles both inputs behind a single
 * `value` / `onChange` contract.
 *
 * The persisted `recurrence` is an iCal RRULE string (or `null` for one-off).
 * Which chip/custom-unit/custom-interval the footer shows is component-local
 * state, seeded once from the persisted RRULE on mount (so reopening an
 * existing custom recurrence shows "Custom" selected with the right unit and
 * interval) and from then on changed only by explicit chip/dropdown/stepper
 * interactions — never re-derived from `value` afterward. That's deliberate:
 * every one of our own edits round-trips back through the parent as a new
 * `value` prop, and re-deriving from it on every change would fight the
 * user's current selection instead of just reflecting it.
 */
export function DatePickerWithRecurrence({
  value,
  onChange,
  ...rest
}: DatePickerWithRecurrenceProps) {
  const [pendingFreq, setPendingFreq] = React.useState<RecurrenceFreq>(() =>
    getRecurrenceFreq(value.recurrence),
  );
  const [{ unit: customUnit, interval: customInterval }, setCustomFields] =
    React.useState(() => getRecurrenceCustomFields(value.recurrence));

  // Shared `onChange` shape for the handlers below.
  const emitChange = (date: Date | null, recurrence: Recurrence) => {
    onChange({ date: date ?? new Date(), recurrence });
  };

  const handleDateChange = (date: Date | null) => {
    emitChange(
      date,
      resolveRecurrenceRule(pendingFreq, date, customUnit, customInterval),
    );
  };

  const handleFreqChange = (freq: RecurrenceFreq) => {
    setPendingFreq(freq);
    if (freq !== "CUSTOM") {
      emitChange(value.date, buildRecurrenceRule(freq, value.date));
    }
  };

  const handleCustomFreqChange = (unit: RecurrenceUnit, interval: number) => {
    setCustomFields({ unit, interval });
    emitChange(value.date, buildRecurrenceRule(unit, value.date, interval));
  };

  // `DatePickerProps` is a discriminated union (plain / `selectsRange` /
  // `selectsMultiple`); spreading our `Omit<...>` subset can't be narrowed
  // back to a single arm, so we assemble the merged props object and cast
  // once at the call site. The Omit above ensures the props we re-wire
  // ourselves can't collide with the spread.
  const mergedProps = {
    ...rest,
    selected: value.date,
    onChange: handleDateChange,
    children: (
      <RecurrenceFooter
        selectedFreq={pendingFreq}
        anchorDate={value.date}
        onFreqChange={handleFreqChange}
        customInterval={customInterval}
        customUnit={customUnit}
        onCustomFreqChange={handleCustomFreqChange}
      />
    ),
  } as DatePickerProps;

  return <DatePicker {...mergedProps} />;
}
