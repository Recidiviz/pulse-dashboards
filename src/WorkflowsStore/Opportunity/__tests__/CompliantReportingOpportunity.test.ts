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
import {
  CollectionDocumentSubscription,
  OpportunityUpdateSubscription,
} from "../../subscriptions";
import { WorkflowsStore } from "../../WorkflowsStore";
import {
  compliantReportingAlmostEligibleClientRecord,
  compliantReportingAlmostEligibleCriteria,
  compliantReportingAlmostEligibleReferralRecord,
  compliantReportingEligibleClientRecord,
  compliantReportingReferralRecord,
} from "../__fixtures__";
import type { CompliantReportingOpportunity } from "../CompliantReportingOpportunity";
import {
  COMPLETED_UPDATE,
  DENIED_UPDATE,
  INCOMPLETE_FORM_UPDATE,
} from "../testUtils";

jest.mock("../../subscriptions");

let cr: CompliantReportingOpportunity;
let client: Client;
let root: RootStore;
let referralSub: CollectionDocumentSubscription<any>;
let updatesSub: OpportunityUpdateSubscription<any>;

const CollectionDocumentSubscriptionMock = CollectionDocumentSubscription as jest.MockedClass<
  typeof CollectionDocumentSubscription
>;
const OpportunityUpdateSubscriptionMock = OpportunityUpdateSubscription as jest.MockedClass<
  typeof OpportunityUpdateSubscription
>;

jest.mock("../../../firestore");

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
});

afterEach(() => {
  jest.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    createTestUnit(compliantReportingEligibleClientRecord);
    [updatesSub] = OpportunityUpdateSubscriptionMock.mock.instances;
    [referralSub] = CollectionDocumentSubscriptionMock.mock.instances;
  });

  test("review status", () => {
    expect(cr.reviewStatus).toBe("PENDING");

    updatesSub.data = INCOMPLETE_FORM_UPDATE;

    expect(cr.reviewStatus).toBe("IN_PROGRESS");

    updatesSub.data = DENIED_UPDATE;
    expect(cr.reviewStatus).toBe("DENIED");

    updatesSub.data = COMPLETED_UPDATE;
    expect(cr.reviewStatus).toBe("COMPLETED");
  });

  test("rank by status", () => {
    expect(cr.rank).toBe(0);

    updatesSub.data = INCOMPLETE_FORM_UPDATE;
    expect(cr.rank).toBe(1);

    updatesSub.data = DENIED_UPDATE;
    expect(cr.rank).toBe(2);

    updatesSub.data = COMPLETED_UPDATE;
    expect(cr.rank).toBe(3);
  });

  test("requirements almost met", () => {
    expect(cr.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", async () => {
    referralSub.data = compliantReportingReferralRecord;
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
] as [criterionKey: keyof typeof compliantReportingAlmostEligibleCriteria, expectedRank: number, expectedListText: string, expectedToolip: RegExp | undefined, expectedMissingText: RegExp, expectedNote?: RegExp][])(
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
        [criterionKey]: compliantReportingAlmostEligibleCriteria[criterionKey],
      };

      const testRecord = cloneDeep(
        compliantReportingAlmostEligibleReferralRecord
      );
      testRecord.almostEligibleCriteria = almostEligibleCriteria;

      createTestUnit(compliantReportingAlmostEligibleClientRecord);

      [referralSub] = CollectionDocumentSubscriptionMock.mock.instances;
      [updatesSub] = OpportunityUpdateSubscriptionMock.mock.instances;
      referralSub.data = testRecord;
    });

    test("review status", () => {
      expect(cr.reviewStatus).toBe("ALMOST");

      updatesSub.data = INCOMPLETE_FORM_UPDATE;
      expect(cr.reviewStatus).toBe("ALMOST");

      updatesSub.data = DENIED_UPDATE;
      expect(cr.reviewStatus).toBe("DENIED");

      updatesSub.data = COMPLETED_UPDATE;
      expect(cr.reviewStatus).toBe("ALMOST");
    });

    test("rank by status", () => {
      expect(cr.rank).toBe(expectedRank);

      updatesSub.data = DENIED_UPDATE;
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

describe("hydration is lowest common denominator of all subscriptions", () => {
  beforeEach(() => {
    createTestUnit(compliantReportingEligibleClientRecord);
    [referralSub] = CollectionDocumentSubscriptionMock.mock.instances;
    [updatesSub] = OpportunityUpdateSubscriptionMock.mock.instances;
  });

  test.each([
    [undefined, undefined, undefined],
    [undefined, true, undefined],
    [undefined, false, undefined],
    [true, true, true],
    [true, false, true],
    [false, false, false],
  ])("%s + %s = %s", (statusA, statusB, result) => {
    referralSub.isLoading = statusA;
    updatesSub.isLoading = statusB;
    expect(cr.isLoading).toBe(result);

    referralSub.isLoading = statusB;
    updatesSub.isLoading = statusA;
    expect(cr.isLoading).toBe(result);
  });
});

test("hydrate", () => {
  createTestUnit(compliantReportingEligibleClientRecord);

  [referralSub] = CollectionDocumentSubscriptionMock.mock.instances;

  [updatesSub] = OpportunityUpdateSubscriptionMock.mock.instances;

  cr.hydrate();
  expect(referralSub.hydrate).toHaveBeenCalled();
  expect(updatesSub.hydrate).toHaveBeenCalled();
});

test("fetch CompliantReportingReferral uses recordId", async () => {
  createTestUnit(compliantReportingEligibleClientRecord);

  cr.hydrate();

  expect(CollectionDocumentSubscriptionMock).toHaveBeenCalledWith(
    "compliantReportingReferrals",
    compliantReportingEligibleClientRecord.recordId,
    undefined,
    expect.any(Function)
  );
});
