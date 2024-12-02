// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { ChangeEvent } from "react";
import { MenuProps, MultiValue, OptionProps, SingleValue } from "react-select";

import { SelectOption } from "../types";

export type DropdownProps = {
  value: SelectOption | SelectOption[] | null;
  options: SelectOption[];
  onChange: (
    option: MultiValue<SelectOption> | SingleValue<SelectOption> | null,
  ) => void;
  onInputChange?: (inputValue: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
  isMulti?: boolean;
  customComponents?: {
    Option?: React.ComponentType<OptionProps<SelectOption>>;
    Menu?: React.ComponentType<MenuProps<SelectOption>>;
    Header?: React.ComponentType;
  };
  filterOption?: (option: SelectOption, inputValue: string) => boolean;
  styles?: object;
};

export type TextInputProps = {
  id: string;
  value: number | string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  isDisabled?: boolean;
  errorMessage?: string;
  maxLength?: number;
  autoFocus?: boolean;
  styles?: React.CSSProperties;
};

export type TextAreaProps = {
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
};

export type MultiSelectRadioInputProps = {
  options: string[];
  selections: string[];
  updateSelections: (option: string) => void;
};

export type RadioInputProps = {
  options: string[];
  selection: string | null;
  updateSelection: (option: string) => void;
};
