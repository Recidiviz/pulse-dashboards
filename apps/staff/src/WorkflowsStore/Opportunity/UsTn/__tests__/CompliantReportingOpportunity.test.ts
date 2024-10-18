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

import { DocumentData } from "firebase/firestore";
import { cloneDeep } from "lodash";
import { configure } from "mobx";
import tk from "timekeeper";

import { ClientRecord } from "../../../../FirestoreStore";
import { RootStore } from "../../../../RootStore";
import { Client } from "../../../Client";
import { DocumentSubscription } from "../../../subscriptions";
import {
  COMPLETED_UPDATE,
  DENIED_UPDATE,
  INCOMPLETE_FORM_UPDATE,
} from "../../testUtils";
import {
  compliantReportingAlmostEligibleClientRecord,
  compliantReportingAlmostEligibleReferralRecord,
  compliantReportingEligibleClientRecord,
  compliantReportingEligibleWithDiscretionReferralRecord,
  compliantReportingIneligibleCriteria,
  compliantReportingReferralRecord,
} from "../__fixtures__";
import { CompliantReportingOpportunity } from "../CompliantReportingOpportunity";
import { CompliantReportingReferralRecord } from "../CompliantReportingOpportunity";

vi.mock("firebase/firestore");
vi.mock("../../../subscriptions");

let cr: CompliantReportingOpportunity;
let client: Client;
let root: RootStore;
let updatesSub: DocumentSubscription<any>;

function createTestUnit(
  clientRecord: ClientRecord,
  opportunityRecord: DocumentData,
) {
  root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  vi.spyOn(root.workflowsStore, "opportunityTypes", "get").mockReturnValue([
    "compliantReporting",
  ]);
  vi.spyOn(root.workflowsStore, "featureVariants", "get").mockReturnValue({});
  client = new Client(clientRecord, root);
  cr = new CompliantReportingOpportunity(client, opportunityRecord);
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(new Date(2022, 7, 1));
  vi.resetAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    createTestUnit(
      compliantReportingEligibleClientRecord,
      compliantReportingReferralRecord,
    );
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
    expect(cr.requirementsMet).toMatchSnapshot();
  });

  test("recommended note", () => {
    // this is for almost eligible only
    expect(cr.almostEligibleRecommendedNote).toBeUndefined();
  });
});

describe("fully eligible with discretion", () => {
  beforeEach(() => {
    createTestUnit(
      compliantReportingEligibleClientRecord,
      compliantReportingEligibleWithDiscretionReferralRecord,
    );
    updatesSub = cr.updatesSubscription;
  });

  test("eligible with discretion", async () => {
    expect(cr.requirementsMet).toMatchSnapshot();
  });
});

describe.each([
  [
    "usTnFinesFeesEligible",
    "Needs balance <$500 or a payment three months in a row",
    undefined,
    /Fee balance/,
    /make a payment three months in a row/,
  ],
  [
    "usTnNoRecentCompliantReportingRejections",
    "Double check TEST1 contact note",
    /Has reported as instructed/,
    /DECF, DEDF, DEDU,/,
  ],
  [
    "usTnNoHighSanctionsInPastYear",
    "Needs 14 more days without sanction higher than level 1",
    /sanctions/,
    /Sanctions/,
    /get any sanctions/,
  ],
  [
    "usTnOnEligibleLevelForSufficientTime",
    "Needs 14 more days on medium",
    /minimum supervision level for 1 year /,
    /on medium supervision for /,
    /stay on your current supervision level/,
  ],
] as [
  criterionKey: keyof CompliantReportingReferralRecord["ineligibleCriteria"],
  expectedListText: string,
  expectedToolip: RegExp | undefined,
  expectedMissingText: RegExp,
  expectedNote?: RegExp,
][])(
  "almost eligible but for %s",
  (
    criterionKey,
    expectedListText,
    expectedTooltip,
    expectedMissingText,
    expectedNote,
  ) => {
    beforeEach(() => {
      const testRecord = cloneDeep(
        compliantReportingAlmostEligibleReferralRecord,
      );

      testRecord.ineligibleCriteria = {
        [criterionKey]:
          compliantReportingIneligibleCriteria[
            criterionKey as keyof typeof compliantReportingIneligibleCriteria
          ],
      };

      createTestUnit(compliantReportingAlmostEligibleClientRecord, testRecord);

      updatesSub = cr.updatesSubscription;
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
        }),
      ).toBeUndefined();
    });

    test("recommended note", () => {
      if (expectedNote) {
        expect(cr.almostEligibleRecommendedNote?.text).toMatch(expectedNote);
      } else {
        expect(cr.almostEligibleRecommendedNote).toBeUndefined();
      }
    });
  },
);

test("hydrate", () => {
  createTestUnit(
    compliantReportingEligibleClientRecord,
    compliantReportingReferralRecord,
  );

  updatesSub = cr.updatesSubscription;

  cr.hydrate();
  expect(updatesSub.hydrate).toHaveBeenCalled();
});
