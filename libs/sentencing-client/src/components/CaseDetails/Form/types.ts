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

import { COUNTIES_KEY } from "../constants";
import { FormAttributes, FormFieldWithNestedList, FormValue } from "../types";

export type FormField = {
  key: keyof FormAttributes | typeof COUNTIES_KEY;
  FieldComponent: React.ComponentType;
};

export type FormFieldProps = {
  nestedFields?: FormField[];
  isRequired?: boolean;
};

export type FormFieldWithNestedFields = FormField &
  FormFieldProps & {
    FieldComponent: React.ComponentType<FormFieldProps>;
  };

export type InputFieldProps = {
  element: FormFieldWithNestedList;
  parentKey?: keyof FormAttributes;
  prevValue?: FormValue;
  updateForm: (
    key: keyof FormAttributes,
    value?: FormValue,
    parentKey?: keyof FormAttributes,
    isOtherContext?: boolean,
  ) => void;
  updateFormError?: (hasError: boolean) => void;
  placeholder?: string;
  isOtherContext?: boolean;
  hasError?: boolean;
};

export type SelectOption = {
  label?: string | null;
  value?: FormValue;
};

export type Errors = {
  emptyRequiredField: boolean;
  inputError: boolean;
};

export enum ErrorType {
  EmptyRequiredField = "emptyRequiredField",
  InputError = "inputError",
}

export type CountyDistrict = {
  county?: string | null;
  district?: string | null;
};
