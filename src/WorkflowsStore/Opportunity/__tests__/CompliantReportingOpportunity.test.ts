// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { cloneDeep } from "lodash";
import { configure } from "mobx";
import tk from "timekeeper";

import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import { WorkflowsStore } from "../../WorkflowsStore";
import {
  compliantReportingAlmostEligibleClientRecord,
  CompliantReportingAlmostEligibleCriteria,
  compliantReportingEligibleClientRecord,
} from "../__fixtures__";
import {
  COMPLETED_UPDATE,
  DENIED_UPDATE,
  INCOMPLETE_UPDATE,
} from "../testUtils";
import { Opportunity } from "../types";
import { defaultOpportunityStatuses } from "../utils";

let cr: Opportunity;
let client: Client;
let root: RootStore;
let mockUpdates: jest.SpyInstance;

function createTestUnit(
  clientRecord: typeof compliantReportingEligibleClientRecord
) {
  root = new RootStore();
  client = new Client(clientRecord, root);
  const maybeOpportunity = client.opportunities.compliantReporting;

  if (maybeOpportunity === undefined) {
    throw new Error("Unable to create opportunity instance");
  }
  cr = maybeOpportunity;
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(new Date(2022, 7, 1));
  mockUpdates = jest.spyOn(Client.prototype, "opportunityUpdates", "get");
  // mimics the initial value when nothing has been fetched yet
  mockUpdates.mockReturnValue({});
});

afterEach(() => {
  jest.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    createTestUnit(compliantReportingEligibleClientRecord);
  });

  test("review status", () => {
    expect(cr.reviewStatus).toBe("PENDING");

    mockUpdates.mockReturnValue(INCOMPLETE_UPDATE);
    expect(cr.reviewStatus).toBe("IN_PROGRESS");

    mockUpdates.mockReturnValue(DENIED_UPDATE);
    expect(cr.reviewStatus).toBe("DENIED");

    mockUpdates.mockReturnValue(COMPLETED_UPDATE);
    expect(cr.reviewStatus).toBe("COMPLETED");
  });

  test("short status message", () => {
    expect(cr.statusMessageShort).toBe(defaultOpportunityStatuses.PENDING);

    mockUpdates.mockReturnValue(INCOMPLETE_UPDATE);
    expect(cr.statusMessageShort).toBe(defaultOpportunityStatuses.IN_PROGRESS);

    mockUpdates.mockReturnValue(DENIED_UPDATE);
    expect(cr.statusMessageShort).toBe(defaultOpportunityStatuses.DENIED);

    mockUpdates.mockReturnValue(COMPLETED_UPDATE);
    expect(cr.statusMessageShort).toBe(defaultOpportunityStatuses.COMPLETED);
  });

  test("extended status message", () => {
    expect(cr.statusMessageLong).toBe(defaultOpportunityStatuses.PENDING);

    mockUpdates.mockReturnValue(INCOMPLETE_UPDATE);
    expect(cr.statusMessageLong).toBe(defaultOpportunityStatuses.IN_PROGRESS);

    mockUpdates.mockReturnValue(DENIED_UPDATE);
    expect(cr.statusMessageLong).toBe(
      `${defaultOpportunityStatuses.DENIED} (ABC)`
    );

    mockUpdates.mockReturnValue(COMPLETED_UPDATE);
    expect(cr.statusMessageLong).toBe(defaultOpportunityStatuses.COMPLETED);
  });

  test("rank by status", () => {
    expect(cr.rank).toBe(0);

    mockUpdates.mockReturnValue(INCOMPLETE_UPDATE);
    expect(cr.rank).toBe(1);

    mockUpdates.mockReturnValue(DENIED_UPDATE);
    expect(cr.rank).toBe(2);

    mockUpdates.mockReturnValue(COMPLETED_UPDATE);
    expect(cr.rank).toBe(3);
  });

  test("requirements almost met", () => {
    expect(cr.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", () => {
    expect(cr.requirementsMet).toMatchSnapshot();
  });

  test("recommended note", () => {
    // this is for almost eligible only
    expect(cr.almostEligibleRecommendedNote).toBeUndefined();
  });
});

describe.each([
  [
    "paymentNeeded",
    0,
    "Needs balance <$500 or a payment three months in a row",
    undefined,
    /Fee balance/,
    /make a payment three months in a row/,
  ],
  [
    "passedDrugScreenNeeded",
    1,
    "Needs one more passed drug screen",
    /drug screen/,
    /drug screens/,
    /pass one drug screen/,
  ],
  [
    "recentRejectionCodes",
    2,
    "Double check TEST1 contact note",
    /Has reported as instructed/,
    /DECF, DEDF, DEDU,/,
  ],
  [
    "seriousSanctionsEligibilityDate",
    3,
    "Needs 14 more days without sanction higher than level 1",
    /sanctions/,
    /Sanctions/,
    /get any sanctions/,
  ],
  [
    "currentLevelEligibilityDate",
    4,
    "Needs 14 more days on medium",
    /minimum supervision level for 1 year /,
    /on medium supervision for /,
    /stay on your current supervision level/,
  ],
] as [criterionKey: keyof typeof CompliantReportingAlmostEligibleCriteria, expectedRank: number, expectedListText: string, expectedToolip: RegExp | undefined, expectedMissingText: RegExp, expectedNote?: RegExp][])(
  "almost eligible but for %s",
  (
    criterionKey,
    expectedRank,
    expectedListText,
    expectedTooltip,
    expectedMissingText,
    expectedNote
  ) => {
    beforeEach(() => {
      jest
        .spyOn(WorkflowsStore.prototype, "featureVariants", "get")
        .mockReturnValue({ CompliantReportingAlmostEligible: {} });

      const almostEligibleCriteria = {
        [criterionKey]: CompliantReportingAlmostEligibleCriteria[criterionKey],
      };
      const testRecord = cloneDeep(
        compliantReportingAlmostEligibleClientRecord
      );
      testRecord.compliantReportingEligible.almostEligibleCriteria = almostEligibleCriteria;
      createTestUnit(testRecord);
    });

    test("review status", () => {
      expect(cr.reviewStatus).toBe("ALMOST");

      mockUpdates.mockReturnValue(INCOMPLETE_UPDATE);
      expect(cr.reviewStatus).toBe("ALMOST");

      mockUpdates.mockReturnValue(DENIED_UPDATE);
      expect(cr.reviewStatus).toBe("DENIED");

      mockUpdates.mockReturnValue(COMPLETED_UPDATE);
      expect(cr.reviewStatus).toBe("ALMOST");
    });

    test("short status message", () => {
      expect(cr.statusMessageShort).toBe(defaultOpportunityStatuses.ALMOST);

      mockUpdates.mockReturnValue(INCOMPLETE_UPDATE);
      expect(cr.statusMessageShort).toBe(defaultOpportunityStatuses.ALMOST);

      mockUpdates.mockReturnValue(COMPLETED_UPDATE);
      expect(cr.statusMessageShort).toBe(defaultOpportunityStatuses.ALMOST);

      mockUpdates.mockReturnValue(DENIED_UPDATE);
      expect(cr.statusMessageShort).toBe(defaultOpportunityStatuses.DENIED);
    });
    test("extended status message", () => {
      expect(cr.statusMessageLong).toBe(expectedListText);

      mockUpdates.mockReturnValue(INCOMPLETE_UPDATE);
      expect(cr.statusMessageLong).toBe(expectedListText);

      mockUpdates.mockReturnValue(COMPLETED_UPDATE);
      expect(cr.statusMessageLong).toBe(expectedListText);

      mockUpdates.mockReturnValue(DENIED_UPDATE);
      expect(cr.statusMessageLong).toBe(
        `${defaultOpportunityStatuses.DENIED} (ABC)`
      );
    });

    test("rank by status", () => {
      expect(cr.rank).toBe(expectedRank);

      mockUpdates.mockReturnValue(DENIED_UPDATE);
      expect(cr.rank).toBe(5);
    });

    test("requirements almost met", () => {
      expect(cr.requirementsAlmostMet).toEqual([
        {
          text: expectedListText,
          tooltip: expectedTooltip
            ? expect.stringMatching(expectedTooltip)
            : undefined,
        },
      ]);
    });

    test("requirements met", () => {
      expect(
        cr.requirementsMet.find((req) => {
          return req.text.match(expectedMissingText);
        })
      ).toBeUndefined();
    });

    test("recommended note", () => {
      if (expectedNote) {
        expect(cr.almostEligibleRecommendedNote?.text).toMatch(expectedNote);
      } else {
        expect(cr.almostEligibleRecommendedNote).toBeUndefined();
      }
    });
  }
);
