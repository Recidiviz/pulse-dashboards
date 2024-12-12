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

import { makeAutoObservable } from "mobx";

import { FormAttributes, FormUpdates, FormValue } from "../types";
import { Errors, ErrorType } from "./types";
import { transformUpdates } from "./utils";

export class FormStore {
  formUpdates: Partial<FormUpdates>;

  errors: Record<keyof FormAttributes, Errors>;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.formUpdates = {};
    this.errors = {} as Record<keyof FormAttributes, Errors>;
  }

  get updates(): FormAttributes {
    if (!Object.keys(this.formUpdates).length) return {};
    return transformUpdates(this.formUpdates);
  }

  get hasError(): boolean {
    const errorsValues = Object.values(this.errors);
    const hasErrors = errorsValues.some(
      (error) => error.emptyRequiredField || error.inputError,
    );

    return hasErrors;
  }

  updateErrorStatus(
    key: keyof FormAttributes,
    errorType: ErrorType,
    hasError?: boolean,
  ) {
    if (hasError === undefined) return;
    if (hasError === false) {
      const currentErrors = this.errors[key];
      if (currentErrors?.[errorType]) {
        delete currentErrors[errorType];
      }
      this.errors[key] = { ...currentErrors };
    } else if (hasError === true) {
      this.errors[key] = { ...this.errors[key], [errorType]: true };
    }
  }

  validate(
    key: keyof FormAttributes,
    value: FormValue,
    isRequired?: boolean,
    inputValidator?: (value: string) => boolean,
  ) {
    const isNullOrUndefinedValue = value === null || value === undefined;
    const normalizedValue = isNullOrUndefinedValue ? "" : String(value);

    let isRequiredFieldValid = true;
    if (isRequired) {
      if (!normalizedValue) {
        this.updateErrorStatus(key, ErrorType.EmptyRequiredField, true);
        isRequiredFieldValid = false;
      } else {
        this.updateErrorStatus(key, ErrorType.EmptyRequiredField, false);
      }
    }

    let isInputValid = true;
    if (inputValidator) {
      if (inputValidator(normalizedValue) === false) {
        /** Raise an input error only when they have an input & it fails validation (otherwise empty fields will also fail this validation) */
        if (isRequiredFieldValid) {
          this.updateErrorStatus(key, ErrorType.InputError, true);
        }
        isInputValid = false;
      }
      /** Clear input error when it passes validation or the input is cleared out */
      if (inputValidator(normalizedValue) === true || !normalizedValue) {
        this.updateErrorStatus(key, ErrorType.InputError, false);
      }
    }

    return isRequiredFieldValid && isInputValid;
  }

  updateForm(
    key: keyof FormAttributes,
    value: FormValue,
    isRequired?: boolean,
    inputValidator?: (value: string) => boolean,
  ) {
    const isValid = this.validate(key, value, isRequired, inputValidator);

    if (isValid) {
      this.formUpdates[key] = value;
    }

    return this.formUpdates;
  }

  resetErrors() {
    this.errors = {} as Record<keyof FormAttributes, Errors>;
  }

  resetUpdates() {
    this.formUpdates = {};
    this.resetErrors();
  }
}

export const form = new FormStore();
