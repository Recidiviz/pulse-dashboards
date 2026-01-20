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

import { Icon, IconSVG, iconToDataURI, palette } from "~design-system";

import { SelectOption } from "../CaseDetails/Form/types";
import { customPalette } from "../styles/palette";

export const CHEVRON_DOWN_BACKGROUND = iconToDataURI(
  <Icon kind={IconSVG["ChevronDown"]} color={palette.pine1} />,
);

export const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

export const Input = styled.input<{ halfWidth?: boolean }>`
  ${inputStyles}
  ${({ halfWidth }) => halfWidth && "width: 50%;"}
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
    borderColor: isFocused ? palette.pine4 : palette.slate20,
    boxShadow: isFocused ? `0 0 0 1px  ${palette.pine4}` : "none",
    backgroundColor: isDisabled ? palette.slate10 : palette.white,
    ":hover": {
      borderColor: palette.pine4,
    },
  }),
  option: (styles, { isFocused, isSelected }) => ({
    ...styles,
    color: palette.pine3,
    // eslint-disable-next-line no-nested-ternary
    backgroundColor: isFocused
      ? palette.slate10
      : isSelected
        ? customPalette.green.light3
        : undefined,
    ":active": {
      backgroundColor: palette.slate10,
    },
  }),
  singleValue: (styles) => ({ ...styles, color: palette.pine3 }),
  menu: (styles) => ({ ...styles, zIndex: 10 }),
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
  background: transparent;
  color: ${palette.slate85};

  &:hover:not(:disabled) {
    background: ${palette.marble4};
  }
`;

export const SaveButton = styled(Button)`
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
