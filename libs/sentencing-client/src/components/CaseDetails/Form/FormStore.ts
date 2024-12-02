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
import { transformUpdates } from "./utils";

export class FormStore {
  formUpdates: Partial<FormUpdates>;

  hasError: boolean;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.formUpdates = {};
    this.hasError = false;
  }

  get updates(): FormAttributes {
    if (!Object.keys(this.formUpdates).length) return {};
    return transformUpdates(this.formUpdates);
  }

  updateErrorStatus(hasError?: boolean) {
    if (hasError === undefined) return;
    if (hasError === false) {
      this.hasError = false;
    } else if (hasError === true) {
      this.hasError = true;
    }
  }

  updateForm(key: keyof FormAttributes, value: FormValue, hasError?: boolean) {
    this.updateErrorStatus(hasError);
    if (!hasError) {
      this.formUpdates[key] = value;
    }
    return this.formUpdates;
  }

  resetUpdates() {
    this.formUpdates = {};
    this.hasError = false;
  }
}

export const form = new FormStore();
