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

import { and, FieldPath, or, query, where } from "firebase/firestore";
import { observable } from "mobx";
import { Mock } from "vitest";

import { ClientRecord, ResidentRecord } from "~datatypes";

import { usIdResidents } from "../../../tools/fixtures/residents/usIdResidents";
import { WorkflowsSystemConfig } from "../../core/models/types";
import { Client } from "../Client";
import { Resident } from "../Resident";
import { SearchManager } from "../SearchManager";
import { SearchStore } from "../SearchStore";

vi.mock("firebase/firestore");

const queryMock = query as Mock;
const whereMock = where as Mock;
const andMock = and as Mock;
const orMock = or as Mock;
const collectionMock = vi.fn();
const withConverterMock = vi.fn();

let searchStoreMock: SearchStore;
let clientSearchManager: SearchManager;
let residentSearchManager: SearchManager;
let testClient: Client;
let clientRecord: ClientRecord;
let testResident: Resident;
let residentRecord: ResidentRecord;

beforeEach(() => {
  vi.resetAllMocks();

  queryMock.mockReturnValue({ withConverter: withConverterMock });
  whereMock.mockImplementation(
    (_fieldPath, searchOp, selectedSearchIds) =>
      `${searchOp}, ${selectedSearchIds.length === 0 ? "[]" : selectedSearchIds}`,
  );
  orMock.mockImplementation((...args) => args.join("||"));
  andMock.mockImplementation((...args) => args.join("&&"));

  searchStoreMock = observable({
    workflowsStore: {
      systemConfigFor: vi.fn(() => ({
        search: [],
      })),
      systemConfig: vi.fn(() => ({
        search: [],
      })),
      rootStore: {
        currentTenantId: "US_ND",
        firestoreStore: {
          collection: collectionMock,
          doc: vi.fn(),
        },
      },
    },
    clientSearchManager: { queryConstraints: [] },
    residentSearchManager: { queryConstraints: [] },
  }) as unknown as SearchStore;
  clientSearchManager = new SearchManager(searchStoreMock, "CLIENT");
  residentSearchManager = new SearchManager(searchStoreMock, "RESIDENT");
  clientRecord = {
    allEligibleOpportunities: [],
    officerId: "OFFICER1",
    personExternalId: "PERSON1",
    displayId: "PERSON1",
    personName: { givenNames: "Sam", surname: "Alphabetically Second" },
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
    fullName: clientRecord.personName,
  } as Client;
});

describe("queryConstraints", () => {
  test("returns undefined if currentTenandId is missing", () => {
    // @ts-ignore
    searchStoreMock.workflowsStore.rootStore.currentTenantId = undefined;

    expect(clientSearchManager.queryConstraints).toBeUndefined();
  });

  test("returns undefined if no officers are selected", () => {
    // @ts-ignore
    searchStoreMock.selectedSearchIds = [];

    expect(clientSearchManager.queryConstraints).toBeUndefined();
  });

  test("queryConstraints builds the correct query for single searchField", () => {
    const supervisionSystemConfig = {
      search: [{ searchType: "LOCATION", searchField: ["district"] }],
    } as WorkflowsSystemConfig<ClientRecord, any>;
    searchStoreMock.workflowsStore.systemConfigFor = vi.fn(
      () => supervisionSystemConfig,
    );
    // @ts-ignore
    searchStoreMock.selectedSearchIds = ["TEST1", "TEST2"];

    // eslint-disable-next-line
    clientSearchManager.queryConstraints;
    expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_ND");
    expect(whereMock).toHaveBeenCalledWith(new FieldPath("district"), "in", [
      "TEST1",
      "TEST2",
    ]);
    expect(orMock).toHaveBeenCalledWith("in, TEST1,TEST2");
    expect(andMock).toHaveBeenCalledWith("==, US_ND", "in, TEST1,TEST2");
  });

  test("queryConstraints builds the correct query for multiple searchField", () => {
    const supervisionSystemConfig = {
      search: [
        { searchType: "LOCATION", searchField: ["district"] },
        {
          searchType: "OFFICER",
          searchField: ["officerId"],
          searchOp: "fakeOp",
          onlySurfaceEligible: true,
        },
      ],
    } as WorkflowsSystemConfig<ClientRecord, any>;
    searchStoreMock.workflowsStore.systemConfigFor = vi.fn(
      () => supervisionSystemConfig,
    );
    // @ts-ignore
    searchStoreMock.selectedSearchIds = ["TEST1", "TEST2", "OFFICER1"];

    // eslint-disable-next-line
    clientSearchManager.queryConstraints;
    expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_ND");
    expect(whereMock).toHaveBeenCalledWith(new FieldPath("district"), "in", [
      "TEST1",
      "TEST2",
      "OFFICER1",
    ]);
    expect(whereMock).toHaveBeenCalledWith(
      new FieldPath("officerId"),
      "fakeOp",
      ["TEST1", "TEST2", "OFFICER1"],
    );
    expect(orMock).toHaveBeenCalledWith(
      "in, TEST1,TEST2,OFFICER1",
      "fakeOp, TEST1,TEST2,OFFICER1&&!=, []",
    );
    expect(andMock).toHaveBeenCalledWith(
      "==, US_ND",
      "in, TEST1,TEST2,OFFICER1||fakeOp, TEST1,TEST2,OFFICER1&&!=, []",
    );
  });
});

describe("personMatchesSearch", () => {
  test("true with single matching searchField", () => {
    // @ts-ignore
    searchStoreMock.selectedSearchIds = [clientRecord.officerId];
    expect(clientSearchManager.personMatchesSearch(testClient)).toBeTrue();
  });

  test("true with multiple searchFields - both match", () => {
    // @ts-ignore
    searchStoreMock.selectedSearchIds = [
      clientRecord.officerId,
      clientRecord.district,
    ];
    expect(clientSearchManager.personMatchesSearch(testClient)).toBeTrue();
  });

  test("true with multiple searchFields - one matches", () => {
    // @ts-ignore
    searchStoreMock.selectedSearchIds = [
      clientRecord.officerId,
      "A DIFFERENT DISTRICT",
    ];
    expect(clientSearchManager.personMatchesSearch(testClient)).toBeTrue();
  });

  test("false with multiple searchFields - none match", () => {
    // @ts-ignore
    searchStoreMock.selectedSearchIds = [
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
    searchStoreMock.workflowsStore.justiceInvolvedPersons = {
      testClient,
      testResident,
    };
    // @ts-ignore
    searchStoreMock.selectedSearchIds = [
      clientRecord.officerId,
      residentRecord.officerId,
    ];
  });

  test("client matches when activeSystem is ALL", () => {
    searchStoreMock.workflowsStore.activeSystem = "ALL";
    expect(clientSearchManager.matchingPersons).toEqual([testClient]);
  });

  test("client matches when activeSystem is SUPERVISION", () => {
    searchStoreMock.workflowsStore.activeSystem = "SUPERVISION";
    expect(clientSearchManager.matchingPersons).toEqual([testClient]);
  });

  test("client does not match when activeSystem is INCARCERATION", () => {
    searchStoreMock.workflowsStore.activeSystem = "INCARCERATION";
    expect(clientSearchManager.matchingPersons).toEqual([]);
  });

  test("client does not match when person does not match", () => {
    // @ts-ignore
    searchStoreMock.selectedSearchIds = ["A DIFFERENT OFFICER"];
    searchStoreMock.workflowsStore.activeSystem = "SUPERVISION";
    expect(clientSearchManager.matchingPersons).toEqual([]);
  });

  test("resident matches when activeSystem is ALL", () => {
    searchStoreMock.workflowsStore.activeSystem = "ALL";
    expect(residentSearchManager.matchingPersons).toEqual([testResident]);
  });

  test("resident does not match when activeSystem is SUPERVISION", () => {
    searchStoreMock.workflowsStore.activeSystem = "SUPERVISION";
    expect(residentSearchManager.matchingPersons).toEqual([]);
  });

  test("resident matches when activeSystem is INCARCERATION", () => {
    searchStoreMock.workflowsStore.activeSystem = "INCARCERATION";
    expect(residentSearchManager.matchingPersons).toEqual([testResident]);
  });

  test("resident does not match when person does not match", () => {
    // @ts-ignore
    searchStoreMock.selectedSearchIds = ["A DIFFERENT OFFICER"];
    searchStoreMock.workflowsStore.activeSystem = "SUPERVISION";
    expect(residentSearchManager.matchingPersons).toEqual([]);
  });
});

describe("matchingPersonsGrouped", () => {
  let testClient2: Client;
  let clientRecord2: ClientRecord;

  beforeEach(() => {
    clientRecord2 = {
      ...clientRecord,
      personExternalId: "PERSON2",
      displayId: "PERSON2",
      // The two clients have different districts
      district: "OTHER DISTRICT",
      // The two clients have the same officerIds
      officerId: clientRecord.officerId,
      personName: { givenNames: "Jane", surname: "Alphabetically First" },
    };
    testClient2 = {
      record: clientRecord2,
      searchIdValues: [clientRecord2.officerId, clientRecord2.district],
      personType: "CLIENT",
      fullName: clientRecord2.personName,
    } as Client;
    searchStoreMock.workflowsStore.justiceInvolvedPersons = {
      testClient,
      testClient2,
    };
    searchStoreMock.workflowsStore.activeSystem = "ALL";
  });

  test("grouped by searchFieldValue with multiple clients matching multiple search ids", () => {
    const supervisionSystemConfig = {
      search: [
        { searchType: "LOCATION", searchField: ["district"] },
        { searchType: "OFFICER", searchField: ["officerId"] },
      ],
    } as WorkflowsSystemConfig<ClientRecord, any>;
    searchStoreMock.workflowsStore.systemConfigFor = vi.fn(
      () => supervisionSystemConfig,
    );

    // @ts-ignore
    searchStoreMock.selectedSearchIds = [
      clientRecord.officerId,
      clientRecord.district,
    ];
    const expected = {
      // We should see both clients since they have the same officer who is in selectedSearchIds
      OFFICER1: [testClient2, testClient],
      // We should see only the first client since only their district is in selectedSearchIds
      DISTRICT1: [testClient],
    };
    expect(clientSearchManager.matchingPersonsGrouped).toEqual(expected);
  });

  test("grouped by searchField value when one client matches and the other doesn't", () => {
    const supervisionSystemConfig = {
      search: [
        { searchType: "LOCATION", searchField: ["district"] },
        { searchType: "OFFICER", searchField: ["officerId"] },
      ],
    } as WorkflowsSystemConfig<ClientRecord, any>;
    searchStoreMock.workflowsStore.systemConfigFor = vi.fn(
      () => supervisionSystemConfig,
    );
    clientRecord2.officerId = "Some other not-matching officer";
    testClient2 = {
      record: clientRecord2,
      searchIdValues: [clientRecord2.officerId, clientRecord2.district],
      personType: "CLIENT",
      fullName: clientRecord2.personName,
    } as Client;
    searchStoreMock.workflowsStore.justiceInvolvedPersons = {
      testClient,
      testClient2,
    };
    // @ts-ignore
    searchStoreMock.selectedSearchIds = [
      clientRecord.officerId,
      clientRecord.district,
    ];
    // We should see the same client for both search groups since they match both selectedSearchIds
    const expected = {
      OFFICER1: [testClient],
      DISTRICT1: [testClient],
    };
    expect(clientSearchManager.matchingPersonsGrouped).toEqual(expected);
  });

  test("searchFieldValue is adjusted for CRC locations", () => {
    const residentRecords = usIdResidents;
    const incarcerationSystemConfig = {
      search: [
        { searchType: "LOCATION", searchField: ["metadata", "crcFacilities"] },
      ],
    } as WorkflowsSystemConfig<ResidentRecord, any>;
    searchStoreMock.workflowsStore.systemConfigFor = vi.fn(
      () => incarcerationSystemConfig,
    );
    const residents = residentRecords.map((r) => {
      return {
        record: r,
        recordId: r.personExternalId,
        externalId: r.personExternalId,
        personType: "RESIDENT",
        fullName: r.personName,
        // @ts-ignore
        searchIdValues: r.metadata.crcFacilities,
        pseudonymizedId: r.pseudonymizedId,
      } as unknown as Resident;
    });
    searchStoreMock.workflowsStore.justiceInvolvedPersons = {
      [residents[0].pseudonymizedId]: residents[0], // crcFacilities: ["CRC LRC"]
      [residents[1].pseudonymizedId]: residents[1], // crcFacilities: ["CRC LRC", "CRC PRC"],
      [residents[2].pseudonymizedId]: residents[2], // crcFacilities: ["CRC PRC"],
      [residents[3].pseudonymizedId]: residents[3], // crcFacilities: ["CRC LRC", "CRC PRC"],
    };
    // @ts-ignore
    searchStoreMock.selectedSearchIds = ["CRC LRC"];
    const expected = {
      "CRC LRC": [residents[0], residents[1], residents[3]],
    };
    expect(residentSearchManager.matchingPersonsGrouped).toEqual(expected);
  });

  test("searchFieldValue with multiple locations", () => {
    const residentRecords = usIdResidents;
    const incarcerationSystemConfig = {
      search: [
        { searchType: "LOCATION", searchField: ["metadata", "crcFacilities"] },
      ],
    } as WorkflowsSystemConfig<ResidentRecord, any>;
    searchStoreMock.workflowsStore.systemConfigFor = vi.fn(
      () => incarcerationSystemConfig,
    );
    const residents = residentRecords.map((r) => {
      return {
        record: r,
        recordId: r.personExternalId,
        externalId: r.personExternalId,
        personType: "RESIDENT",
        fullName: r.personName,
        // @ts-ignore
        searchIdValues: r.metadata.crcFacilities,
        pseudonymizedId: r.pseudonymizedId,
      } as unknown as Resident;
    });
    searchStoreMock.workflowsStore.justiceInvolvedPersons = {
      [residents[0].pseudonymizedId]: residents[0], // crcFacilities: ["CRC LRC"]
      [residents[1].pseudonymizedId]: residents[1], // crcFacilities: ["CRC LRC", "CRC PRC"],
      [residents[2].pseudonymizedId]: residents[2], // crcFacilities: ["CRC PRC"],
      [residents[3].pseudonymizedId]: residents[3], // crcFacilities: ["CRC LRC", "CRC PRC"],
    };
    // @ts-ignore
    searchStoreMock.selectedSearchIds = ["CRC LRC", "CRC PRC"];
    const expected = {
      "CRC LRC": [residents[0], residents[1], residents[3]],
      "CRC PRC": [residents[2], residents[1], residents[3]],
    };
    expect(residentSearchManager.matchingPersonsGrouped).toEqual(expected);
  });
});

describe("isEnabled", () => {
  test("client isEnabled when activeSystem is ALL", () => {
    searchStoreMock.workflowsStore.activeSystem = "ALL";
    expect(clientSearchManager.isEnabled).toBeTrue();
  });

  test("client isEnabled when activeSystem is SUPERVISION", () => {
    searchStoreMock.workflowsStore.activeSystem = "SUPERVISION";
    expect(clientSearchManager.isEnabled).toBeTrue();
  });

  test("client is not enabled when activeSystem is INCARCERATION", () => {
    searchStoreMock.workflowsStore.activeSystem = "INCARCERATION";
    expect(clientSearchManager.isEnabled).toBeFalse();
  });

  test("resident isEnabled when activeSystem is ALL", () => {
    searchStoreMock.workflowsStore.activeSystem = "ALL";
    expect(residentSearchManager.isEnabled).toBeTrue();
  });

  test("resident is not enabled when activeSystem is SUPERVISION", () => {
    searchStoreMock.workflowsStore.activeSystem = "SUPERVISION";
    expect(residentSearchManager.isEnabled).toBeFalse();
  });

  test("resident isEnabled when activeSystem is INCARCERATION", () => {
    searchStoreMock.workflowsStore.activeSystem = "INCARCERATION";
    expect(residentSearchManager.isEnabled).toBeTrue();
  });
});
