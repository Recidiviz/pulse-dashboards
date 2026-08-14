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

import { typography } from "@recidiviz/design-system";
import { useMemo } from "react";
import styled, { css } from "styled-components";

import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  palette,
} from "~design-system";

import { NumberStepper } from "../NumberStepper";
import {
  describeRecurrence,
  RecurrenceFreq,
  RecurrenceUnit,
  resolveRecurrenceRule,
} from "./recurrence";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px 16px;
  max-width: 20rem;
  border-top: 1px solid ${palette.slate05};
  background: ${palette.marble1};
`;

const Label = styled.div`
  ${typography.Sans14};
  color: ${palette.pine2};
  font-weight: 500;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

// Design-system `Button` (`kind="secondary"`, `shape="pill"`) handles the
// pill border-radius, cursor, transition, and hover/focus/disabled chrome.
// We tighten the sizing down to chip-scale (the default pill is 129×40 —
// far too large for a 5-up chip row) and re-tint the borders / text to
// match Figma. Selected chips invert to pine4 fill via the `$selected`
// branch below.
const Chip = styled(Button).attrs({
  kind: "secondary" as const,
  shape: "pill" as const,
  type: "button" as const,
})<{ $selected: boolean }>`
  ${typography.Sans12};
  min-width: 0;
  min-height: 0;
  padding: 4px 12px;
  line-height: 1.2;
  color: ${palette.pine2};
  border-color: ${palette.slate20};

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    background-color: transparent;
    border-color: ${palette.pine4};
    color: ${palette.pine4};
  }

  ${({ $selected }) =>
    $selected &&
    css`
      &,
      &:active,
      &:hover:not(:disabled),
      &:focus-visible:not(:disabled) {
        background: ${palette.marble5};
        border-color: ${palette.pine4};
        color: ${palette.pine4};
        font-weight: 500;
      }
    `}
`;

const Hint = styled.div`
  ${typography.Sans12};
  color: ${palette.slate70};
  font-style: italic;
`;

const CustomFrequencyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: ${palette.slate05};
  padding: 8px;
  border-radius: 4px;
`;

const CustomFrequencyButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  color: ${palette.slate80};
`;

const UnitDropdownToggle = styled(DropdownToggle)`
  background-color: ${palette.marble1};
`;

const FREQ_OPTIONS: ReadonlyArray<{ freq: RecurrenceFreq; label: string }> = [
  { freq: "NONE", label: "None" },
  { freq: "WEEKLY", label: "Every week" },
  { freq: "MONTHLY", label: "Every month" },
  { freq: "YEARLY", label: "Every year" },
  { freq: "CUSTOM", label: "Custom" },
];

const CUSTOM_FREQUENCY_OPTIONS: ReadonlyArray<{
  freq: RecurrenceUnit;
  label: string;
}> = [
  { freq: "DAILY", label: "day(s)" },
  { freq: "WEEKLY", label: "week(s)" },
  { freq: "MONTHLY", label: "month(s)" },
  { freq: "YEARLY", label: "year(s)" },
];

export interface RecurrenceFooterProps {
  selectedFreq: RecurrenceFreq;
  anchorDate: Date | null;
  onFreqChange: (freq: RecurrenceFreq) => void;
  customInterval: number;
  customUnit: RecurrenceUnit;
  onCustomFreqChange: (unit: RecurrenceUnit, interval: number) => void;
}

/**
 * "Repeat" footer rendered inside the DatePicker popper via the
 * `calendarContainer` slot. Hosts the 5-option pill selector plus an
 * `rrule.toText()`-derived hint line that mirrors what will land in the
 * row caption after save. The hint is derived from `(selectedFreq,
 * anchorDate)` on the fly — when there's no anchor (the user picked a
 * freq before picking a date), the hint is hidden.
 */
export function RecurrenceFooter({
  selectedFreq,
  anchorDate,
  onFreqChange,
  customInterval,
  customUnit,
  onCustomFreqChange,
}: RecurrenceFooterProps) {
  // Derived rather than a separate prop — `selectedFreq` is already the
  // source of truth for which section is showing.
  const customFreq = selectedFreq === "CUSTOM";

  const hintText = useMemo(
    () =>
      describeRecurrence(
        resolveRecurrenceRule(
          selectedFreq,
          anchorDate,
          customUnit,
          customInterval,
        ),
      ),
    [selectedFreq, anchorDate, customUnit, customInterval],
  );

  // Derived rather than tracked separately — the unit is the source of
  // truth (and the only thing the parent needs to persist); the label is
  // just its display string.
  const customUnitLabel =
    CUSTOM_FREQUENCY_OPTIONS.find((option) => option.freq === customUnit)
      ?.label ?? CUSTOM_FREQUENCY_OPTIONS[0].label;

  return (
    <Wrapper>
      <Label>Repeat</Label>
      <ChipRow role="group" aria-label="Repeat frequency">
        {FREQ_OPTIONS.map(({ freq, label }) => {
          const selected = selectedFreq === freq;
          return (
            <Chip
              key={freq}
              $selected={selected}
              aria-pressed={selected}
              onClick={() => onFreqChange(freq)}
            >
              {label}
            </Chip>
          );
        })}
      </ChipRow>
      {hintText && <Hint>Will repeat {hintText}</Hint>}
      {customFreq && (
        <CustomFrequencyWrapper>
          <CustomFrequencyButtonContainer>
            <div>Repeat every</div>
            <NumberStepper
              value={customInterval}
              onChange={(next) => onCustomFreqChange(customUnit, next)}
              min={1}
              max={31}
              aria-label="Repeat interval"
            />
            <Dropdown>
              <UnitDropdownToggle showCaret>
                {customUnitLabel}
              </UnitDropdownToggle>
              <DropdownMenu>
                {CUSTOM_FREQUENCY_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.freq}
                    onClick={() =>
                      onCustomFreqChange(option.freq, customInterval)
                    }
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </CustomFrequencyButtonContainer>
        </CustomFrequencyWrapper>
      )}
    </Wrapper>
  );
}
