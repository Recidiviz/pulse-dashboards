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
import { PSIStore } from "../datastores/PSIStore";
import { Case, Opportunities, Staff } from "./APIClient";

export class OfflineAPIClient {
  private editableInfo: Map<string, unknown> = new Map();

  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly psiStore: PSIStore) {}

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
    Object.entries(updates).forEach(([key, value]) => {
      this.editableInfo.set(caseId, { key, value });
    });
  }

  async getCommunityOpportunities(): Promise<Opportunities> {
    return [];
  }
}
