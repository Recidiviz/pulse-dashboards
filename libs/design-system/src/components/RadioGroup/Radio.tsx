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
import { type JSX, useId } from "react";
import styled from "styled-components";

import { palette } from "../../styles";
import { useRadioGroupContext } from "./RadioGroupContext";

export interface RadioProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  testId?: string;
}

const RadioWrapper = styled.span<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  user-select: none;
  color: ${palette.pine1};
`;

const RadioBox = styled.span`
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
`;

const RadioInput = styled.input`
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  height: 100%;
  margin: 0;
  border: 1px solid ${palette.slate30};
  border-radius: 50%;
  background-color: transparent;
  cursor: inherit;
  transition: border-color 0.1s ease-in-out;
  outline: none;

  &:checked {
    border-color: ${palette.pine3};
  }

  &:focus-visible {
    outline: 2px solid ${palette.signal.links};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const RadioDot = styled.span.attrs({ "aria-hidden": "true" })`
  position: absolute;
  inset: 0;
  pointer-events: none;

  &::after {
    content: "";
    position: absolute;
    display: none;
    top: 4px;
    left: 4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${palette.pine3};
  }

  ${RadioInput}:checked + &::after {
    display: block;
  }
`;

const RadioLabelText = styled.label`
  cursor: inherit;
`;

/**
 * A single radio option. Must be rendered inside a `<RadioGroup>`.
 *
 * The radio's checked state is fully derived from the parent group's `value`
 * prop. Tab index is managed by the parent group via roving tabindex.
 */
export const Radio = ({
  value,
  children,
  disabled,
  className,
  testId,
}: RadioProps): JSX.Element => {
  const {
    name,
    value: groupValue,
    onChange,
    disabled: groupDisabled,
  } = useRadioGroupContext();
  const inputId = useId();
  const isChecked = groupValue === value;
  const isDisabled = disabled || groupDisabled;

  return (
    <RadioWrapper
      className={`ds-radio ${className ?? ""}`}
      $disabled={isDisabled}
    >
      <RadioBox className="ds-radio__box">
        <RadioInput
          id={inputId}
          className="ds-radio__indicator"
          type="radio"
          name={name}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          data-rg-item="true"
          data-testid={testId}
          onChange={() => onChange(value)}
        />
        <RadioDot />
      </RadioBox>
      <RadioLabelText htmlFor={inputId} className="ds-radio__label">
        {children}
      </RadioLabelText>
    </RadioWrapper>
  );
};
