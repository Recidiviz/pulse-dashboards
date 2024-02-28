// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import RootStore from "../../../RootStore";
import ImpactMetric from "../../models/ImpactMetric";
import ImpactStore from "..";

let impactStore: ImpactStore;

jest.mock("../../../RootStore/UserStore", () => {
  return jest.fn().mockImplementation(() => ({
    user: {},
  }));
});

jest.mock("../../../RootStore/TenantStore", () => {
  return jest.fn().mockImplementation(() => ({
    currentTenantId: "US_TN",
  }));
});

describe("ImpactStore", () => {
  beforeEach(() => {
    impactStore = new ImpactStore({ rootStore: RootStore });
  });

  describe("metrics", () => {
    it("has reference to usTnCompliantReportingWorkflowsImpact metrics", () => {
      expect(impactStore.usTnCompliantReportingWorkflowsImpact).toBeInstanceOf(
        ImpactMetric,
      );
    });
  });
});
