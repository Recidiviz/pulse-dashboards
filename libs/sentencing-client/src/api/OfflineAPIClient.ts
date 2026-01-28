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

import { FormAttributes } from "../components/CaseDetails/types";
import { SentencingStore } from "../datastores/SentencingStore";
import { Case, Opportunities, SAR, Staff, Supervisor } from "./APIClient";

export class OfflineAPIClient {
  private editableInfo: Map<string, unknown> = new Map();

  constructor(public readonly sentencingStore: SentencingStore) {}

  async getStaffInfo(): Promise<Staff> {
    const { StaffInfoFixture } = await import(
      "./offlineFixtures/StaffInfoFixtures"
    );
    return {
      ...StaffInfoFixture,
      hasLoggedIn:
        this.editableInfo.has("hasLoggedIn") ?? StaffInfoFixture.hasLoggedIn,
    };
  }

  async getSupervisorInfo(): Promise<Supervisor> {
    const { StaffInfoFixture } = await import(
      "./offlineFixtures/StaffInfoFixtures"
    );
    return {
      ...StaffInfoFixture,
      externalId: undefined,
      supervisorDashboardStats: undefined,
    };
  }

  setIsFirstLogin() {
    this.editableInfo.set("hasLoggedIn", true);
  }

  async getCaseDetails(caseId: string): Promise<Case> {
    const { CaseDetailsFixture } = await import(
      "./offlineFixtures/CaseDetailsFixtures"
    );
    return CaseDetailsFixture?.[caseId];
  }

  updateCaseDetails(caseId: string, updates: FormAttributes) {
    // Get existing info or start a new object
    const info = this.editableInfo.get(caseId) ?? {};
    Object.entries(updates).forEach(([key, value]) => {
      (info as Record<string, unknown>)[key] = value;
    });
    this.editableInfo.set(caseId, info);
  }

  async getCommunityOpportunities(): Promise<Opportunities> {
    return [];
  }

  async getOffenses(): Promise<string[]> {
    return [];
  }

  async getCounties(): Promise<string[]> {
    return [];
  }

  async getInsight(): Promise<string[]> {
    return [];
  }

  async getSARDetails(sarId: string): Promise<SAR> {
    const { SARDetailsFixture } = await import(
      "./offlineFixtures/SARDetailsFixtures"
    );
    return SARDetailsFixture?.[sarId] ?? SARDetailsFixture["default"];
  }

  updateSARDetails(sarID: string, updates: FormAttributes) {
    // Get existing info or start a new object
    const info = this.editableInfo.get(sarID) ?? {};
    Object.entries(updates).forEach(([key, value]) => {
      (info as Record<string, unknown>)[key] = value;
    });
    this.editableInfo.set(sarID, info);
  }

  // Employment History CRUD stubs for offline mode
  async createEmploymentHistory(input: {
    sarId: string;
    employerName?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    verifiedByReportAuthor?: boolean | null;
  }) {
    return {
      id: `offline-${Date.now()}`,
      employerName: input.employerName ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      verifiedByReportAuthor: input.verifiedByReportAuthor ?? null,
    };
  }

  async updateEmploymentHistory(_input: {
    id: string;
    employerName?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    verifiedByReportAuthor?: boolean | null;
  }) {
    // No-op for offline mode
  }

  async deleteEmploymentHistory(_input: { id: string }) {
    // No-op for offline mode
  }
}
