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

import { configure, runInAction } from "mobx";
import { IDisposer } from "mobx-utils";

import {
  trackOpportunityPreviewed,
  trackReferralFormViewed,
  trackSetOpportunityStatus,
  trackSurfacedInList,
} from "../../analytics";
import {
  updateOpportunityCompleted,
  updateOpportunityDenial,
} from "../../firestore";
import { RootStore } from "../../RootStore";
import { eligibleClient, mockOfficer } from "../__fixtures__";
import { Client } from "../Client";
import {
  CompliantReportingOpportunity,
  OPPORTUNITY_TYPES,
} from "../Opportunity";
import { DocumentSubscription } from "../subscriptions";
import { dateToTimestamp } from "../utils";
import { OTHER_KEY } from "../WorkflowsStore";

let testObserver: IDisposer;

jest.mock("../../analytics");
jest.mock("../../firestore");
jest.mock("../../core/Paperwork/US_TN/Transformer");
jest.mock("../subscriptions");

const mockUpdateOpportunityDenial = updateOpportunityDenial as jest.MockedFunction<
  typeof updateOpportunityDenial
>;
const mockUpdateOpportunityCompleted = updateOpportunityCompleted as jest.MockedFunction<
  typeof updateOpportunityCompleted
>;

let client: Client;
let rootStore: RootStore;
let compliantReportingUpdatesSub: DocumentSubscription<any>;

beforeEach(() => {
  // this lets us spy on mobx computed getters
  configure({ safeDescriptors: false });
  jest.resetAllMocks();
  rootStore = new RootStore();
  const eligibleClientWithAllOpps = {
    ...eligibleClient,
    earlyTerminationEligible: true,
    earnedDischargeEligible: true,
    LSUEligible: true,
    pastFTRDEligible: true,
    supervisionLevelDowngradeEligible: true,
    usTnExpirationEligible: true,
  };
  jest
    .spyOn(rootStore.workflowsStore, "opportunityTypes", "get")
    .mockReturnValue([...OPPORTUNITY_TYPES]);
  client = new Client(eligibleClientWithAllOpps, rootStore);

  // for simplicity we will mark all the subs as hydrated, though we may update data later
  Object.values(client.potentialOpportunities).forEach((opp) => {
    if (!opp) return;
    /* eslint-disable no-param-reassign */
    opp.referralSubscription.isLoading = false;
    opp.referralSubscription.isHydrated = true;

    opp.updatesSubscription.isLoading = false;
    opp.updatesSubscription.isHydrated = true;
    /* eslint-enable no-param-reassign */

    if (opp instanceof CompliantReportingOpportunity) {
      compliantReportingUpdatesSub = opp.updatesSubscription;
    }
  });
});

afterEach(() => {
  configure({ safeDescriptors: true });

  // clean up any Mobx observers to avoid leaks
  if (testObserver) {
    testObserver();
  }
});

test.each(OPPORTUNITY_TYPES)(
  "set %s opportunity ineligible",
  async (opportunityType) => {
    rootStore.workflowsStore.user = mockOfficer;

    const reasons = ["test1", "test2"];

    await client.setOpportunityDenialReasons(reasons, opportunityType);

    expect(mockUpdateOpportunityDenial).toHaveBeenCalledWith(
      mockOfficer.info.email,
      client.recordId,
      { reasons },
      opportunityType,
      { otherReason: true }
    );

    expect(mockUpdateOpportunityCompleted).toHaveBeenCalledWith(
      mockOfficer.info.email,
      client.recordId,
      opportunityType,
      true
    );
    expect(trackSetOpportunityStatus).toHaveBeenCalledWith({
      clientId: client.pseudonymizedId,
      status: "DENIED",
      opportunityType,
      deniedReasons: reasons,
    });
  }
);

test.each(OPPORTUNITY_TYPES)(
  "set %s opportunity ineligible for other reason",
  (opportunityType) => {
    rootStore.workflowsStore.user = mockOfficer;

    const reasons = ["test1", OTHER_KEY];

    client.setOpportunityDenialReasons(reasons, opportunityType);

    expect(mockUpdateOpportunityDenial).toHaveBeenCalledWith(
      mockOfficer.info.email,
      client.recordId,
      { reasons },
      opportunityType,
      undefined
    );

    const newReasons = reasons.slice(0, 1);

    client.setOpportunityDenialReasons(newReasons, opportunityType);

    expect(mockUpdateOpportunityDenial).toHaveBeenCalledWith(
      mockOfficer.info.email,
      client.recordId,
      { reasons: newReasons },
      opportunityType,
      // this will delete the related field if reasons do not include "other"
      { otherReason: true }
    );
  }
);

test.each(OPPORTUNITY_TYPES)(
  "set %s opportunity other reason",
  (opportunityType) => {
    rootStore.workflowsStore.user = mockOfficer;

    const otherReason = "some other reason";
    client.setOpportunityOtherReason(opportunityType, otherReason);

    expect(mockUpdateOpportunityDenial).toHaveBeenCalledWith(
      mockOfficer.info.email,
      client.recordId,
      { otherReason },
      opportunityType
    );
  }
);

test.each(OPPORTUNITY_TYPES)(
  "clear denial reasons for opportunity %s",
  async (opportunityType) => {
    rootStore.workflowsStore.user = mockOfficer;

    const reasons = ["test1", OTHER_KEY];
    await client.setOpportunityDenialReasons(reasons, opportunityType);

    await client.setOpportunityDenialReasons([], opportunityType);

    expect(trackSetOpportunityStatus).toHaveBeenCalledTimes(2);
    expect(trackSetOpportunityStatus).toHaveBeenLastCalledWith({
      clientId: client.pseudonymizedId,
      status: "IN_PROGRESS",
      opportunityType,
    });
  }
);

test.each(OPPORTUNITY_TYPES)(
  "print client reporting form for %s opportunity",
  (opportunityType) => {
    rootStore.workflowsStore.user = mockOfficer;

    expect(client.formIsPrinting).toBe(false);

    client.printReferralForm(opportunityType);

    expect(client.formIsPrinting).toBe(true);

    client.setFormIsPrinting(false);
  }
);

test.each(OPPORTUNITY_TYPES)(
  "mark client as completed when printing form for %s opportunity",
  (opportunityType) => {
    rootStore.workflowsStore.user = mockOfficer;

    client.printReferralForm(opportunityType);

    expect(mockUpdateOpportunityCompleted).toHaveBeenCalledWith(
      mockOfficer.info.email,
      client.recordId,
      opportunityType
    );
    expect(trackSetOpportunityStatus).toHaveBeenCalledWith({
      clientId: client.pseudonymizedId,
      status: "COMPLETED",
      opportunityType,
    });
  }
);

test("don't record a completion if user is ineligible", () => {
  runInAction(() => {
    rootStore.workflowsStore.user = mockOfficer;
    compliantReportingUpdatesSub.data = {
      denial: {
        reasons: ["test"],
        updated: { by: "test", date: dateToTimestamp("2022-02-01") },
      },
    };
  });

  client.printReferralForm("compliantReporting");

  expect(mockUpdateOpportunityCompleted).not.toHaveBeenCalled();
  expect(trackSetOpportunityStatus).not.toHaveBeenCalled();
});

test("don't record redundant completions for already completed workflows", () => {
  runInAction(() => {
    rootStore.workflowsStore.user = mockOfficer;
    compliantReportingUpdatesSub.data = {
      completed: { by: "test", date: dateToTimestamp("2022-02-01") },
    };
  });

  client.printReferralForm("compliantReporting");

  expect(mockUpdateOpportunityCompleted).not.toHaveBeenCalled();
  expect(trackSetOpportunityStatus).not.toHaveBeenCalled();
});

test("form view tracking", async () => {
  await client.trackFormViewed("compliantReporting");

  expect(trackReferralFormViewed).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    opportunityType: "compliantReporting",
  });
});

test("form view tracking waits for updates", async () => {
  const trackingCall = client.trackFormViewed("compliantReporting");

  // simulate fetch latency
  setTimeout(() => {
    runInAction(() => {
      compliantReportingUpdatesSub.data = {
        completed: {
          update: { by: "abc", date: dateToTimestamp("2022-01-01") },
        },
      };
    });
  }, 10);

  await trackingCall;

  expect(trackReferralFormViewed).toHaveBeenCalledTimes(1);
  expect(trackReferralFormViewed).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    opportunityType: "compliantReporting",
  });
});

test("list view tracking", async () => {
  await client.trackListViewed("compliantReporting");

  expect(trackSurfacedInList).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    opportunityType: "compliantReporting",
  });
});

test("list view tracking waits for updates", async () => {
  const trackingCall = client.trackListViewed("compliantReporting");

  // simulate fetch latency
  setTimeout(() => {
    runInAction(() => {
      compliantReportingUpdatesSub.data = {
        completed: {
          update: { by: "abc", date: dateToTimestamp("2022-01-01") },
        },
      };
    });
  }, 10);

  await trackingCall;

  expect(trackSurfacedInList).toHaveBeenCalledTimes(1);
  expect(trackSurfacedInList).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    opportunityType: "compliantReporting",
  });
});

test("opportunity preview tracking", async () => {
  await client.trackOpportunityPreviewed("compliantReporting");

  expect(trackOpportunityPreviewed).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    opportunityType: "compliantReporting",
  });
});

test("opportunity preview tracking waits for updates", async () => {
  const trackingCall = client.trackOpportunityPreviewed("compliantReporting");

  // simulate fetch latency
  setTimeout(() => {
    runInAction(() => {
      compliantReportingUpdatesSub.data = {
        completed: {
          update: { by: "abc", date: dateToTimestamp("2022-01-01") },
        },
      };
    });
  }, 10);

  await trackingCall;

  expect(trackOpportunityPreviewed).toHaveBeenCalledTimes(1);
  expect(trackOpportunityPreviewed).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    opportunityType: "compliantReporting",
  });
});
