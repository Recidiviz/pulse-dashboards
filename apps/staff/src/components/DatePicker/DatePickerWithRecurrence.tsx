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
  getRecurrenceFreq,
  Recurrence,
  RecurrenceFreq,
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

// Module-level so it keeps stable identity across renders — react-datepicker
// treats `calendarContainer` as a component type, and a fresh function each
// render would force an unnecessary remount of the popper subtree.
type FooterContainerProps = {
  className?: string;
  children?: React.ReactNode;
  selectedFreq: RecurrenceFreq;
  anchorDate: Date | null;
  onFreqChange: (freq: RecurrenceFreq) => void;
};

const FooterContainer: React.FC<FooterContainerProps> = ({
  className,
  children,
  selectedFreq,
  anchorDate,
  onFreqChange,
}) => (
  <div className={className}>
    {children}
    <RecurrenceFooter
      selectedFreq={selectedFreq}
      anchorDate={anchorDate}
      onFreqChange={onFreqChange}
    />
  </div>
);

/**
 * Date + recurrence picker. Wraps `DatePicker`, injects the "Repeat" footer
 * via the `calendarContainer` slot, and bundles both inputs behind a single
 * `value` / `onChange` contract.
 *
 * The persisted `recurrence` is an iCal RRULE string (or `null` for one-off).
 * The pending chip selection — i.e., the user picking "Every week" before
 * picking a date — lives in component-local state so it survives across the
 * intermediate render where the resolved RRULE is still `null`. Once both
 * inputs are present, `buildRecurrenceRule` resolves them to a string and
 * the parent receives a fully-derived `DateWithRecurrence`.
 */
export function DatePickerWithRecurrence({
  value,
  onChange,
  ...rest
}: DatePickerWithRecurrenceProps) {
  // Pending freq survives chip clicks that emit `recurrence: null` (because
  // there's no anchor yet). Initialised from the stored rrule; re-synced
  // when the parent supplies a non-null rrule (e.g. edit-mode hydration).
  const [pendingFreq, setPendingFreq] = React.useState<RecurrenceFreq>(() =>
    getRecurrenceFreq(value.recurrence),
  );

  React.useEffect(() => {
    if (value.recurrence !== null) {
      setPendingFreq(getRecurrenceFreq(value.recurrence));
    }
  }, [value.recurrence]);

  const handleDateChange = (date: Date | null) => {
    onChange({
      date: date ?? new Date(),
      recurrence: buildRecurrenceRule(pendingFreq, date),
    });
  };

  const handleFreqChange = (freq: RecurrenceFreq) => {
    setPendingFreq(freq);
    onChange({
      date: value.date ?? new Date(),
      recurrence: buildRecurrenceRule(freq, value.date),
    });
  };

  const calendarContainer = React.useCallback(
    ({
      className,
      children,
    }: {
      className?: string;
      children?: React.ReactNode;
    }) => (
      <FooterContainer
        className={className}
        selectedFreq={pendingFreq}
        anchorDate={value.date}
        onFreqChange={handleFreqChange}
      >
        {children}
      </FooterContainer>
    ),
    // `handleFreqChange` closes over the current onChange + value; intentionally
    // narrow deps so we re-render only when the inputs to the footer change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingFreq, value.date],
  );

  // `DatePickerProps` is a discriminated union (plain / `selectsRange` /
  // `selectsMultiple`); spreading our `Omit<...>` subset can't be narrowed
  // back to a single arm, so we assemble the merged props object and cast
  // once at the call site. The Omit above ensures the props we re-wire
  // ourselves can't collide with the spread.
  const mergedProps = {
    ...rest,
    selected: value.date,
    onChange: handleDateChange,
    calendarContainer,
  } as DatePickerProps;

  return <DatePicker {...mergedProps} />;
}
