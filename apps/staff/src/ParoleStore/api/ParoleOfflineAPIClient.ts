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

import {
  ParoleCase,
  paroleCasesFixtureByState,
  ParoleFixtureStateCode,
  ParoleHearing,
  paroleHearingsFixtureByState,
} from "~datatypes";

import { ParoleStore } from "../ParoleStore";
import { ParoleAPI } from "./interface";

export class ParoleOfflineAPIClient implements ParoleAPI {
  constructor(public readonly paroleStore: ParoleStore) {}

  // Docket varies by tenant, not just conduct classification scheme --
  // US_CO's carries real resident records that US_ID's must not (see
  // CO_HEARINGS/CO_REAL_CASE_PROFILES in fixture.ts).
  async hearings(): Promise<Array<ParoleHearing>> {
    const { currentTenantId } = this.paroleStore.rootStore.tenantStore;
    if (!this.isParoleFixtureStateCode(currentTenantId)) {
      throw new Error(
        `No Parole fixture data for tenant [${currentTenantId}]. Add one ` +
          "in libs/datatypes/src/parole/fixture.ts.",
      );
    }
    return paroleHearingsFixtureByState[currentTenantId];
  }

  async caseDetail(docId: string): Promise<ParoleCase> {
    const caseDetail = this.casesFixture[docId];
    if (!caseDetail) {
      throw new Error(`Parole case ${docId} not present in fixture data`);
    }
    return caseDetail;
  }

  // Serves each Parole-enabled tenant its own conduct classification scheme
  // (see fixture.ts's ParoleFixtureStateCode) so `nx offline staff` can be
  // used to visually check both US_CO's and US_ID's config.
  private get casesFixture(): Record<string, ParoleCase> {
    const { currentTenantId } = this.paroleStore.rootStore.tenantStore;
    if (!this.isParoleFixtureStateCode(currentTenantId)) {
      throw new Error(
        `No Parole fixture data for tenant [${currentTenantId}]. Add one ` +
          "in libs/datatypes/src/parole/fixture.ts.",
      );
    }
    return paroleCasesFixtureByState[currentTenantId];
  }

  private isParoleFixtureStateCode(
    tenantId: string | undefined,
  ): tenantId is ParoleFixtureStateCode {
    return tenantId === "US_CO" || tenantId === "US_ID";
  }
}
