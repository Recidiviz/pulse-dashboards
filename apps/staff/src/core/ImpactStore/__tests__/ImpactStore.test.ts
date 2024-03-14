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
import { RootStore } from "../../../RootStore";
import TenantStore from "../../../RootStore/TenantStore";
import UserStore from "../../../RootStore/UserStore";
import ImpactMetric from "../../models/ImpactMetric";
import ImpactStore from "..";

let impactStore: ImpactStore;

vi.mock("../../../RootStore/UserStore");
vi.mock("../../../RootStore/TenantStore");

describe("ImpactStore", () => {
  beforeEach(() => {
    // @ts-expect-error
    vi.mocked(UserStore).mockImplementation(() => ({
      user: {},
    }));
    // @ts-expect-error
    vi.mocked(TenantStore).mockImplementation(() => ({
      currentTenantId: "US_TN",
    }));

    impactStore = new ImpactStore({ rootStore: new RootStore() });
  });

  describe("metrics", () => {
    it("has reference to usTnCompliantReportingWorkflowsImpact metrics", () => {
      expect(impactStore.usTnCompliantReportingWorkflowsImpact).toBeInstanceOf(
        ImpactMetric,
      );
    });
  });
});
