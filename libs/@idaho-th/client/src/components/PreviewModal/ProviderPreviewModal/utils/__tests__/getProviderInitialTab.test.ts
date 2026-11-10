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

import { APPLICATION_STAGE } from "~@idaho-th/shared";

import { TAB_IDS } from "../../../constants";
import { getProviderInitialTab } from "../getProviderInitialTab";

describe("getProviderInitialTab", () => {
  it("opens the Home Plan tab for the Approvals and Release stages", () => {
    expect(getProviderInitialTab(APPLICATION_STAGE.APPROVALS)).toBe(
      TAB_IDS.HOME_PLAN,
    );
    expect(getProviderInitialTab(APPLICATION_STAGE.RELEASE)).toBe(
      TAB_IDS.HOME_PLAN,
    );
  });

  it("opens the Application Details tab for every other stage", () => {
    expect(getProviderInitialTab(APPLICATION_STAGE.DRAFT)).toBe(
      TAB_IDS.APPLICATION_DETAILS,
    );
    expect(getProviderInitialTab(APPLICATION_STAGE.APPLICATION)).toBe(
      TAB_IDS.APPLICATION_DETAILS,
    );
    expect(getProviderInitialTab(APPLICATION_STAGE.CLOSED)).toBe(
      TAB_IDS.APPLICATION_DETAILS,
    );
  });
});
