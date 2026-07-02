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

import { StylesConfig } from "react-select";
import styled from "styled-components";

import {
  Icon,
  IconSVG,
  iconToDataURI,
  palette,
  typography,
} from "~design-system";

import { SelectOption } from "../CaseDetails/Form/types";
import { hasErrorStyles } from "../shared/styles/ValidationStyles";
import { BaseDatePickerWrapper } from "./ModalStyles";

export const CHEVRON_DOWN_BACKGROUND = iconToDataURI(
  <Icon kind={IconSVG["ChevronDown"]} color={palette.pine1} />,
);

export const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const Label = styled.label`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 1rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.01rem;
`;

const inputStyles = `
  display: flex;
  min-height: 2.5rem;
  padding: 0.75rem 1rem;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  border-radius: 0.5rem;
  border: 1px solid rgba(43, 84, 105, 0.20);
  font-family: "Public Sans";
  font-size: 0.875rem;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: ${palette.pine4};
  }

  &::placeholder {
    color: ${palette.slate40};
  }
`;

export const Input = styled.input<{
  halfWidth?: boolean;
  $hasError?: boolean;
  $shrink?: boolean;
}>`
  ${inputStyles}
  ${({ halfWidth }) => halfWidth && "width: 50%;"}
  ${({ $hasError }) => $hasError && hasErrorStyles()}
  ${({ $shrink }) =>
    $shrink &&
    "width: 50px; min-width: 0; min-height: unset; height: 30px; padding: 0.25rem 0.5rem;"}
`;

export const Textarea = styled.textarea<{ height?: string }>`
  ${inputStyles}
  resize: none;
  height: ${({ height }) => height ?? "6.8125rem"};
`;

export const Select = styled.select`
  ${inputStyles}
  appearance: none;
  background-image: url("${CHEVRON_DOWN_BACKGROUND}");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
  cursor: pointer;
`;

export const dropdownStyles: StylesConfig<SelectOption, boolean> = {
  control: (styles, { isFocused, isDisabled }) => ({
    ...styles,
    minHeight: "2.5rem",
    borderRadius: "0.5rem",
    border: `1px solid ${isFocused ? palette.pine4 : "rgba(43, 84, 105, 0.20)"}`,
    boxShadow: "none",
    backgroundColor: palette.white,
    fontFamily: "Public Sans",
    fontSize: "0.875rem",
    lineHeight: 1.5,
    cursor: isDisabled ? "not-allowed" : "default",
    pointerEvents: "auto" as const,
    ":hover": {
      borderColor: isDisabled ? "rgba(43, 84, 105, 0.20)" : palette.pine4,
    },
  }),
  option: (styles, { isFocused, isSelected }) => ({
    ...styles,
    color: palette.pine3,
    // eslint-disable-next-line no-nested-ternary
    backgroundColor: isFocused
      ? palette.slate10
      : isSelected
        ? palette.white
        : undefined,
    ":active": {
      backgroundColor: palette.slate10,
    },
  }),
  singleValue: (styles) => ({ ...styles, color: palette.pine3 }),
  menuPortal: (styles) => ({ ...styles, zIndex: 1100 }),
};

export const inlineDropdownBase: StylesConfig<SelectOption, boolean> = {
  ...dropdownStyles,
  indicatorSeparator: () => ({ display: "none" }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  placeholder: (base) => ({ ...base, color: palette.pine4, margin: 0 }),
};

// Shared button styles for modals and confirmations
const Button = styled.button`
  padding: 0.75rem 2rem;
  border-radius: 0.25rem;
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  line-height: 1.5;
  letter-spacing: -0.00875rem;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const CancelButton = styled(Button)`
  ${typography.Sans14}
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 4px;
  border: 1px solid ${palette.slate30};
  background: ${palette.white};
  color: ${palette.slate85};

  &:hover:not(:disabled) {
    background: ${palette.marble4};
  }
`;

export const SaveButton = styled(Button)`
  padding: 10px 16px;
  background: ${palette.signal.links};
  color: white;

  &:hover:not(:disabled) {
    background: ${palette.pine4};
  }
`;

export const DeleteButton = styled(Button)`
  background: ${palette.signal.error};
  color: white;
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

export const ORASTitle = styled.span`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.0225rem;
`;

export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  align-self: stretch;
`;

export const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: ${palette.pine4};
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
`;

export const CheckboxLabel = styled.span`
  font-family: "Public Sans";
  font-size: 0.875rem;
  color: ${palette.pine1};
`;

export const DatePickerWrapper = styled(BaseDatePickerWrapper)`
  .react-datepicker__input-container input {
    background-position: right 1rem center;
    background-size: 1rem;
  }
`;
