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

import { query, where } from "firebase/firestore";
import { observable, runInAction } from "mobx";
import { Mock } from "vitest";

import { ClientRecord, ResidentRecord } from "~datatypes";

import { WorkflowsSystemConfig } from "../../../core/models/types";
import { WorkflowsStore } from "../../WorkflowsStore";
import { CaseloadSubscription } from "../CaseloadSubscription";

vi.mock("firebase/firestore");

const queryMock = query as Mock;
const whereMock = where as Mock;
const collectionMock = vi.fn();
const withConverterMock = vi.fn();

let workflowsStoreMock: WorkflowsStore;
let sub: CaseloadSubscription<ClientRecord>;
let residentSub: CaseloadSubscription<ResidentRecord>;

const supervisionSystemConfig = {
  search: [{ searchType: "LOCATION", searchField: ["district"] }],
} as WorkflowsSystemConfig<ClientRecord, any>;

beforeEach(() => {
  vi.resetAllMocks();

  queryMock.mockReturnValue({ withConverter: withConverterMock });

  workflowsStoreMock = observable({
    selectedSearchIds: ["TEST1"],
    systemConfigFor: vi.fn(() => ({
      search: [{ searchField: "officerId" }],
    })),
    clientSearchManager: { queryConstraints: [] },
    residentSearchManager: { queryConstraints: undefined },
    rootStore: {
      currentTenantId: "US_ND",
      firestoreStore: {
        collection: collectionMock,
      },
    },
  }) as unknown as WorkflowsStore;
  sub = new CaseloadSubscription<ClientRecord>(
    workflowsStoreMock,
    { key: "clients" },
    "CLIENT",
  );
  residentSub = new CaseloadSubscription<ResidentRecord>(
    workflowsStoreMock,
    { key: "residents" },
    "RESIDENT",
  );
});

test("dataSource queries firestore when necessary data is present", () => {
  runInAction(() => {
    workflowsStoreMock.systemConfigFor = vi.fn(() => supervisionSystemConfig);
    // @ts-ignore
    workflowsStoreMock.selectedSearchIds = ["TEST1", "DISTRICT1"];
  });
  sub.subscribe();

  expect(collectionMock).toHaveBeenCalledWith({ key: "clients" });
  expect(queryMock).toHaveBeenCalled();
});

test("dataSource is undefined if queryConstraints are undefined", () => {
  runInAction(() => {
    // @ts-ignore
    workflowsStoreMock.clientSearchManager = { queryConstraints: undefined };
  });

  sub.subscribe();

  expect(sub.dataSource).toBeUndefined();
  expect(collectionMock).not.toHaveBeenCalled();
  expect(whereMock).not.toHaveBeenCalled();
  expect(queryMock).not.toHaveBeenCalled();
});

test("dataSource reacts to observables", () => {
  residentSub.subscribe();
  expect(queryMock).not.toHaveBeenCalled();

  runInAction(() => {
    // @ts-ignore
    workflowsStoreMock.rootStore.currentTenantId = "US_TN";
    // @ts-ignore
    workflowsStoreMock.selectedSearchIds = ["TEST1", "TEST2"];
    workflowsStoreMock.residentSearchManager = {
      // @ts-ignore
      queryConstraints: [whereMock],
    };
  });
  expect(queryMock).toHaveBeenCalled();
});

test("dataSource can be unset and reset", () => {
  sub.subscribe();

  runInAction(() => {
    // @ts-ignore
    workflowsStoreMock.selectedSearchIds = [];
  });

  expect(sub.dataSource).toBeUndefined();

  runInAction(() => {
    // @ts-ignore
    workflowsStoreMock.rootStore.currentTenantId = "US_TN";
    // @ts-ignore
    workflowsStoreMock.selectedSearchIds = ["TEST1", "TEST2"];
  });

  expect(queryMock).toHaveBeenCalled();
});

test("FirestoreConverter inserts inferred properties when reading snapshot", () => {
  runInAction(() => {
    workflowsStoreMock.clientSearchManager = {
      // @ts-ignore
      queryConstraints: {},
    };
  });

  const mockRecord = {
    foo: "bar",
  };
  const mockDocumentSnapshot = {
    id: "test123",
    data: () => mockRecord,
  };

  sub.subscribe();

  const converter = withConverterMock.mock.calls[0][0];
  expect(converter.fromFirestore(mockDocumentSnapshot)).toEqual({
    foo: "bar",
    recordId: "test123",
    personType: "CLIENT",
  });
});
