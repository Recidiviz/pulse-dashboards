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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { forwardRef } from "react";
import styled, { css } from "styled-components";

import { Icon, palette } from "~design-system";

import {
  DatePicker,
  MonthYearHeader,
} from "../../../../../components/DatePicker";
import { parseReportMonth, toReportMonth } from "./reportMonth";

const MonthInputRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
`;

const linkButtonStyles = css`
  ${typography.Sans14}
  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
  padding: 0;
  border: none;
  background: transparent;
  color: ${palette.pine4};
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    color: ${palette.pine3};
  }

  &:focus-visible {
    outline: 2px solid ${palette.signal.links};
    outline-offset: 2px;
    border-radius: ${rem(4)};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const MonthButton = styled.button.attrs({ type: "button" })`
  ${linkButtonStyles}
  font-weight: 500;
`;

const ClearButton = styled.button.attrs({ type: "button" })`
  ${linkButtonStyles}
  color: ${palette.slate60};
`;

// react-datepicker clones customInput with the formatted value and an onClick
// that opens the picker. The button ignores the other props it passes.
type MonthButtonInputProps = {
  value?: string;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
};

const MonthButtonInput = forwardRef<HTMLButtonElement, MonthButtonInputProps>(
  function MonthButtonInput({ value, onClick, disabled, label }, ref) {
    return (
      <MonthButton
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        aria-label={value ? `${label}: ${value}` : `Enter ${label}`}
      >
        <span>{value || "Enter Date"}</span>
        <Icon kind="CalendarSimple" size={12} color="currentColor" />
      </MonthButton>
    );
  },
);

/**
 * Lets the PHI pick a month and year, for a report field stored as YYYY-MM.
 * It shows "Enter Date" until a month is picked, then the month, such as
 * "Mar 2015", with a button that clears it.
 *
 * @param value - The month as YYYY-MM, or null when none is picked.
 * @param onChange - Receives the picked month as YYYY-MM, or null when the
 *   PHI clears it.
 * @param label - Names the field for screen readers, such as "Date".
 * @param disabled - Whether the input is disabled, such as while a save is
 *   in flight.
 */
export function ReportMonthInput({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value: string | null;
  onChange: (month: string | null) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <MonthInputRow>
      <DatePicker
        selected={value ? parseReportMonth(value) : null}
        onChange={(date: Date | null) =>
          onChange(date ? toReportMonth(date) : null)
        }
        showMonthYearPicker
        dateFormat="MMM yyyy"
        shouldCloseOnSelect
        // The picker opens on click or Enter, not when focus lands on the
        // button, such as when Add focuses a new row's first input.
        preventOpenOnFocus
        disabled={disabled}
        renderCustomHeader={(headerProps) => (
          <MonthYearHeader {...headerProps} />
        )}
        customInput={<MonthButtonInput label={label} />}
      />
      {value && !disabled && (
        <ClearButton
          aria-label={`Clear ${label}`}
          onClick={() => onChange(null)}
        >
          <Icon kind="Close" size={10} color="currentColor" />
        </ClearButton>
      )}
    </MonthInputRow>
  );
}
