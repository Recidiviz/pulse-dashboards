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

import {
  computed,
  configure,
  IObservableValue,
  observable,
  runInAction,
} from "mobx";

import { StaffRecord } from "~datatypes";

import {
  PersonUpdateRecord,
  WorkflowsJusticeInvolvedPersonRecord,
} from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { JusticeInvolvedPersonBase } from "../JusticeInvolvedPersonBase";
import { OpportunityType } from "../Opportunity";
import { OpportunityBase } from "../Opportunity/OpportunityBase";
import { OpportunityConfiguration } from "../Opportunity/OpportunityConfigurations";
import { opportunityConstructors } from "../Opportunity/opportunityConstructors";
import { CollectionDocumentSubscription } from "../subscriptions";
import { JusticeInvolvedPerson } from "../types";

vi.mock("firebase/firestore");
vi.mock("../subscriptions");

let rootStore: RootStore;
let testPerson: JusticeInvolvedPersonBase;
let record: WorkflowsJusticeInvolvedPersonRecord;
let mockOpportunityTypes: IObservableValue<OpportunityType[]>;

function createTestUnit() {
  testPerson = new JusticeInvolvedPersonBase(record, rootStore);
}

beforeEach(() => {
  configure({ safeDescriptors: false });
  mockOpportunityTypes = observable.box(["JIP_TEST_OPP" as OpportunityType]);

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
    constructor(person: JusticeInvolvedPerson) {
      super(person, "JIP_TEST_OPP" as OpportunityType, rootStore);
      opportunityInstances.push(this);
    }

    get config() {
      return {} as OpportunityConfiguration;
    }
  }

  beforeEach(() => {
    opportunityInstances = [];
    record.allEligibleOpportunities = ["JIP_TEST_OPP" as OpportunityType];
    // @ts-ignore
    opportunityConstructors["JIP_TEST_OPP" as any] = TestOpportunity;
    // @ts-ignore
    opportunityConstructors["JIP_TEST_OPP2" as any] = TestOpportunity;
    // @ts-ignore
    opportunityConstructors["JIP_TEST_OPP3" as any] = TestOpportunity;
  });

  test("created", () => {
    createTestUnit();
    expect(opportunityInstances[0]).toEqual(expect.any(TestOpportunity));
    expect(testPerson.potentialOpportunities).toStrictEqual({
      JIP_TEST_OPP: opportunityInstances[0],
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
      createTestUnit();
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
      createTestUnit();
      runInAction(() => {
        const [opp] = opportunityInstances;
        opp.referralSubscription.hydrationState = { status: "hydrated" };
        opp.updatesSubscription.hydrationState = { status: "hydrated" };
      });
    });

    test("verified", () => {
      expect(testPerson.verifiedOpportunities).toStrictEqual({
        JIP_TEST_OPP: opportunityInstances[0],
      });
    });

    test("eligible", () => {
      expect(testPerson.opportunitiesEligible).toStrictEqual({
        JIP_TEST_OPP: opportunityInstances[0],
      });
    });

    test("almost eligible", () => {
      vi.spyOn(
        opportunityInstances[0],
        "almostEligible",
        "get",
      ).mockReturnValue(true);

      expect(testPerson.opportunitiesAlmostEligible).toStrictEqual({
        JIP_TEST_OPP: opportunityInstances[0],
      });
    });
  });

  describe("fail to be", () => {
    beforeEach(() => {
      createTestUnit();
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
    createTestUnit();
    expect(testPerson.potentialOpportunities).toStrictEqual({});
  });

  test("react to config changes", () => {
    createTestUnit();
    mockOpportunityTypes.set(["compliantReporting"]);
    expect(testPerson.potentialOpportunities).toStrictEqual({});
  });

  test("are limited to person's eligibility list", () => {
    mockOpportunityTypes.set([
      "JIP_TEST_OPP" as OpportunityType,
      "compliantReporting",
      "earlyTermination",
      "earnedDischarge",
    ]);
    createTestUnit();
    expect(testPerson.potentialOpportunities).toStrictEqual({
      JIP_TEST_OPP: opportunityInstances[0],
    });
  });

  test("react to changes in person's eligibility list", () => {
    mockOpportunityTypes.set([
      "JIP_TEST_OPP" as OpportunityType,
      "JIP_TEST_OPP2" as OpportunityType,
      "JIP_TEST_OPP3" as OpportunityType,
    ]);
    createTestUnit();
    testPerson.updateRecord({
      ...record,
      allEligibleOpportunities: ["JIP_TEST_OPP2" as OpportunityType],
    });
    expect(opportunityInstances[1]).toEqual(expect.any(TestOpportunity));
    expect(testPerson.potentialOpportunities).toStrictEqual({
      JIP_TEST_OPP2: opportunityInstances[1],
    });

    // should not re-create existing opportunities
    testPerson.updateRecord({
      ...record,
      allEligibleOpportunities: [
        "JIP_TEST_OPP2" as OpportunityType,
        "JIP_TEST_OPP3" as OpportunityType,
      ],
    });
    expect(opportunityInstances[2]).toEqual(expect.any(TestOpportunity));
    expect(opportunityInstances.length).toBe(3);
    expect(testPerson.potentialOpportunities).toStrictEqual({
      JIP_TEST_OPP2: opportunityInstances[1],
      JIP_TEST_OPP3: opportunityInstances[2],
    });
  });
});
