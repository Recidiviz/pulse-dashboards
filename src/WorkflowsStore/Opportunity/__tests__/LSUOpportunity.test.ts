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

import { configure, when } from "mobx";
import tk from "timekeeper";

import { subscribeToLSUReferral } from "../../../firestore";
import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import {
  LSUEligibleClientRecord,
  LSUReferralRecordFixture,
} from "../__fixtures__";
import { createLSUOpportunity } from "../LSUOpportunity";
import { LSUCriteria, LSUReferralRecord } from "../LSUReferralRecord";
import {
  COMPLETED_UPDATE,
  DENIED_UPDATE,
  INCOMPLETE_UPDATE,
} from "../testUtils";
import { Opportunity } from "../types";
import { LSUOpportunityStatuses } from "../utils";

type LSUOpportunity = {
  record: LSUReferralRecord | undefined;
};

let et: Opportunity & LSUOpportunity;
let client: Client;
let root: RootStore;

jest.mock("../../../firestore");
let mockUpdates: jest.SpyInstance;

const mockSubscribeToLSUReferral = subscribeToLSUReferral as jest.MockedFunction<
  typeof subscribeToLSUReferral
>;

function createTestUnit(clientRecord: typeof LSUEligibleClientRecord) {
  root = new RootStore();
  client = new Client(clientRecord, root);

  const maybeOpportunity = createLSUOpportunity(
    clientRecord.LSUEligible,
    client
  );

  if (maybeOpportunity === undefined) {
    throw new Error("Unable to create opportunity instance");
  }

  client.opportunities.LSU = maybeOpportunity;
  et = maybeOpportunity;
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(new Date(2022, 7, 1));
  mockUpdates = jest.spyOn(Client.prototype, "opportunityUpdates", "get");
  // mimics the value when the fetch returns no updates
  mockUpdates.mockReturnValue({
    LSU: { type: "LSU" },
  });
});

afterEach(() => {
  jest.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    mockSubscribeToLSUReferral.mockImplementation((_clientId, handler) => {
      handler(LSUReferralRecordFixture);
      return jest.fn();
    });
    createTestUnit(LSUEligibleClientRecord);
  });

  test("review status", () => {
    expect(et.reviewStatus).toBe("PENDING");

    mockUpdates.mockReturnValue(INCOMPLETE_UPDATE);
    expect(et.reviewStatus).toBe("IN_PROGRESS");

    mockUpdates.mockReturnValue(DENIED_UPDATE);
    expect(et.reviewStatus).toBe("DENIED");

    mockUpdates.mockReturnValue(COMPLETED_UPDATE);
    expect(et.reviewStatus).toBe("COMPLETED");
  });

  test("short status message", () => {
    expect(et.statusMessageShort).toBe(LSUOpportunityStatuses.PENDING);

    mockUpdates.mockReturnValue(INCOMPLETE_UPDATE);
    expect(et.statusMessageShort).toBe(LSUOpportunityStatuses.IN_PROGRESS);

    mockUpdates.mockReturnValue(DENIED_UPDATE);
    expect(et.statusMessageShort).toBe(LSUOpportunityStatuses.DENIED);

    mockUpdates.mockReturnValue(COMPLETED_UPDATE);
    expect(et.statusMessageShort).toBe(LSUOpportunityStatuses.COMPLETED);
  });

  test("extended status message", () => {
    expect(et.statusMessageLong).toBe(LSUOpportunityStatuses.PENDING);
  });

  test("rank by status", () => {
    expect(et.rank).toBe(0);
  });

  test("requirements almost met", () => {
    expect(et.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", async () => {
    await when(() => et.record !== undefined);
    expect(et.requirementsMet).toMatchSnapshot();
  });
});
