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

import { Opportunity } from "../../../../WorkflowsStore";
import { Resident } from "../../../../WorkflowsStore/Resident";
import {
  US_TN_CLASSIFICATION_OPPORTUNITIES,
  usTnPrioritizedOpportunity,
} from "../utils";

function testResident(
  overrides: Record<
    string,
    { isSubmitted?: boolean; isEligible?: boolean }
  > = {},
) {
  return {
    opportunities: Object.fromEntries(
      US_TN_CLASSIFICATION_OPPORTUNITIES.map((opp) => [
        opp,
        [
          {
            type: opp,
            ...{
              isSubmitted: false,
              isEligible: false,
              ...overrides[opp],
            },
          },
        ],
      ]),
    ),
  } as unknown as Resident;
}

describe("utils", () => {
  describe("usTnPrioritizedOpportunity", () => {
    it("returns the opportunity marked as submitted", () => {
      const resident = testResident({
        usTnAnnualReclassification2026Policy: {
          isSubmitted: true,
          isEligible: true,
        },
        usTnCustodyLevelDowngrade2026Policy: {
          isEligible: true,
        },
      });

      const res = usTnPrioritizedOpportunity(resident);
      expect(res?.type).toEqual("usTnAnnualReclassification2026Policy");
    });

    it("returns the opportunity marked as submitted even when ineligible", () => {
      const resident = testResident({
        usTnAnnualReclassification2026Policy: {
          isSubmitted: true,
        },
        usTnCustodyLevelDowngrade2026Policy: {
          isEligible: true,
        },
      });

      const res = usTnPrioritizedOpportunity(resident);
      expect(res?.type).toEqual("usTnAnnualReclassification2026Policy");
    });

    it("returns the opportunity marked as eligible if none marked as submitted", () => {
      const resident = testResident({
        usTnCustodyLevelDowngrade2026Policy: {
          isEligible: true,
        },
      });

      const res = usTnPrioritizedOpportunity(resident);
      expect(res?.type).toEqual("usTnCustodyLevelDowngrade2026Policy");
    });

    it("only considers US_TN_CLASSIFICATION_OPPORTUNITIES", () => {
      const resident = testResident({
        usTnCustodyLevelDowngrade2026Policy: {
          isEligible: true,
        },
      });

      // @ts-expect-error dummy opportunity type
      resident.opportunities.someOtherOpp = [
        {
          type: "someOtherOpp",
          isEligible: true,
          isSubmitted: true,
        } as unknown as Opportunity,
      ];

      const res = usTnPrioritizedOpportunity(resident);
      expect(res?.type).toEqual("usTnCustodyLevelDowngrade2026Policy");
    });

    it("returns undefined if no opportunities are eligible", () => {
      const resident = testResident();

      const res = usTnPrioritizedOpportunity(resident);
      expect(res).toBeUndefined();
    });
  });
});
