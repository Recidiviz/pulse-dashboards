// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { palette, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { TextAreaInput, TextAreaWrapper } from "../../core/sharedComponents";

const Section = styled(TextAreaWrapper)`
  background: ${palette.marble3};
  border-radius: ${rem(4)};
  border: 2px solid transparent;
`;

const Label = styled.label`
  ${typography.Sans12}
  color: ${palette.slate85};
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  padding: 0.5rem 1.1rem 0;
  margin-bottom: 0;
`;

const Count = styled.span<{ invalid: boolean }>`
  color: ${({ invalid }) =>
    invalid ? palette.data.crimson1 : palette.slate85};
`;

type CharacterCountTextFieldProps = {
  id?: string;
  value: string;
  onChange: (text: string) => void;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  isOptional?: boolean;
};

export const CharacterCountTextField: React.FC<
  CharacterCountTextFieldProps
> = ({
  id = "character-count-text-field",
  value,
  onChange,
  minLength = 3,
  maxLength = 1600,
  placeholder,
  isOptional = false,
}) => {
  const invalid = isOptional
    ? value.length > 0 && value.length < minLength // If it's an optional field, and the user has entered something, enforce minLength requirement
    : value.length < minLength;

  return (
    <Section>
      <Label htmlFor={id}>
        Enter at least {minLength} characters
        <span>
          <Count invalid={invalid}>{value.length}</Count> / {maxLength}
        </span>
      </Label>
      <TextAreaInput
        id={id}
        data-testid={id}
        minLength={minLength}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Section>
  );
};
