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

import { APIClient, OfflineAPIClient } from "../api";
import {
  CreatePriorTreatmentHistoryInput,
  DOCTreatmentHistory,
  PriorTreatmentHistory,
  TreatmentProgramCategory,
  UpdatePriorTreatmentHistoryInput,
} from "../components/OffenderAssessment/PriorTreatmentHistory/types";
import { SARDetailsPresenter } from "./SARDetailsPresenter";

/**
 * Presenter for the Prior Treatment History section.
 *
 * Error handling: These methods intentionally propagate errors to the calling
 * component. The modal catches errors and displays user-friendly messages.
 */
export class PriorTreatmentHistoryPresenter {
  constructor(
    private sarDetailsPresenter: SARDetailsPresenter,
    private apiClient: APIClient | OfflineAPIClient,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get SARData() {
    return this.sarDetailsPresenter.SARData;
  }

  get priorTreatmentHistories(): PriorTreatmentHistory[] {
    return this.SARData?.priorTreatmentHistories ?? [];
  }

  get DOCTreatmentHistories(): DOCTreatmentHistory[] {
    return this.SARData?.client?.DOCTreatmentHistories ?? [];
  }

  /**
   * Returns DOC treatment histories completed before the SAR due date,
   * grouped by program category.
   */
  get DOCTreatmentHistoriesByCategory(): Record<
    TreatmentProgramCategory,
    DOCTreatmentHistory[]
  > {
    const dueDate = this.SARData?.dueDate;
    const allHistories = this.DOCTreatmentHistories;

    // Filter to only those completed before the SAR due date
    const filtered = allHistories.filter((history) => {
      if (!history.completedOn) return false;
      if (!dueDate) return true; // If no due date, include all completed
      return new Date(history.completedOn) <= new Date(dueDate);
    });

    // Group by category
    const grouped: Record<TreatmentProgramCategory, DOCTreatmentHistory[]> = {
      CommunityTreatment: [],
      EducationProgram: [],
      CognitiveProgram: [],
    };

    filtered.forEach((history) => {
      if (history.programCategory) {
        grouped[history.programCategory].push(history);
      }
    });

    Object.values(grouped).forEach((histories) => {
      histories.sort((a, b) => {
        if (!a.completedOn || !b.completedOn) return 0;
        return new Date(b.completedOn).getTime() - new Date(a.completedOn).getTime();
      });
    });

    return grouped;
  }

  async createPriorTreatmentHistory(
    data: CreatePriorTreatmentHistoryInput,
  ): Promise<void> {
    if (!this.SARData) return;

    const result = await this.apiClient.createPriorTreatmentHistory({
      sarId: this.SARData.id,
      ...data,
    });

    runInAction(() => {
      if (this.SARData) {
        this.SARData.priorTreatmentHistories = [
          ...this.SARData.priorTreatmentHistories,
          result,
        ];
      }
    });
  }

  async updatePriorTreatmentHistory(
    id: string,
    data: UpdatePriorTreatmentHistoryInput,
  ): Promise<void> {
    if (!this.SARData) return;

    await this.apiClient.updatePriorTreatmentHistory({ id, ...data });

    runInAction(() => {
      if (this.SARData) {
        const index = this.SARData.priorTreatmentHistories.findIndex(
          (e) => e.id === id,
        );
        if (index !== -1) {
          this.SARData.priorTreatmentHistories[index] = {
            ...this.SARData.priorTreatmentHistories[index],
            ...data,
          };
        }
      }
    });
  }

  async deletePriorTreatmentHistory(id: string): Promise<void> {
    if (!this.SARData) return;

    await this.apiClient.deletePriorTreatmentHistory({ id });

    runInAction(() => {
      if (this.SARData) {
        this.SARData.priorTreatmentHistories =
          this.SARData.priorTreatmentHistories.filter((e) => e.id !== id);
      }
    });
  }

  async updatePriorTreatmentHistorySummary(value: string): Promise<void> {
    return this.sarDetailsPresenter.updateStringField(
      "priorTreatmentHistorySummary",
      value,
    );
  }
}
