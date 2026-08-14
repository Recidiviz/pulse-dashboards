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

import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";

import { Icon, palette } from "~design-system";

import {
  ArrowButton,
  ArrowStack,
  NumberField,
  StepperWrapper,
} from "./NumberStepper.styles";

export interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  "aria-label"?: string;
}

/**
 * Bounded numeric input with increment/decrement arrows
 */
export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = Infinity,
  step = 1,
  "aria-label": ariaLabel,
}: NumberStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  const [rawValue, setRawValue] = useState(String(value));

  useEffect(() => {
    setRawValue(String(value));
  }, [value]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setRawValue(next);

    const parsed = Number(next);
    if (next !== "" && !Number.isNaN(parsed)) onChange(parsed);
  };

  const handleBlur = () => {
    const parsed = Number(rawValue);
    const next =
      rawValue === "" || Number.isNaN(parsed) ? value : clamp(parsed);
    setRawValue(String(next));
    onChange(next);
  };

  return (
    <StepperWrapper>
      <NumberField
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={rawValue}
        aria-label={ariaLabel}
        onChange={handleInputChange}
        onBlur={handleBlur}
      />
      <ArrowStack>
        <ArrowButton
          aria-label="Increase"
          disabled={value >= max}
          onClick={() => onChange(clamp(value + step))}
        >
          <Icon kind="Caret" size={8} rotate={180} color={palette.pine3} />
        </ArrowButton>
        <ArrowButton
          aria-label="Decrease"
          disabled={value <= min}
          onClick={() => onChange(clamp(value - step))}
        >
          <Icon kind="Caret" size={8} color={palette.pine3} />
        </ArrowButton>
      </ArrowStack>
    </StepperWrapper>
  );
}
