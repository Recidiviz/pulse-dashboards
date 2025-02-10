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

import {
  ClientRecord,
  OpportunityType,
  StaffRecord,
  WorkflowsJusticeInvolvedPersonRecord,
} from "~datatypes";

import { PersonUpdateRecord } from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { Client } from "../Client";
import { JusticeInvolvedPersonBase } from "../JusticeInvolvedPersonBase";
import { OpportunityMapping } from "../Opportunity";
import { OpportunityBase } from "../Opportunity/OpportunityBase";
import { OpportunityConfiguration } from "../Opportunity/OpportunityConfigurations";
import { opportunityConstructors } from "../Opportunity/opportunityConstructors";
import { CollectionDocumentSubscription } from "../subscriptions";
import { JusticeInvolvedPerson } from "../types";

vi.mock("firebase/firestore");
vi.mock("../subscriptions");

let rootStore: RootStore;
let testPerson: JusticeInvolvedPersonBase;
let mockOpportunityTypes: IObservableValue<OpportunityType[]>;
let record: ClientRecord;

function createTestUnit() {
  testPerson = new Client(record, rootStore);
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
    personType: "CLIENT",
  };
});

afterEach(() => {
  configure({ safeDescriptors: true });
  vi.resetAllMocks();
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
      super(person, "JIP_TEST_OPP" as OpportunityType, rootStore, {});
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
    expect(testPerson.opportunityManager).toBeDefined();
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
          data: { preferredName: "Two Names" },
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
    });

    test("eligible", () => {
      vi.spyOn(testPerson, "opportunities", "get").mockReturnValue({
        JIP_TEST_OPP: [
          {
            hydrationState: { status: "hydrated" },
          },
        ],
      } as any as OpportunityMapping);

      expect(testPerson.opportunitiesEligible).toStrictEqual({
        JIP_TEST_OPP: [
          {
            hydrationState: { status: "hydrated" },
          },
        ],
      });
    });

    test("almost eligible", () => {
      vi.spyOn(testPerson, "opportunities", "get").mockReturnValue({
        JIP_TEST_OPP: [
          {
            hydrationState: { status: "hydrated" },
            almostEligible: true,
          },
        ],
      } as any as OpportunityMapping);

      expect(testPerson.opportunitiesAlmostEligible).toStrictEqual({
        JIP_TEST_OPP: [
          {
            hydrationState: { status: "hydrated" },
            almostEligible: true,
          },
        ],
      });
    });
  });

  describe("fail to be", () => {
    beforeEach(() => {
      createTestUnit();

      vi.spyOn(
        testPerson.opportunityManager,
        "hydrationState",
        "get",
      ).mockReturnValue({
        status: "failed",
        error: new Error("test"),
      });
    });

    test("verified", () => {
      expect(testPerson.opportunities).toStrictEqual({});
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
});
