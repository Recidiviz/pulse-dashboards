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
import { useId } from "react";
import styled from "styled-components";

import { palette } from "~design-system";

const TextInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
  width: 100%;
`;

const TextArea = styled.textarea`
  ${typography.Sans14}
  box-sizing: border-box;
  width: 100%;
  padding: ${rem(spacing.sm)};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(8)};
  color: ${palette.pine1};
  resize: vertical;

  &:focus {
    border-color: ${palette.signal.links};
    outline: none;
  }

  &:disabled {
    background: ${palette.marble3};
    cursor: not-allowed;
  }
`;

const Counter = styled.div`
  ${typography.Sans12}
  align-self: flex-end;
  color: ${palette.slate60};
`;

/**
 * A text box for a report field, which stops at its character limit and
 * shows how much of the limit the PHI has used, such as "42/250".
 *
 * @param value - The text, or null when the field is empty.
 * @param onChange - Receives the text as the PHI types.
 * @param label - Names the field for screen readers, such as "Notes".
 * @param maxLength - The most characters the field takes.
 * @param rows - How many lines the box shows before the PHI resizes it.
 * @param disabled - Whether the input is disabled, such as while a save is
 *   in flight.
 * @param id - The text box's id, for a visible label that points at it.
 * @param placeholder - Shows in the empty box, such as "Enter description".
 * @param onFocus - Called when the box gains focus.
 * @param onBlur - Called when the box loses focus.
 */
export function ReportTextInput({
  value,
  onChange,
  label,
  maxLength,
  rows = 2,
  disabled = false,
  id,
  placeholder,
  onFocus,
  onBlur,
}: {
  value: string | null;
  onChange: (text: string) => void;
  label: string;
  maxLength: number;
  rows?: number;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const counterId = useId();
  const text = value ?? "";

  return (
    <TextInputWrapper>
      <TextArea
        id={id}
        aria-label={label}
        aria-describedby={counterId}
        value={text}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <Counter id={counterId}>
        {text.length}/{maxLength}
      </Counter>
    </TextInputWrapper>
  );
}
