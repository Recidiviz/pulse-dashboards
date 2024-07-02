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
import { MockedFunction } from "vitest";

import { StaffRecord } from "~datatypes";

import {
  PersonUpdateRecord,
  WorkflowsJusticeInvolvedPersonRecord,
} from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { JusticeInvolvedPersonBase } from "../JusticeInvolvedPersonBase";
import { OpportunityFactory, OpportunityType } from "../Opportunity";
import { OpportunityBase } from "../Opportunity/OpportunityBase";
import { OpportunityConfiguration } from "../Opportunity/OpportunityConfigurations";
import { CollectionDocumentSubscription } from "../subscriptions";

vi.mock("firebase/firestore");
vi.mock("../subscriptions");

let rootStore: RootStore;
let testPerson: JusticeInvolvedPersonBase;
let record: WorkflowsJusticeInvolvedPersonRecord;
let mockOpportunityTypes: IObservableValue<OpportunityType[]>;

function createTestUnit(
  opportunityFactory: OpportunityFactory<any, any> = () => undefined as any,
) {
  testPerson = new JusticeInvolvedPersonBase(
    record,
    rootStore,
    opportunityFactory,
  );
}

beforeEach(() => {
  configure({ safeDescriptors: false });
  mockOpportunityTypes = observable.box([]);

  rootStore = new RootStore();
  vi.spyOn(
    rootStore.workflowsStore,
    "availableOfficers",
    "get",
  ).mockReturnValue([
    {
      id: "OFFICER1",
      givenNames: "FirstName",
      surname: "LastName",
    } as StaffRecord,
  ]);
  vi.spyOn(rootStore.userStore, "stateCode", "get").mockReturnValue("US_TN");
  vi.spyOn(
    rootStore.workflowsRootStore.opportunityConfigurationStore,
    "enabledOpportunityTypes",
    "get",
  ).mockImplementation(() => {
    return computed(() => mockOpportunityTypes.get()).get();
  });
  record = {
    allEligibleOpportunities: [],
    officerId: "OFFICER1",
    personExternalId: "PERSON1",
    displayId: "dPERSON1",
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
  keyof WorkflowsJusticeInvolvedPersonRecord,
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
  },
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

    get config() {
      return {} as OpportunityConfiguration;
    }
  }

  let mockFactory: MockedFunction<OpportunityFactory<any, any>>;

  beforeEach(() => {
    opportunityInstances = [];
    mockFactory = vi
      .fn()
      .mockImplementation(
        (opportunityType, person) =>
          new TestOpportunity(person, opportunityType, rootStore),
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

  describe("assignedStaffFullName", () => {
    test("with both names", () => {
      createTestUnit();
      expect(testPerson.assignedStaffFullName).toEqual("FirstName LastName");
    });

    test("with only first name", () => {
      vi.spyOn(
        rootStore.workflowsStore,
        "availableOfficers",
        "get",
      ).mockReturnValue([
        {
          id: "OFFICER1",
          givenNames: "FirstName",
        } as StaffRecord,
      ]);
      createTestUnit();
      expect(testPerson.assignedStaffFullName).toEqual("FirstName");
    });

    test("with only last name", () => {
      vi.spyOn(
        rootStore.workflowsStore,
        "availableOfficers",
        "get",
      ).mockReturnValue([
        {
          id: "OFFICER1",
          surname: "LastName",
        } as unknown as StaffRecord,
      ]);
      createTestUnit();
      expect(testPerson.assignedStaffFullName).toEqual("LastName");
    });
  });

  describe("displayPreferredName", () => {
    beforeEach(() => {
      createTestUnit(mockFactory);
    });

    test("with preferred name", () => {
      runInAction(() => {
        testPerson.personUpdatesSubscription = {
          data: { preferredName: "two names" },
        } as unknown as CollectionDocumentSubscription<PersonUpdateRecord>;
        testPerson.personUpdatesSubscription.hydrationState = {
          status: "hydrated",
        };
      });

      expect(testPerson.displayPreferredName).toEqual(
        "Real (Two Names) Person",
      );
    });
    test("without preferred name", () => {
      runInAction(() => {
        testPerson.personUpdatesSubscription = {
          data: { preferredName: null },
        } as unknown as CollectionDocumentSubscription<PersonUpdateRecord>;
        testPerson.personUpdatesSubscription.hydrationState = {
          status: "hydrated",
        };
      });
      expect(testPerson.displayPreferredName).toEqual("Real Person");
    });
    test("when preferred name matches given name", () => {
      runInAction(() => {
        testPerson.personUpdatesSubscription = {
          data: { preferredName: "Real" },
        } as unknown as CollectionDocumentSubscription<PersonUpdateRecord>;
        testPerson.personUpdatesSubscription.hydrationState = {
          status: "hydrated",
        };
      });
      expect(testPerson.displayPreferredName).toEqual("Real Person");
    });
  });

  describe("successfully", () => {
    beforeEach(() => {
      createTestUnit(mockFactory);
      runInAction(() => {
        const [opp] = opportunityInstances;
        opp.referralSubscription.hydrationState = { status: "hydrated" };
        opp.updatesSubscription.hydrationState = { status: "hydrated" };
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
      vi.spyOn(
        TestOpportunity.prototype,
        "almostEligible",
        "get",
      ).mockReturnValue(true);

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
        opp.referralSubscription.hydrationState = { status: "hydrated" };

        opp.updatesSubscription.hydrationState = {
          status: "failed",
          error: new Error("test"),
        };
      });
    });

    test("verified", () => {
      expect(testPerson.verifiedOpportunities).toStrictEqual({});
    });

    test("eligible", () => {
      expect(testPerson.opportunitiesEligible).toStrictEqual({});
    });

    test("almost eligible", () => {
      vi.spyOn(
        TestOpportunity.prototype,
        "almostEligible",
        "get",
      ).mockReturnValue(true);

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
      testPerson,
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
