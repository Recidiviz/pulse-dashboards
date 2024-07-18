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

import {
  INCARCERATION_OPPORTUNITY_TYPES,
  IncarcerationOpportunityType,
  OPPORTUNITY_CONFIGS,
  SUPERVISION_OPPORTUNITY_TYPES,
  SupervisionOpportunityType,
} from "../OpportunityConfigs";
import { OpportunityType } from "../OpportunityType";

function getSystemIdFromOpportunityType(opportunityType: OpportunityType) {
  return OPPORTUNITY_CONFIGS[opportunityType].systemType;
}

describe("can detect supervision vs. incarceration type", () => {
  const listOfTypes = Object.keys(OPPORTUNITY_CONFIGS);
  test("supervision", () => {
    const arr = listOfTypes.filter(
      (type) =>
        getSystemIdFromOpportunityType(type as SupervisionOpportunityType) ===
        "SUPERVISION",
    );
    expect(arr).toEqual(SUPERVISION_OPPORTUNITY_TYPES);
  });

  test("incarceration", () => {
    const arr = listOfTypes.filter(
      (type) =>
        getSystemIdFromOpportunityType(type as IncarcerationOpportunityType) ===
        "INCARCERATION",
    );
    expect(arr).toEqual(INCARCERATION_OPPORTUNITY_TYPES);
  });

  test("usTnCustodyLevelDowngrade is a incarceration type", () => {
    expect(getSystemIdFromOpportunityType("usTnCustodyLevelDowngrade")).toBe(
      "INCARCERATION",
    );
  });
  test("usCaSupervisionLevelDowngrade is a supervision type", () => {
    expect(
      getSystemIdFromOpportunityType("usCaSupervisionLevelDowngrade"),
    ).toBe("SUPERVISION");
  });
});
