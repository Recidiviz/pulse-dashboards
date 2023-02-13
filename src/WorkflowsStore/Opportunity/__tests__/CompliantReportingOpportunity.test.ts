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

import { ClientRecord } from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import { DocumentSubscription } from "../../subscriptions";
import { WorkflowsStore } from "../../WorkflowsStore";
import {
  compliantReportingAlmostEligibleClientRecord,
  compliantReportingAlmostEligibleCriteria,
  compliantReportingAlmostEligibleReferralRecord,
  compliantReportingEligibleClientRecord,
  compliantReportingReferralRecord,
} from "../__fixtures__";
import type { CompliantReportingOpportunity } from "../CompliantReportingOpportunity";
import { transformCompliantReportingReferral } from "../CompliantReportingReferralRecord";
import {
  COMPLETED_UPDATE,
  DENIED_UPDATE,
  INCOMPLETE_FORM_UPDATE,
} from "../testUtils";
import { rankByReviewStatus } from "../utils";
import { constructorSpy } from "./testUtils";

jest.mock("firebase/firestore");
jest.mock("../../subscriptions");

let cr: CompliantReportingOpportunity;
let client: Client;
let root: RootStore;
let referralSub: DocumentSubscription<any>;
let updatesSub: DocumentSubscription<any>;

function createTestUnit(clientRecord: ClientRecord) {
  root = new RootStore();
  jest
    .spyOn(root.workflowsStore, "opportunityTypes", "get")
    .mockReturnValue(["compliantReporting"]);
  client = new Client(clientRecord, root);
  const maybeOpportunity = client.potentialOpportunities.compliantReporting;
  if (maybeOpportunity === undefined) {
    throw new Error("Unable to create opportunity instance");
  }
  cr = maybeOpportunity;
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(new Date(2022, 7, 1));
  jest.resetAllMocks();
});

afterEach(() => {
  jest.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    createTestUnit(compliantReportingEligibleClientRecord);
    referralSub = cr.referralSubscription;
    updatesSub = cr.updatesSubscription;
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

  test("rank by review status", () => {
    expect(rankByReviewStatus(cr)).toEqual(0);
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

      referralSub = cr.referralSubscription;
      updatesSub = cr.updatesSubscription;
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

    test("rank by review status", () => {
      updatesSub.data = DENIED_UPDATE;
      expect(rankByReviewStatus(cr)).toEqual(5);
    });
  }
);

describe("hydration is lowest common denominator of all subscriptions", () => {
  beforeEach(() => {
    createTestUnit(compliantReportingEligibleClientRecord);
    referralSub = cr.referralSubscription;
    updatesSub = cr.updatesSubscription;
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

  referralSub = cr.referralSubscription;
  updatesSub = cr.updatesSubscription;

  cr.hydrate();
  expect(referralSub.hydrate).toHaveBeenCalled();
  expect(updatesSub.hydrate).toHaveBeenCalled();
});

test("fetch CompliantReportingReferral uses recordId", async () => {
  createTestUnit(compliantReportingEligibleClientRecord);
  cr.hydrate();

  expect(constructorSpy).toHaveBeenCalledWith(
    root.firestoreStore,
    "compliantReportingReferrals",
    compliantReportingEligibleClientRecord.recordId,
    transformCompliantReportingReferral,
    expect.any(Function)
  );
});
