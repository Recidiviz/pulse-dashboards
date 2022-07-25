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

import { configure } from "mobx";
import tk from "timekeeper";

import { ClientUpdateRecord } from "../../../firestore";
import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import { PracticesStore } from "../../PracticesStore";
import { dateToTimestamp } from "../../utils";
import {
  compliantReportingAlmostEligibleClientRecord,
  compliantReportingEligibleClientRecord,
} from "../__fixtures__";
import { Opportunity } from "../types";
import { defaultOpportunityStatuses } from "../utils";

let cr: Opportunity;
let client: Client;
let root: RootStore;
let mockUpdates: jest.SpyInstance;

const UPDATE_RECORD = {
  by: "foo",
  date: dateToTimestamp("2022-07-15"),
};
const INCOMPLETE_UPDATE: ClientUpdateRecord = { compliantReporting: {} };

const DENIED_UPDATE: ClientUpdateRecord = {
  compliantReporting: { denial: { reasons: ["ABC"], updated: UPDATE_RECORD } },
};

const COMPLETED_UPDATE: ClientUpdateRecord = {
  compliantReporting: { completed: { update: UPDATE_RECORD } },
};

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
  mockUpdates = jest.spyOn(Client.prototype, "updates", "get");
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
});

describe("almost eligible", () => {
  beforeEach(() => {
    jest
      .spyOn(PracticesStore.prototype, "featureVariants", "get")
      .mockReturnValue({ CompliantReportingAlmostEligible: {} });

    createTestUnit(compliantReportingAlmostEligibleClientRecord);
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
    const drugMessage = "Needs one more passed drug screen";
    expect(cr.statusMessageLong).toBe(drugMessage);

    mockUpdates.mockReturnValue(INCOMPLETE_UPDATE);
    expect(cr.statusMessageLong).toBe(drugMessage);

    mockUpdates.mockReturnValue(COMPLETED_UPDATE);
    expect(cr.statusMessageLong).toBe(drugMessage);

    mockUpdates.mockReturnValue(DENIED_UPDATE);
    expect(cr.statusMessageLong).toBe(
      `${defaultOpportunityStatuses.DENIED} (ABC)`
    );
  });

  test("rank by status", () => {
    expect(cr.rank).toBe(1);

    mockUpdates.mockReturnValue(DENIED_UPDATE);
    expect(cr.rank).toBe(5);
  });

  test.todo("requirements almost met");

  test.todo("requirements met");
});
