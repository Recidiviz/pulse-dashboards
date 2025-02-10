// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { FieldPath, query, where } from "firebase/firestore";
import { observable } from "mobx";
import { Mock } from "vitest";

import { ClientRecord } from "~datatypes";

import { WorkflowsSystemConfig } from "../../core/models/types";
import { WorkflowsResidentRecord } from "../../FirestoreStore";
import { WorkflowsStore } from "../../WorkflowsStore";
import { Client } from "../Client";
import { Resident } from "../Resident";
import { SearchManager } from "../SearchManager";

vi.mock("firebase/firestore");

const queryMock = query as Mock;
const whereMock = where as Mock;
const collectionMock = vi.fn();
const withConverterMock = vi.fn();

let workflowsStoreMock: WorkflowsStore;
let clientSearchManager: SearchManager;
let residentSearchManager: SearchManager;
let testClient: Client;
let clientRecord: ClientRecord;
let testResident: Resident;
let residentRecord: WorkflowsResidentRecord;

beforeEach(() => {
  vi.resetAllMocks();

  queryMock.mockReturnValue({ withConverter: withConverterMock });
  workflowsStoreMock = observable({
    systemConfigFor: vi.fn(() => ({
      search: [],
    })),
    systemConfig: vi.fn(() => ({
      search: [],
    })),
    clientSearchManager: { queryConstraints: [] },
    residentSearchManager: { queryConstraints: [] },
    rootStore: {
      currentTenantId: "US_ND",
      firestoreStore: {
        collection: collectionMock,
        doc: vi.fn(),
      },
    },
  }) as unknown as WorkflowsStore;
  clientSearchManager = new SearchManager(workflowsStoreMock, "CLIENT");
  residentSearchManager = new SearchManager(workflowsStoreMock, "RESIDENT");
  clientRecord = {
    allEligibleOpportunities: [],
    officerId: "OFFICER1",
    personExternalId: "PERSON1",
    displayId: "PERSON1",
    personName: { givenNames: "Real", surname: "Person" },
    pseudonymizedId: "anon1",
    recordId: "us_xx_PERSON1",
    stateCode: "US_ND",
    personType: "CLIENT",
    district: "DISTRICT1",
  };
  testClient = {
    record: clientRecord,
    searchIdValues: [clientRecord.officerId],
    personType: "CLIENT",
  } as Client;
});

describe("queryConstraints", () => {
  test("returns undefined if currentTenandId is missing", () => {
    // @ts-ignore
    workflowsStoreMock.rootStore.currentTenantId = undefined;

    expect(clientSearchManager.queryConstraints).toBeUndefined();
  });

  test("returns undefined if no officers are selected", () => {
    // @ts-ignore
    workflowsStoreMock.selectedSearchIds = [];

    expect(clientSearchManager.queryConstraints).toBeUndefined();
  });

  test("builds the correct query", () => {
    const supervisionSystemConfig = {
      search: [{ searchType: "LOCATION", searchField: ["district"] }],
    } as WorkflowsSystemConfig<ClientRecord, any>;
    workflowsStoreMock.systemConfigFor = vi.fn(() => supervisionSystemConfig);
    // @ts-ignore
    workflowsStoreMock.selectedSearchIds = ["TEST1", "TEST2"];
    const constraints = clientSearchManager.queryConstraints;

    expect(constraints).toHaveLength(2);
    expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_ND");
    expect(whereMock).toHaveBeenCalledWith(new FieldPath("district"), "in", [
      "TEST1",
      "TEST2",
    ]);
  });
});

describe("personMatchesSearch", () => {
  test("true with single matching searchField", () => {
    // @ts-ignore
    workflowsStoreMock.selectedSearchIds = [clientRecord.officerId];
    expect(clientSearchManager.personMatchesSearch(testClient)).toBeTrue();
  });

  test("true with multiple searchFields - both match", () => {
    // @ts-ignore
    workflowsStoreMock.selectedSearchIds = [
      clientRecord.officerId,
      clientRecord.district,
    ];
    expect(clientSearchManager.personMatchesSearch(testClient)).toBeTrue();
  });

  test("true with multiple searchFields - one matches", () => {
    // @ts-ignore
    workflowsStoreMock.selectedSearchIds = [
      clientRecord.officerId,
      "A DIFFERENT DISTRICT",
    ];
    expect(clientSearchManager.personMatchesSearch(testClient)).toBeTrue();
  });

  test("false with multiple searchFields - none match", () => {
    // @ts-ignore
    workflowsStoreMock.selectedSearchIds = [
      "A DIFFERENT OFFICER",
      "A DIFFERENT DISTRICT",
    ];
    expect(clientSearchManager.personMatchesSearch(testClient)).toBeFalse();
  });
});

describe("matchingPersons", () => {
  beforeEach(() => {
    residentRecord = {
      allEligibleOpportunities: [],
      officerId: "OFFICER1",
      personExternalId: "PERSON1",
      displayId: "dPERSON1",
      personName: { givenNames: "Real", surname: "Person" },
      pseudonymizedId: "anon1",
      gender: "MALE",
      recordId: "us_xx_PERSON1",
      stateCode: "US_XX",
      facilityId: "FACILITY1",
      personType: "RESIDENT",
      metadata: {},
    };
    testResident = {
      record: residentRecord,
      searchIdValues: [residentRecord.officerId],
      personType: "RESIDENT",
    } as Resident;
    workflowsStoreMock.justiceInvolvedPersons = { testClient, testResident };
    // @ts-ignore
    workflowsStoreMock.selectedSearchIds = [
      clientRecord.officerId,
      residentRecord.officerId,
    ];
  });

  test("client matches when activeSystem is ALL", () => {
    workflowsStoreMock.activeSystem = "ALL";
    expect(clientSearchManager.matchingPersons).toEqual([testClient]);
  });

  test("client matches when activeSystem is SUPERVISION", () => {
    workflowsStoreMock.activeSystem = "SUPERVISION";
    expect(clientSearchManager.matchingPersons).toEqual([testClient]);
  });

  test("client does not match when activeSystem is INCARCERATION", () => {
    workflowsStoreMock.activeSystem = "INCARCERATION";
    expect(clientSearchManager.matchingPersons).toEqual([]);
  });

  test("client does not match when person does not match", () => {
    // @ts-ignore
    workflowsStoreMock.selectedSearchIds = ["A DIFFERENT OFFICER"];
    workflowsStoreMock.activeSystem = "SUPERVISION";
    expect(clientSearchManager.matchingPersons).toEqual([]);
  });

  test("resident matches when activeSystem is ALL", () => {
    workflowsStoreMock.activeSystem = "ALL";
    expect(residentSearchManager.matchingPersons).toEqual([testResident]);
  });

  test("resident does not match when activeSystem is SUPERVISION", () => {
    workflowsStoreMock.activeSystem = "SUPERVISION";
    expect(residentSearchManager.matchingPersons).toEqual([]);
  });

  test("resident matches when activeSystem is INCARCERATION", () => {
    workflowsStoreMock.activeSystem = "INCARCERATION";
    expect(residentSearchManager.matchingPersons).toEqual([testResident]);
  });

  test("resident does not match when person does not match", () => {
    // @ts-ignore
    workflowsStoreMock.selectedSearchIds = ["A DIFFERENT OFFICER"];
    workflowsStoreMock.activeSystem = "SUPERVISION";
    expect(residentSearchManager.matchingPersons).toEqual([]);
  });
});

describe("isEnabled", () => {
  test("client isEnabled when activeSystem is ALL", () => {
    workflowsStoreMock.activeSystem = "ALL";
    expect(clientSearchManager.isEnabled).toBeTrue();
  });

  test("client isEnabled when activeSystem is SUPERVISION", () => {
    workflowsStoreMock.activeSystem = "SUPERVISION";
    expect(clientSearchManager.isEnabled).toBeTrue();
  });

  test("client is not enabled when activeSystem is INCARCERATION", () => {
    workflowsStoreMock.activeSystem = "INCARCERATION";
    expect(clientSearchManager.isEnabled).toBeFalse();
  });

  test("resident isEnabled when activeSystem is ALL", () => {
    workflowsStoreMock.activeSystem = "ALL";
    expect(residentSearchManager.isEnabled).toBeTrue();
  });

  test("resident is not enabled when activeSystem is SUPERVISION", () => {
    workflowsStoreMock.activeSystem = "SUPERVISION";
    expect(residentSearchManager.isEnabled).toBeFalse();
  });

  test("resident isEnabled when activeSystem is INCARCERATION", () => {
    workflowsStoreMock.activeSystem = "INCARCERATION";
    expect(residentSearchManager.isEnabled).toBeTrue();
  });
});
