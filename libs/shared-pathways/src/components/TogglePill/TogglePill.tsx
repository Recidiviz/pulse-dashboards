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

import { Radio } from "~design-system";

import { TogglePillRadioGroup } from "./TogglePill.styles";

export type PillOption = {
  label: string;
  value: string;
};

type TogglePillProps = {
  currentValue: string;
  onChange: (value: string) => void;
  leftPill: PillOption;
  rightPill: PillOption;
  /** Accessible name for the radio group. Defaults to "Toggle display mode". */
  ariaLabel?: string;
};

export function TogglePill({
  currentValue,
  onChange,
  leftPill,
  rightPill,
  ariaLabel = "Toggle display mode",
}: TogglePillProps) {
  return (
    <TogglePillRadioGroup
      value={currentValue}
      onChange={onChange}
      orientation="horizontal"
      ariaLabel={ariaLabel}
    >
      <Radio value={leftPill.value}>{leftPill.label}</Radio>
      <Radio value={rightPill.value}>{rightPill.label}</Radio>
    </TogglePillRadioGroup>
  );
}
