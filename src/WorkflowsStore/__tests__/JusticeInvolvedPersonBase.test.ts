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

import {
  computed,
  configure,
  IObservableValue,
  observable,
  runInAction,
} from "mobx";

import { JusticeInvolvedPersonRecord } from "../../firestore";
import { RootStore } from "../../RootStore";
import { JusticeInvolvedPersonBase } from "../JusticeInvolvedPersonBase";
import { OpportunityFactory, OpportunityType } from "../Opportunity";
import { OpportunityBase } from "../Opportunity/OpportunityBase";

jest.mock("../subscriptions");

let rootStoreMock: RootStore;
let testPerson: JusticeInvolvedPersonBase;
let record: JusticeInvolvedPersonRecord;
let mockOpportunityTypes: IObservableValue<OpportunityType[]>;

function createTestUnit(
  opportunityFactory: OpportunityFactory<any, any> = () => undefined as any
) {
  testPerson = new JusticeInvolvedPersonBase(
    record,
    rootStoreMock,
    opportunityFactory
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  configure({ safeDescriptors: false });
  mockOpportunityTypes = observable.box([]);
  rootStoreMock = {
    workflowsStore: {
      get opportunityTypes() {
        return computed(() => mockOpportunityTypes.get()).get();
      },
    },
  } as RootStore;
  record = {
    allEligibleOpportunities: [],
    officerId: "OFFICER1",
    personExternalId: "PERSON1",
    personName: { givenNames: "Real", surname: "Person" },
    pseudonymizedId: "anon1",
    recordId: "us_xx_PERSON1",
    stateCode: "US_XX",
  };
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

const PROPERTIES_FROM_RECORD: [
  keyof JusticeInvolvedPersonBase,
  keyof JusticeInvolvedPersonRecord
][] = [
  ["externalId", "personExternalId"],
  ["assignedStaffId", "officerId"],
  ["fullName", "personName"],
  ["pseudonymizedId", "pseudonymizedId"],
  ["stateCode", "stateCode"],
  ["recordId", "recordId"],
];
test.each(PROPERTIES_FROM_RECORD)(
  "%s reflects record",
  (property, recordKey) => {
    createTestUnit();
    expect(testPerson[property]).toEqual(record[recordKey]);
  }
);

test("display name", () => {
  createTestUnit();
  expect(testPerson.displayName).toBe("Real Person");
});

describe("opportunities", () => {
  let opportunityInstances: TestOpportunity[];

  class TestOpportunity extends OpportunityBase<any, any> {
    constructor(...[person, type, rootStore, ...args]: any[]) {
      super(person, type, rootStore, ...args);
      opportunityInstances.push(this);
    }
  }

  let mockFactory: jest.MockedFunction<OpportunityFactory<any, any>>;

  beforeEach(() => {
    opportunityInstances = [];
    mockFactory = jest
      .fn()
      .mockImplementation(
        (opportunityType, person) =>
          new TestOpportunity(person, opportunityType, rootStoreMock)
      );
    mockOpportunityTypes.set(["LSU"]);
    record.allEligibleOpportunities = ["LSU"];
  });

  test("created", () => {
    createTestUnit(mockFactory);
    expect(opportunityInstances[0]).toEqual(expect.any(TestOpportunity));
    expect(mockFactory).toHaveBeenCalledWith("LSU", testPerson);
    expect(testPerson.potentialOpportunities).toStrictEqual({
      LSU: opportunityInstances[0],
    });
    expect(testPerson.verifiedOpportunities).toStrictEqual({});
    expect(testPerson.opportunitiesEligible).toStrictEqual({});
    expect(testPerson.opportunitiesAlmostEligible).toStrictEqual({});
  });

  describe("successfully", () => {
    beforeEach(() => {
      createTestUnit(mockFactory);
      runInAction(() => {
        const [opp] = opportunityInstances;
        opp.referralSubscription.isHydrated = true;
        opp.updatesSubscription.isHydrated = true;
      });
    });

    test("verified", () => {
      expect(testPerson.potentialOpportunities).toStrictEqual({
        LSU: opportunityInstances[0],
      });
    });

    test("eligible", () => {
      expect(testPerson.opportunitiesEligible).toStrictEqual({
        LSU: opportunityInstances[0],
      });
    });

    test("almost eligible", () => {
      jest
        .spyOn(TestOpportunity.prototype, "almostEligible", "get")
        .mockReturnValue(true);

      expect(testPerson.opportunitiesAlmostEligible).toStrictEqual({
        LSU: opportunityInstances[0],
      });
    });
  });

  describe("fail to be", () => {
    beforeEach(() => {
      createTestUnit(mockFactory);
      runInAction(() => {
        const [opp] = opportunityInstances;
        opp.referralSubscription.isHydrated = true;
        opp.updatesSubscription.isHydrated = false;
        opp.updatesSubscription.error = new Error("test");
      });
    });

    test("verified", () => {
      expect(testPerson.verifiedOpportunities).toStrictEqual({});
    });

    test("eligible", () => {
      expect(testPerson.opportunitiesEligible).toStrictEqual({});
    });

    test("almost eligible", () => {
      jest
        .spyOn(TestOpportunity.prototype, "almostEligible", "get")
        .mockReturnValue(true);

      expect(testPerson.opportunitiesAlmostEligible).toStrictEqual({});
    });
  });

  test("are limited to configured opportunity types", () => {
    mockOpportunityTypes.set(["compliantReporting"]);
    createTestUnit(mockFactory);
    expect(testPerson.potentialOpportunities).toStrictEqual({});
  });

  test("react to config changes", () => {
    createTestUnit(mockFactory);
    mockOpportunityTypes.set(["compliantReporting"]);
    expect(testPerson.potentialOpportunities).toStrictEqual({});
  });

  test("are limited to person's eligibility list", () => {
    mockOpportunityTypes.set([
      "LSU",
      "compliantReporting",
      "earlyTermination",
      "earnedDischarge",
    ]);
    createTestUnit(mockFactory);
    expect(testPerson.potentialOpportunities).toStrictEqual({
      LSU: opportunityInstances[0],
    });
  });

  test("react to changes in person's eligibility list", () => {
    mockOpportunityTypes.set(["LSU", "earlyTermination", "pastFTRD"]);
    createTestUnit(mockFactory);
    testPerson.updateRecord({
      ...record,
      allEligibleOpportunities: ["earlyTermination"],
    });
    expect(opportunityInstances[1]).toEqual(expect.any(TestOpportunity));
    expect(mockFactory).toHaveBeenNthCalledWith(
      2,
      "earlyTermination",
      testPerson
    );
    expect(testPerson.potentialOpportunities).toStrictEqual({
      earlyTermination: opportunityInstances[1],
    });

    // should not re-create existing opportunities
    testPerson.updateRecord({
      ...record,
      allEligibleOpportunities: ["earlyTermination", "pastFTRD"],
    });
    expect(opportunityInstances[2]).toEqual(expect.any(TestOpportunity));
    expect(opportunityInstances.length).toBe(3);
    expect(mockFactory).toHaveBeenNthCalledWith(3, "pastFTRD", testPerson);
    expect(mockFactory.mock.calls.length).toBe(3);
    expect(testPerson.potentialOpportunities).toStrictEqual({
      earlyTermination: opportunityInstances[1],
      pastFTRD: opportunityInstances[2],
    });
  });
});
