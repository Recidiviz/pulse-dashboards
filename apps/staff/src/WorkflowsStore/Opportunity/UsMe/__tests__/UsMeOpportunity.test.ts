// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { RootStore } from "../../../../RootStore";
import { TenantId } from "../../../../RootStore/types";
import { Client } from "../../../Client";
import { Resident } from "../../../Resident";
import {
  UsTnExpirationEligibleClientRecord,
  usTnVerifiedOpportunities,
} from "../../UsTn/__fixtures__";
import {
  usMeEarlyTerminationEligibleClientRecord,
  usMePersonRecord,
  usMePersonRecordShorterSentence,
  usMeVerifiedOpportunities,
} from "../__fixtures__";

let client: Client;
let resident: Resident;
let root: RootStore;

jest.mock("../../../subscriptions");

function createResidentTestUnit(
  residentRecord: typeof usMePersonRecord,
  verifiedOpps: Record<string, any>,
  portionServedNeeded: string
) {
  root = new RootStore();
  // @ts-ignore
  jest.spyOn(root.workflowsStore, "selectedPerson", "get").mockReturnValue({
    verifiedOpportunities: verifiedOpps,
  });
  // @ts-ignore
  jest.spyOn(root.workflowsStore, "selectedResident", "get").mockReturnValue({
    ...usMePersonRecord,
    portionServedNeeded,
  });

  jest
    .spyOn(root, "currentTenantId", "get")
    .mockReturnValue(residentRecord.stateCode as TenantId);

  resident = new Resident(residentRecord, root);
}

type clientType =
  | typeof usMeEarlyTerminationEligibleClientRecord
  | typeof UsTnExpirationEligibleClientRecord;

function createClientTestUnit(
  clientRecord: clientType,
  verifiedOpps: Record<string, any>
) {
  root = new RootStore();

  // @ts-ignore
  jest.spyOn(root.workflowsStore, "selectedPerson", "get").mockReturnValue({
    verifiedOpportunities: verifiedOpps,
  });
  // @ts-ignore
  jest.spyOn(root.workflowsStore, "selectedClient", "get").mockReturnValue({
    ...usMeEarlyTerminationEligibleClientRecord,
  });

  jest
    .spyOn(root, "currentTenantId", "get")
    .mockReturnValue(clientRecord.stateCode as TenantId);

  client = new Client(clientRecord, root);
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(new Date(2022, 12, 1));
});

afterEach(() => {
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("resident has 2/3 date; eligible for SCCP and Furlough", () => {
  beforeEach(() => {
    const testOpportunities = {
      usMeSCCP: usMeVerifiedOpportunities.usMeSCCP,
      usMeFurloughRelease: usMeVerifiedOpportunities.usMeFurloughRelease,
    };
    createResidentTestUnit(usMePersonRecord, testOpportunities, "2/3");
  });

  test("portionServedDates has half", () => {
    expect(
      resident.portionServedDates.some((entry) => entry.heading === "Half Time")
    ).toBeTruthy();
  });

  test("portionServedDates has two thirds", () => {
    expect(
      resident.portionServedDates.some(
        (entry) => entry.heading === "Two Thirds Time"
      )
    ).toBeTruthy();
  });
});

describe("resident has 1/2 date; eligible for SCCP and Furlough", () => {
  beforeEach(() => {
    const testOpportunities = {
      usMeSCCP: usMeVerifiedOpportunities.usMeSCCP,
      usMeFurloughRelease: usMeVerifiedOpportunities.usMeFurloughRelease,
    };
    createResidentTestUnit(
      usMePersonRecordShorterSentence,
      testOpportunities,
      "1/2"
    );
  });

  test("portionServedDates has half", () => {
    expect(
      resident.portionServedDates.some((entry) => entry.heading === "Half Time")
    ).toBeTruthy();
  });

  test("portionServedDates does not have two thirds", () => {
    expect(
      resident.portionServedDates.some(
        (entry) => entry.heading === "Two Thirds Time"
      )
    ).toBeFalsy();
  });
});

describe("resident has 2/3 date; eligible for SCCP", () => {
  beforeEach(() => {
    const testOpportunities = {
      usMeSCCP: usMeVerifiedOpportunities.usMeSCCP,
    };

    createResidentTestUnit(usMePersonRecord, testOpportunities, "2/3");
  });

  test("portionServedDates does have half, which is the default.", () => {
    expect(
      resident.portionServedDates.some((entry) => entry.heading === "Half Time")
    ).toBeTruthy();
  });

  test("portionServedDates has two thirds", () => {
    expect(
      resident.portionServedDates.some(
        (entry) => entry.heading === "Two Thirds Time"
      )
    ).toBeTruthy();
  });

  test("portionServedDates has only two entries", () => {
    expect(resident.portionServedDates.length).toEqual(2);
  });
});

describe("resident has 2/3 date; eligible for Work Release", () => {
  beforeEach(() => {
    const testOpportunities = {
      usMeWorkRelease: usMeVerifiedOpportunities.usMeWorkRelease,
    };

    createResidentTestUnit(usMePersonRecord, testOpportunities, "2/3");
  });

  test("portionServedDates has one entry", () => {
    expect(resident.portionServedDates.length).toEqual(1);
  });
});

describe("resident has 1/2 date; eligible for Work Release", () => {
  beforeEach(() => {
    const testOpportunities = {
      usMeWorkRelease: usMeVerifiedOpportunities.usMeWorkRelease,
    };

    createResidentTestUnit(
      usMePersonRecordShorterSentence,
      testOpportunities,
      "1/2"
    );
  });

  test("portionServedDates has one entry", () => {
    expect(resident.portionServedDates.length).toEqual(1);
  });
});

describe("resident has 1/2 date; eligible for all incarceration opp", () => {
  beforeEach(() => {
    const testOpportunities = {
      usMeSCCP: usMeVerifiedOpportunities.usMeSCCP,
      usMeFurloughRelease: usMeVerifiedOpportunities.usMeFurloughRelease,
      usMeWorkRelease: usMeVerifiedOpportunities.usMeWorkRelease,
    };

    createResidentTestUnit(
      usMePersonRecordShorterSentence,
      testOpportunities,
      "1/2"
    );
  });

  test("portionServedDates has half", () => {
    expect(
      resident.portionServedDates.some((entry) => entry.heading === "Half Time")
    ).toBeTruthy();
  });

  test("portionServedDates has one entry", () => {
    expect(resident.portionServedDates.length).toEqual(1);
  });
});

describe("resident has 2/3 date; eligible for all incarceration opp", () => {
  beforeEach(() => {
    const testOpportunities = {
      usMeSCCP: usMeVerifiedOpportunities.usMeSCCP,
      usMeFurloughRelease: usMeVerifiedOpportunities.usMeFurloughRelease,
      usMeWorkRelease: usMeVerifiedOpportunities.usMeWorkRelease,
    };

    createResidentTestUnit(
      usMePersonRecordShorterSentence,
      testOpportunities,
      "2/3"
    );
  });

  test("portionServedDates has half", () => {
    expect(
      resident.portionServedDates.some((entry) => entry.heading === "Half Time")
    ).toBeTruthy();
  });

  test("portionServedDates has two thirds", () => {
    expect(
      resident.portionServedDates.some(
        (entry) => entry.heading === "Two Thirds Time"
      )
    ).toBeTruthy();
  });

  test("portionServedDates has two entries", () => {
    expect(resident.portionServedDates.length).toEqual(2);
  });
});

describe("resident does not have any opps, and none are active. The resident should still have a half-time date", () => {
  beforeEach(() => {
    const testOpportunities = {};

    createResidentTestUnit(
      { ...usMePersonRecordShorterSentence, allEligibleOpportunities: [] },
      testOpportunities,
      "2/3"
    );
  });

  test("portionServedDates has half-time date if user tenantId is US_ME", () => {
    expect(resident.portionServedDates.length).toEqual(1);
    expect(
      resident.portionServedDates.some((entry) => entry.heading === "Half Time")
    ).toBeTruthy();
  });
});

describe("client not from US_ME", () => {
  beforeEach(() => {
    const testOpportunities = {
      // give TN opportunity
      UsTnExpiration: usTnVerifiedOpportunities.usTnExpirationOpportunity,
    };

    createClientTestUnit(UsTnExpirationEligibleClientRecord, testOpportunities);
  });

  test("portionServedDates is empty", () => {
    expect(client.portionServedDates.length).toEqual(0);
  });
});

describe("client on EarlyTermination", () => {
  beforeEach(() => {
    const testOpportunities = {
      usMeEarlyTermination: usMeVerifiedOpportunities.usMeEarlyTermination,
    };

    createClientTestUnit(
      usMeEarlyTerminationEligibleClientRecord,
      testOpportunities
    );
  });

  test("portionServedDates has half", () => {
    expect(
      client.portionServedDates.some((entry) => entry.heading === "Half Time")
    ).toBeTruthy();
  });

  test("portionServedDates has one element", () => {
    expect(client.portionServedDates.length).toEqual(1);
  });
});
