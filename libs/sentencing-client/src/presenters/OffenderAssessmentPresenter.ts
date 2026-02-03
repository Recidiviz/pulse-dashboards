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

import { makeAutoObservable, runInAction } from "mobx";

import { APIClient, OfflineAPIClient } from "../api";
import { EmploymentHistory } from "../components/OffenderAssessment/EmploymentHistory/constants";
import { DrugHistory } from "../components/OffenderAssessment/SubstanceUse/constants";
import { splitFullName } from "../utils/utils";
import { SARDetailsPresenter } from "./SARDetailsPresenter";

export type CreateEmploymentHistoryInput = Omit<EmploymentHistory, "id">;
export type UpdateEmploymentHistoryInput = Partial<
  Omit<EmploymentHistory, "id">
>;

export type CreateDrugHistoryInput = Omit<DrugHistory, "id">;
export type UpdateDrugHistoryInput = Partial<Omit<DrugHistory, "id">>;

/**
 * Presenter for Offender Assessment section (ORAS domain logic).
 *
 * Error handling: These methods intentionally propagate errors to the calling
 * component (e.g., EmploymentHistoryModal). The modal catches errors and displays
 * user-friendly messages. This keeps error UI concerns in the component layer.
 */
export class OffenderAssessmentPresenter {
  constructor(
    private sarDetailsPresenter: SARDetailsPresenter,
    private apiClient: APIClient | OfflineAPIClient,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // Delegate to parent for SAR data access
  get SARData() {
    return this.sarDetailsPresenter.SARData;
  }

  // Employment History - Individual CRUD operations
  get employmentHistories(): EmploymentHistory[] {
    return this.SARData?.employmentHistories ?? [];
  }

  async createEmploymentHistory(
    data: CreateEmploymentHistoryInput,
  ): Promise<void> {
    if (!this.SARData) return;

    const result = await this.apiClient.createEmploymentHistory({
      sarId: this.SARData.id,
      ...data,
    });

    runInAction(() => {
      if (this.SARData) {
        this.SARData.employmentHistories = [
          ...this.SARData.employmentHistories,
          result,
        ];
      }
    });
  }

  async updateEmploymentHistory(
    id: string,
    data: UpdateEmploymentHistoryInput,
  ): Promise<void> {
    if (!this.SARData) return;

    await this.apiClient.updateEmploymentHistory({ id, ...data });

    runInAction(() => {
      if (this.SARData) {
        const index = this.SARData.employmentHistories.findIndex(
          (e) => e.id === id,
        );
        if (index !== -1) {
          this.SARData.employmentHistories[index] = {
            ...this.SARData.employmentHistories[index],
            ...data,
          };
        }
      }
    });
  }

  async deleteEmploymentHistory(id: string): Promise<void> {
    if (!this.SARData) return;

    await this.apiClient.deleteEmploymentHistory({ id });

    runInAction(() => {
      if (this.SARData) {
        this.SARData.employmentHistories =
          this.SARData.employmentHistories.filter((e) => e.id !== id);
      }
    });
  }

  get clientFirstName(): string {
    return splitFullName(this.SARData?.client?.fullName).firstName;
  }

  // Substance Use History - Individual CRUD operations
  get drugHistories(): DrugHistory[] {
    return this.SARData?.drugHistories ?? [];
  }

  async createDrugHistory(data: CreateDrugHistoryInput): Promise<void> {
    if (!this.SARData) return;

    const result = await this.apiClient.createDrugHistory({
      sarId: this.SARData.id,
      ...data,
    });

    runInAction(() => {
      if (this.SARData) {
        this.SARData.drugHistories = [...this.SARData.drugHistories, result];
      }
    });
  }

  async updateDrugHistory(
    id: string,
    data: UpdateDrugHistoryInput,
  ): Promise<void> {
    if (!this.SARData) return;

    await this.apiClient.updateDrugHistory({ id, ...data });

    runInAction(() => {
      if (this.SARData) {
        const index = this.SARData.drugHistories.findIndex((e) => e.id === id);
        if (index !== -1) {
          this.SARData.drugHistories[index] = {
            ...this.SARData.drugHistories[index],
            ...data,
          };
        }
      }
    });
  }

  async deleteDrugHistory(id: string): Promise<void> {
    if (!this.SARData) return;

    await this.apiClient.deleteDrugHistory({ id });

    runInAction(() => {
      if (this.SARData) {
        this.SARData.drugHistories = this.SARData.drugHistories.filter(
          (e) => e.id !== id,
        );
      }
    });
  }

  async updateDrugHistorySummary(value: string): Promise<void> {
    return this.sarDetailsPresenter.updateStringField(
      "drugHistorySummary",
      value,
    );
  }
}
