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

import { useRef } from "react";

import { TogglePillButton, TogglePillContainer } from "./TogglePill.styles";

export type PillOption = {
  label: string;
  value: string;
};

type TogglePillProps = {
  currentValue: string;
  onChange: (value: string) => void;
  leftPill: PillOption;
  rightPill: PillOption;
};

export function TogglePill({
  currentValue,
  onChange,
  leftPill,
  rightPill,
}: TogglePillProps) {
  const leftRef = useRef<HTMLButtonElement>(null);
  const rightRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (clickedValue: string) => {
    const otherValue =
      clickedValue === leftPill.value ? rightPill.value : leftPill.value;

    onChange(otherValue);

    const otherRef = clickedValue === leftPill.value ? rightRef : leftRef;
    otherRef.current?.focus();
  };

  return (
    <TogglePillContainer role="radiogroup" aria-label="Toggle display mode">
      {[leftPill, rightPill].map(({ value, label }) => (
        <TogglePillButton
          role="radio"
          aria-checked={currentValue === value}
          key={label}
          ref={value === leftPill.value ? leftRef : rightRef}
          $selected={currentValue === value}
          onClick={() => onChange(value)}
          tabIndex={currentValue === value ? 0 : -1}
          aria-label={label}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleToggle(value);
            }
          }}
        >
          {label}
        </TogglePillButton>
      ))}
    </TogglePillContainer>
  );
}
