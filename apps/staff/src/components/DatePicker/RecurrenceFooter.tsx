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
import styled, { css } from "styled-components";

import { Button, palette } from "~design-system";

import {
  buildRecurrenceRule,
  describeRecurrence,
  RecurrenceFreq,
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

const FREQ_OPTIONS: ReadonlyArray<{ freq: RecurrenceFreq; label: string }> = [
  { freq: "NONE", label: "None" },
  { freq: "DAILY", label: "Every day" },
  { freq: "WEEKLY", label: "Every week" },
  { freq: "MONTHLY", label: "Every month" },
  { freq: "YEARLY", label: "Every year" },
];

export interface RecurrenceFooterProps {
  selectedFreq: RecurrenceFreq;
  anchorDate: Date | null;
  onFreqChange: (freq: RecurrenceFreq) => void;
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
}: RecurrenceFooterProps) {
  const hintText = describeRecurrence(
    buildRecurrenceRule(selectedFreq, anchorDate),
  );

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
    </Wrapper>
  );
}
