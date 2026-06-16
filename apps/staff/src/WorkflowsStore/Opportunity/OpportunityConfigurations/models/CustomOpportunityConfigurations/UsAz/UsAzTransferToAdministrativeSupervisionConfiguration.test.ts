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

import UserStore from "../../../../../../RootStore/UserStore";
import { IApiOpportunityConfiguration } from "../../../interfaces";
import { UsAzTransferToAdministrativeSupervisionConfiguration } from "./UsAzTransferToAdministrativeSupervisionConfiguration";

const mockConfigObject = {} as unknown as IApiOpportunityConfiguration;

describe("UsAzTransferToAdministrativeSupervisionConfiguration supervisor approval", () => {
  test("does not require supervisor approval when feature variant is off", () => {
    const config = new UsAzTransferToAdministrativeSupervisionConfiguration(
      mockConfigObject,
      new UserStore({}),
    );
    expect(config.supportsSupervisorReviewOnGrants).toBe(false);
  });

  test("requires supervisor approval when feature variant is on", () => {
    const config = new UsAzTransferToAdministrativeSupervisionConfiguration(
      mockConfigObject,
      {
        activeFeatureVariants: { usAzAdminSupervisionApprovalFlow: {} },
      } as UserStore,
    );
    expect(config.supportsSupervisorReviewOnGrants).toBe(true);
  });
});
