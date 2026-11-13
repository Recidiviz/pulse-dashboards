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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { Dropdown, DropdownMenuItem } from "~design-system";

import {
  ReportClearButton,
  ReportDropdownMenu,
  ReportDropdownToggle,
} from "./reportFieldControls";

const SelectRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
`;

export type ReportSelectOption<Value extends string | number> = {
  value: Value;
  label: string;
};

/**
 * Lets the PHI pick one option for a field on a report row, such as a
 * substance's Age of First Use. Unlike ReportDropdown, it saves nothing
 * itself: the row list saves the picked option along with the rest of the
 * row. Once an option is picked, a button beside it clears the field.
 *
 * @param value - The picked option's value, or null when none is picked.
 * @param onChange - Receives the picked option's value, or null when the PHI
 *   clears it.
 * @param options - The options, in the order the menu lists them.
 * @param label - Names the field for screen readers, such as "Age of First
 *   Use".
 * @param disabled - Whether the input is disabled, such as while a save is
 *   in flight.
 * @param placeholder - Shows on the toggle before the PHI picks an option.
 */
export function ReportSelectInput<Value extends string | number>({
  value,
  onChange,
  options,
  label,
  disabled = false,
  placeholder = "Select",
}: {
  value: Value | null;
  onChange: (value: Value | null) => void;
  options: ReadonlyArray<ReportSelectOption<Value>>;
  label: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const pickedLabel = options.find((option) => option.value === value)?.label;

  return (
    <SelectRow>
      <Dropdown>
        <ReportDropdownToggle
          aria-label={`${label}: ${pickedLabel ?? placeholder}`}
          disabled={disabled}
        >
          {pickedLabel ?? placeholder}
        </ReportDropdownToggle>
        <ReportDropdownMenu ariaLabel={label}>
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </ReportDropdownMenu>
      </Dropdown>
      {pickedLabel !== undefined && !disabled && (
        <ReportClearButton label={label} onClick={() => onChange(null)} />
      )}
    </SelectRow>
  );
}
