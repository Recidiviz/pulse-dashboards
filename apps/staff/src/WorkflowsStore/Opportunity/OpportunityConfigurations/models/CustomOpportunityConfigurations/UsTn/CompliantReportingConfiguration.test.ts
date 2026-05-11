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
import { CompliantReportingConfiguration } from "./CompliantReportingConfiguration";
import { UsTnCompliantReporting2025PolicyConfiguration } from "./UsTnCompliantReporting2025PolicyConfiguration";

const mockConfigObject = {
  denialReasons: {
    DECF: "DECF: Denied, No Effort to Pay Fine and Costs",
    DEIO: "DEIO: Denied for CR",
    Other: "Other: please specify a reason",
  },
} as unknown as IApiOpportunityConfiguration;

describe("TN compliant reporting denial reasons", () => {
  test.each([
    ["legacy compliant reporting", CompliantReportingConfiguration],
    [
      "2025 policy compliant reporting",
      UsTnCompliantReporting2025PolicyConfiguration,
    ],
  ])(
    "keeps Other when TOMIS writeback is disabled for %s",
    (_, ConfigClass) => {
      const config = new ConfigClass(mockConfigObject, {
        activeFeatureVariants: {},
      } as UserStore);

      expect(config.denialReasons).toHaveProperty("Other");
    },
  );

  test.each([
    ["legacy compliant reporting", CompliantReportingConfiguration],
    [
      "2025 policy compliant reporting",
      UsTnCompliantReporting2025PolicyConfiguration,
    ],
  ])(
    "removes Other when TOMIS writeback is enabled for %s",
    (_, ConfigClass) => {
      const config = new ConfigClass(mockConfigObject, {
        activeFeatureVariants: { usTnCompliantReportingWriteback: {} },
      } as UserStore);

      expect(config.denialReasons).toEqual({
        DECF: "DECF: Denied, No Effort to Pay Fine and Costs",
        DEIO: "DEIO: Denied for CR",
      });
    },
  );
});
