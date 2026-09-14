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

import { makeAutoObservable, runInAction } from "mobx";

import { CalculatorResponse } from "~datatypes";

import { SentenceCalculationAPIClient } from "../../api/SentenceCalculationAPIClient";
import { SentenceCalculationHost } from "../../types";

export class SentenceCalculationPresenter {
  inputValue = "";

  response?: CalculatorResponse;

  error?: Error;

  isSubmitting = false;

  private readonly apiClient: SentenceCalculationAPIClient;

  constructor(host: SentenceCalculationHost) {
    this.apiClient = new SentenceCalculationAPIClient(host);
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get canSubmit(): boolean {
    return this.inputValue.trim().length > 0 && !this.isSubmitting;
  }

  setInputValue(value: string): void {
    this.inputValue = value;
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) return;

    this.isSubmitting = true;
    this.error = undefined;
    this.response = undefined;

    try {
      const response = await this.apiClient.echo(this.inputValue);
      runInAction(() => {
        this.response = response;
      });
    } catch (e) {
      runInAction(() => {
        this.error = e instanceof Error ? e : new Error(String(e));
      });
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  }
}
