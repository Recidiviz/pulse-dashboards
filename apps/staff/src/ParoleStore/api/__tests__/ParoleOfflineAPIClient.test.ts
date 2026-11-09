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

import { paroleHearingsFixtureByState } from "~datatypes";

import { paroleBoardReportsFixture } from "../../../../tools/fixtures/paroleBoardReports";
import { RootStore } from "../../../RootStore";
import { ParoleStore } from "../../ParoleStore";
import { ParoleOfflineAPIClient } from "../ParoleOfflineAPIClient";

describe("ParoleOfflineAPIClient", () => {
  test("keys a case the way the offline PHI report fixture is keyed", async () => {
    const rootStore = new RootStore();
    rootStore.tenantStore.currentTenantId = "US_ID";
    const client = new ParoleOfflineAPIClient(new ParoleStore(rootStore));
    const [hearing] = paroleHearingsFixtureByState.US_ID;

    const caseDetail = await client.caseDetail(hearing.pseudonymizedId);

    expect(caseDetail.recordId).toBe(paroleBoardReportsFixture.recordId);
  });
});
