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
import { type JSX, useEffect, useId, useRef } from "react";
import styled from "styled-components";

import { palette } from "../../styles";
import { useCheckboxGroupContext } from "./CheckboxGroupContext";

export interface CheckboxProps {
  value: string;
  children?: React.ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  testId?: string;
  indeterminate?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

const CheckboxWrapper = styled.span<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  user-select: none;
  color: ${palette.pine1};
`;

const CheckboxBox = styled.span`
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
`;

const CheckboxInput = styled.input`
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  height: 100%;
  margin: 0;
  border: 1px solid ${palette.slate30};
  border-radius: 2px;
  background-color: transparent;
  cursor: inherit;
  transition:
    background-color 0.1s ease-in-out,
    border-color 0.1s ease-in-out;
  outline: none;

  &:checked,
  &:indeterminate {
    background-color: ${palette.pine3};
    border-color: ${palette.pine3};
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid ${palette.signal.links};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const CheckMark = styled.span.attrs({ "aria-hidden": "true" })`
  position: absolute;
  inset: 0;
  pointer-events: none;

  &::after {
    content: "";
    position: absolute;
    display: none;
  }

  ${CheckboxInput}:checked + &::after {
    display: block;
    top: 2px;
    left: 5px;
    width: 6px;
    height: 9px;
    border: solid ${palette.marble1};
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  ${CheckboxInput}:indeterminate + &::after {
    display: block;
    top: 7px;
    left: 4px;
    width: 8px;
    height: 0;
    border: solid ${palette.marble1};
    border-width: 0 0 2px 0;
  }
`;

const CheckboxLabelText = styled.label`
  cursor: inherit;
`;

/**
 * A single checkbox option. Must be rendered inside a `<CheckboxGroup>`.
 *
 * By default, checked state is derived from the parent group's `value` array
 * and toggling adds/removes this checkbox's `value` from that array. Pass
 * `checked` + `onChange` together to use the checkbox as a "meta" control
 * (e.g., a select-all) whose state is computed externally and doesn't
 * contribute to the group selection. Tab index is managed by the parent
 * group via roving tabindex regardless.
 */
export const Checkbox = ({
  value,
  children,
  ariaLabel,
  disabled,
  className,
  testId,
  indeterminate,
  checked: checkedOverride,
  onChange: onChangeOverride,
}: CheckboxProps): JSX.Element => {
  const {
    value: groupValue,
    toggleValue,
    disabled: groupDisabled,
  } = useCheckboxGroupContext();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const isControlledExternally = checkedOverride !== undefined;
  const isChecked = isControlledExternally
    ? checkedOverride
    : groupValue.includes(value);
  const isDisabled = disabled || groupDisabled;
  const hasVisibleLabel = children !== undefined && children !== null;

  // The native `indeterminate` property is not settable via JSX, only via DOM
  // assignment. Sync it whenever the prop changes.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChangeOverride) {
      onChangeOverride(event.target.checked);
    } else {
      toggleValue(value);
    }
  };

  return (
    <CheckboxWrapper
      className={`ds-checkbox ${className ?? ""}`}
      $disabled={isDisabled}
    >
      <CheckboxBox className="ds-checkbox__box">
        <CheckboxInput
          ref={inputRef}
          id={inputId}
          className="ds-checkbox__indicator"
          type="checkbox"
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          data-cg-item="true"
          data-testid={testId}
          aria-label={hasVisibleLabel ? undefined : ariaLabel}
          onChange={handleChange}
        />
        <CheckMark />
      </CheckboxBox>
      {hasVisibleLabel && (
        <CheckboxLabelText htmlFor={inputId} className="ds-checkbox__label">
          {children}
        </CheckboxLabelText>
      )}
    </CheckboxWrapper>
  );
};
